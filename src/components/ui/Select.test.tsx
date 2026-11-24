import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
] as const;

describe("Select", () => {
  it("reports the chosen value", () => {
    const onValueChange = vi.fn();
    render(
      <Select aria-label="Letter" options={options} value="a" onValueChange={onValueChange} />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Letter" }), { target: { value: "b" } });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("reads its title as the select's description", () => {
    render(
      <Select
        aria-label="Account"
        options={options}
        value="a"
        onValueChange={vi.fn()}
        disabled
        title="Finish applying first"
      />,
    );
    const select = screen.getByRole("combobox", { name: "Account" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Finish applying first");
  });

  it("has no description without a title", () => {
    render(<Select aria-label="Letter" options={options} value="a" onValueChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Letter" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });
});
