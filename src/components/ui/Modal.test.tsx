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

  // The exit motion is tested in the browser (Modal.stories.tsx, ExitMotion):
  // it is timed by CSS, which jsdom does not load.

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
    const { rerender } = render(
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

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders outside transformed or clipped ancestors", () => {
    render(
      <div className="overflow-hidden transform-gpu">
        <Modal open title="Example" onClose={vi.fn()}>
          Content
        </Modal>
      </div>,
    );

    expect(screen.getByRole("dialog").parentElement).toBe(document.body);
  });
});
