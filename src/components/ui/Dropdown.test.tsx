import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

function renderDropdown() {
  return render(
    <Dropdown aria-label="More options" triggerIcon="more" triggerLabel="Open menu">
      <button type="button">Item</button>
    </Dropdown>,
  );
}

const trigger = () => screen.getByRole("button", { name: "Open menu" });
const panel = () => screen.queryByRole("dialog", { name: "More options" });

/** A press as a browser delivers it: pointerdown, then click. */
function press(element: Element) {
  fireEvent.pointerDown(element);
  fireEvent.click(element);
}

describe("Dropdown", () => {
  it("opens the panel when the trigger is clicked", () => {
    renderDropdown();
    expect(panel()).not.toBeInTheDocument();
    press(trigger());
    expect(panel()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the panel when the trigger is clicked again (no double-toggle)", () => {
    renderDropdown();
    press(trigger());
    press(trigger());
    expect(panel()).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when Escape is pressed", () => {
    renderDropdown();
    press(trigger());
    expect(panel()).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(panel()).not.toBeInTheDocument();
  });

  it("closes on a press outside the container", () => {
    renderDropdown();
    press(trigger());
    expect(panel()).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(panel()).not.toBeInTheDocument();
  });

  it("stays open for a press inside the panel", () => {
    renderDropdown();
    press(trigger());
    press(screen.getByRole("button", { name: "Item" }));
    expect(panel()).toBeInTheDocument();
  });
});
