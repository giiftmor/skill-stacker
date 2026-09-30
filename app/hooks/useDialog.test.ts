import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDialog } from "./useDialog";

function Dialog({
  onClose,
  initialFocus,
}: {
  onClose: () => void;
  initialFocus?: "surface";
}) {
  const { dialogRef } = useDialog(true, onClose, { initialFocus });
  return createElement(
    "div",
    {
      ref: dialogRef,
      role: "dialog",
      "aria-modal": "true",
      tabIndex: -1,
    },
    createElement("button", { type: "button" }, "First"),
    createElement("button", { type: "button" }, "Second"),
  );
}

function Opener({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const { dialogRef } = useDialog(open, onClose);
  return createElement(
    "div",
    null,
    createElement(
      "button",
      { type: "button", onClick: () => setOpen((v) => !v) },
      "Open",
    ),
    open
      ? createElement(
          "div",
          { ref: dialogRef, role: "dialog", "aria-modal": "true" },
          createElement("button", { type: "button" }, "Inside"),
        )
      : null,
  );
}

describe("useDialog", () => {
  it("moves focus to the first focusable element on open", () => {
    render(createElement(Dialog, { onClose: () => {} }));
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "First" }),
    );
  });

  it("moves focus to the dialog surface when initialFocus is surface", () => {
    render(
      createElement(Dialog, { onClose: () => {}, initialFocus: "surface" }),
    );

    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("wraps backwards from the surface to the last focusable", () => {
    render(
      createElement(Dialog, { onClose: () => {}, initialFocus: "surface" }),
    );
    expect(document.activeElement).toBe(screen.getByRole("dialog"));

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Second" }),
    );
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(createElement(Dialog, { onClose }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab and Shift+Tab inside the dialog", () => {
    render(createElement(Dialog, { onClose: () => {} }));
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    expect(document.activeElement).toBe(first);

    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it("restores focus to the opener when the dialog unmounts", () => {
    render(createElement(Opener, { onClose: () => {} }));
    const opener = screen.getByRole("button", { name: "Open" });

    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Inside" }),
    );

    fireEvent.click(opener);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });
});
