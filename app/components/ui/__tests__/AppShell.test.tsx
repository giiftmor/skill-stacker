import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell, { SIDEBAR_STORAGE_KEY } from "../AppShell";
import AppSidebar from "../Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cvs",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

let narrow = false;

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: narrow,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

beforeEach(() => {
  narrow = false;
  window.localStorage.clear();
});

describe("AppSidebar", () => {
  it("groups navigation by task with section headings in expanded mode", () => {
    render(<AppSidebar active="cvs" cvId={1} />);

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("This CV")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("omits the This CV group when no cv is open", () => {
    render(<AppSidebar active="cvs" />);

    expect(screen.queryByText("This CV")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-edit-cv")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-preview")).not.toBeInTheDocument();
  });

  it("keeps coming-soon rows aria-disabled with stable testids", () => {
    render(<AppSidebar active="cvs" />);

    for (const label of [
      "Dashboard",
      "Tailor queue",
      "Templates",
      "Shared",
      "Settings",
      "Help",
    ]) {
      const testid = `nav-soon-${label.toLowerCase().replace(/\s+/g, "-")}`;
      expect(screen.getByTestId(testid)).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  });

  it("collapsed mode keeps 40px hit targets and sr-only labels", () => {
    render(<AppSidebar active="cvs" collapsed />);

    const myCvs = screen.getByTestId("nav-my-cvs");
    expect(myCvs).toHaveClass("min-h-10");
    expect(within(myCvs).getByText("My CVs")).toHaveClass("sr-only");
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("renders a full-height non-scrollable sidebar with a footer", () => {
    render(<AppSidebar active="cvs" />);

    const aside = screen.getByTestId("app-sidebar");
    expect(aside).toHaveClass("h-[calc(100vh-3.5rem)]");
    expect(aside).not.toHaveClass("overflow-y-auto");
    expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument();
    expect(screen.getByTestId("account-container")).toBeInTheDocument();
  });

  it("keeps the collapse toggle inside the footer", () => {
    render(<AppSidebar active="cvs" />);

    const footer = screen.getByTestId("sidebar-footer");
    expect(within(footer).getByTestId("sidebar-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("AppShell", () => {
  it("persists the collapsed choice and toggles the sidebar", () => {
    render(
      <AppShell active="cvs">
        <div>content</div>
      </AppShell>,
    );

    const toggle = screen.getByTestId("sidebar-toggle");
    expect(screen.getByTestId("app-sidebar")).not.toHaveClass("w-14");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);

    expect(screen.getByTestId("app-sidebar")).toHaveClass("w-14");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("1");
  });

  it("restores a persisted collapsed preference on mount", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "1");

    render(
      <AppShell active="cvs">
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("app-sidebar")).toHaveClass("w-14");
  });

  it("auto-collapses on a narrow viewport when no preference is saved", () => {
    narrow = true;

    render(
      <AppShell active="cvs">
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("app-sidebar")).toHaveClass("w-14");
  });

  it("renders the command-menu button only when onOpenCommand is passed", () => {
    const onOpenCommand = () => {};
    render(
      <AppShell active="edit" cvId={1} onOpenCommand={onOpenCommand}>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("open-command")).toBeInTheDocument();
    expect(screen.getByTestId("open-command")).toHaveClass("h-10", "w-10");
  });

  it("hides the command-menu button when onOpenCommand is omitted", () => {
    render(
      <AppShell active="cvs">
        <div>content</div>
      </AppShell>,
    );

    expect(screen.queryByTestId("open-command")).not.toBeInTheDocument();
  });

  it("keeps a 40px hit target for the collapse toggle", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "1");

    render(
      <AppShell active="cvs">
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar-toggle")).toHaveClass("h-10", "w-10");
  });
});
