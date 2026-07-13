import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function mediaQuery(media: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("Modal", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(window.matchMedia).mockImplementation((query) =>
      mediaQuery(query, query.includes("dark")),
    );
  });

  it("keeps the dialog mounted while its exit motion completes", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Modal open title="Example" onClose={vi.fn()}>
        Content
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");

    rerender(
      <Modal open={false} title="Example" onClose={vi.fn()}>
        Content
      </Modal>,
    );

    expect(container.querySelector('[role="dialog"]')).toHaveAttribute("data-state", "closed");
    act(() => vi.advanceTimersByTime(180));
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Example" onClose={onClose}>
        Content
      </Modal>,
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not wait for exit motion when reduced motion is requested", () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockImplementation((query) => mediaQuery(query, true));
    const { container, rerender } = render(
      <Modal open title="Example" onClose={vi.fn()}>
        Content
      </Modal>,
    );

    rerender(
      <Modal open={false} title="Example" onClose={vi.fn()}>
        Content
      </Modal>,
    );
    act(() => vi.runOnlyPendingTimers());

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
