import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

function renderDropdown() {
  return render(
    <Dropdown
      aria-label="More options"
      trigger={(triggerProps) => (
        <button type="button" {...triggerProps}>
          Trigger
        </button>
      )}
    >
      <button type="button">Item</button>
    </Dropdown>,
  );
}

describe("Dropdown", () => {
  it("opens the panel when the trigger is clicked", () => {
    renderDropdown();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("closes the panel when the trigger is clicked again", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Trigger"));
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByRole("group")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("closes on a click outside the container", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByRole("group")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("does not close from a click on the trigger itself (no double-toggle)", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByRole("group")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("Trigger"));
    expect(screen.getByRole("group")).toBeInTheDocument();
  });
});
