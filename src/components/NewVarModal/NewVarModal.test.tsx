import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewVarModal } from "./NewVarModal";

describe("NewVarModal input validation", () => {
  it("blocks invalid names and values before staging", () => {
    const onStage = vi.fn();
    render(
      <NewVarModal vars={[]} elevated personalScope="User" onStage={onStage} onClose={vi.fn()} />,
    );
    const name = screen.getByLabelText("Name");
    const value = screen.getByLabelText("Value");
    const stage = screen.getByRole("button", { name: "Stage new variable" });
    fireEvent.change(name, { target: { value: "BAD=NAME" } });
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(stage).toBeDisabled();
    fireEvent.change(name, { target: { value: "VALID" } });
    fireEvent.change(value, { target: { value: "secret\0value" } });
    expect(value).toHaveAttribute("aria-invalid", "true");
    expect(stage).toBeDisabled();
    expect(onStage).not.toHaveBeenCalled();
  });

  it("preserves Unicode names and whitespace and accepts empty values", () => {
    const onStage = vi.fn();
    render(
      <NewVarModal vars={[]} elevated personalScope="User" onStage={onStage} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: " 日本語 " } });
    fireEvent.click(screen.getByRole("button", { name: "Stage new variable" }));
    expect(onStage).toHaveBeenCalledWith(" 日本語 ", "User", "", "Auto");
  });
});
