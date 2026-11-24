import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { ResizeHandle } from "./ResizeHandle";

const opts = { storageKey: "envarly-test-width", defaultWidth: 300, min: 260, max: 480 } as const;

function Panel({ edge }: { edge: "left" | "right" }) {
  const { width, isDragging, splitterProps } = useResizableWidth(opts);
  return (
    <aside id="panel" data-width={width} data-dragging={isDragging || undefined}>
      <ResizeHandle
        edge={edge}
        controls="panel"
        aria-label="Resize panel"
        splitterProps={splitterProps}
      />
    </aside>
  );
}

const panel = () => document.getElementById("panel") as HTMLElement;
const handle = () => screen.getByRole("separator");
const width = () => Number(panel().dataset.width);

// jsdom has no pointer capture; Hozo's drag calls it on the handle.
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: () => true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function drag(from: number, to: number, end = true) {
  const init = { pointerId: 1, button: 0, isPrimary: true };
  fireEvent.pointerDown(handle(), { ...init, clientX: from });
  fireEvent.pointerMove(handle(), { ...init, clientX: to });
  act(() => vi.advanceTimersToNextFrame());
  if (end) fireEvent.pointerUp(handle(), { ...init, clientX: to });
}

describe("ResizeHandle", () => {
  it("names the handle with the label as given and points it at its panel", () => {
    render(<Panel edge="right" />);
    expect(handle()).toHaveAccessibleName("Resize panel");
    expect(handle()).toHaveAttribute("aria-controls", "panel");
    expect(handle()).toHaveAttribute("aria-valuenow", "300");
    expect(handle()).toHaveAttribute("aria-valuemin", "260");
    expect(handle()).toHaveAttribute("aria-valuemax", "480");
    expect(handle()).toHaveAttribute("aria-valuetext", "300");
  });

  it("grows on drag right for a panel it sits on the right edge of", () => {
    render(<Panel edge="right" />);
    drag(100, 150);
    expect(width()).toBe(350);
  });

  it("shrinks on drag right for a panel it sits on the left edge of", () => {
    render(<Panel edge="left" />);
    drag(100, 130);
    expect(width()).toBe(270);
  });

  it("clamps during drag", () => {
    render(<Panel edge="right" />);
    drag(100, 1000);
    expect(width()).toBe(480);
  });

  it("is dragging until pointer up, and saves the width only then", () => {
    render(<Panel edge="right" />);
    drag(100, 150, false);
    expect(panel()).toHaveAttribute("data-dragging");
    expect(localStorage.getItem("envarly-test-width")).toBe("300");
    fireEvent.pointerUp(handle(), { pointerId: 1, button: 0, isPrimary: true, clientX: 150 });
    expect(panel()).not.toHaveAttribute("data-dragging");
    expect(localStorage.getItem("envarly-test-width")).toBe("350");
  });

  it("ArrowRight grows a panel it sits on the right edge of", () => {
    render(<Panel edge="right" />);
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(width()).toBe(308);
  });

  it("ArrowLeft grows a panel it sits on the left edge of", () => {
    render(<Panel edge="left" />);
    fireEvent.keyDown(handle(), { key: "ArrowLeft" });
    expect(width()).toBe(308);
  });

  it("ArrowRight with shift takes a larger step", () => {
    render(<Panel edge="right" />);
    fireEvent.keyDown(handle(), { key: "ArrowRight", shiftKey: true });
    expect(width()).toBe(332);
  });

  it("Home jumps to min, End jumps to max", () => {
    render(<Panel edge="right" />);
    fireEvent.keyDown(handle(), { key: "End" });
    expect(width()).toBe(480);
    fireEvent.keyDown(handle(), { key: "Home" });
    expect(width()).toBe(260);
  });

  it("saves a width set from the keyboard straight away", () => {
    render(<Panel edge="right" />);
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(panel()).not.toHaveAttribute("data-dragging");
    expect(localStorage.getItem("envarly-test-width")).toBe("308");
  });
});
