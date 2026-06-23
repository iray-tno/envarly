import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DiffEntry } from "../../lib/diff";
import { DiffPanel } from "./DiffPanel";

const added: DiffEntry = { kind: "added", name: "NEW_VAR", scope: "User", value: "hello" };
const removed: DiffEntry = { kind: "removed", name: "OLD_VAR", scope: "User", value: "bye" };
const changed: DiffEntry = {
  kind: "changed",
  name: "JAVA_HOME",
  scope: "System",
  oldValue: "C:\\jdk17",
  newValue: "C:\\jdk21",
};

const entries: DiffEntry[] = [added, removed, changed];

describe("DiffPanel", () => {
  it("renders all entries", () => {
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText("NEW_VAR")).toBeInTheDocument();
    expect(screen.getByText("OLD_VAR")).toBeInTheDocument();
    expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
  });

  it("all checkboxes start checked (accept by default)", () => {
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    for (const cb of checkboxes) {
      expect(cb).toBeChecked();
    }
  });

  it("shows kind labels", () => {
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.getByText("Removed")).toBeInTheDocument();
    expect(screen.getByText("Changed")).toBeInTheDocument();
  });

  it("calls onApply with all accepted when none unchecked", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<DiffPanel entries={entries} onApply={onApply} onDismiss={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(entries, []);
  });

  it("unchecking an entry moves it to reverted", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<DiffPanel entries={entries} onApply={onApply} onDismiss={vi.fn()} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // uncheck NEW_VAR
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith([removed, changed], [added]);
  });

  it("Deselect all unchecks all entries", async () => {
    const user = userEvent.setup();
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /deselect all/i }));
    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked();
    }
  });

  it("Select all re-checks all entries", async () => {
    const user = userEvent.setup();
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    // uncheck first
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: "Select all" }));
    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).toBeChecked();
    }
  });

  it("calls onDismiss when Dismiss button clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows stat counts in header", () => {
    render(<DiffPanel entries={entries} onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/\+1 added/i)).toBeInTheDocument();
    expect(screen.getByText(/−1 removed/i)).toBeInTheDocument();
    expect(screen.getByText(/~1 changed/i)).toBeInTheDocument();
  });
});
