import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ThemeToggle from "../../ui/ThemeToggle";
import ThemeProvider from "../ThemeProvider";

const STORAGE_KEY = "spectres:theme";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  window.localStorage.clear();
});

describe("ThemeProvider", () => {
  it("renders its children and applies no theme attribute by default", () => {
    render(<ThemeProvider>content</ThemeProvider>);

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("restores a saved dark preference on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");

    render(<ThemeProvider>content</ThemeProvider>);

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ignores a saved value that is not a known theme", () => {
    window.localStorage.setItem(STORAGE_KEY, "sepia");

    render(<ThemeProvider>content</ThemeProvider>);

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe("ThemeToggle", () => {
  it("flips the document theme and persists the choice on click", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle color theme" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.querySelector(".lucide-sun")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle.querySelector(".lucide-moon")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.querySelector(".lucide-sun")).toBeInTheDocument();
  });

  it("shows the saved preference as the current theme on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Toggle color theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a 40px hit target", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Toggle color theme" }),
    ).toHaveClass("h-10", "w-10");
  });
});
