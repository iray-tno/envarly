import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it.each(["user", "system", "otherUser", "warn", "muted", "readonly"] as const)(
    "renders %s as noninteractive inline text",
    (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);

      const badge = screen.getByText(variant);
      expect(badge.tagName).toBe("SPAN");
      expect(badge).not.toHaveAttribute("role");
      expect(badge).not.toHaveAttribute("tabindex");
    },
  );

  it("preserves caller class overrides", () => {
    render(
      <Badge variant="user" className="px-2 normal-case text-danger">
        Custom
      </Badge>,
    );

    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("px-2", "normal-case", "text-danger");
    expect(badge).not.toHaveClass("px-3", "uppercase", "text-accent");
  });

  it("updates its content and variant", () => {
    const { rerender } = render(<Badge variant="user">User</Badge>);
    rerender(<Badge variant="system">System</Badge>);

    expect(screen.queryByText("User")).not.toBeInTheDocument();
    expect(screen.getByText("System")).toHaveClass("bg-violet/15", "text-violet");
  });
});
