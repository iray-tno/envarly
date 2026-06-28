import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StagedChange } from "../../hooks/useStaged";
import type { EnvVar } from "../../types";
import { Sidebar } from "./Sidebar";

const noStaged = new Map<string, StagedChange>();

const makeVar = (name: string, scope: "User" | "System"): EnvVar => ({
  name,
  value: "some-value",
  scope,
  listSeparator: null,
});

const vars: EnvVar[] = [
  makeVar("JAVA_HOME", "User"),
  makeVar("PATH", "User"),
  makeVar("WINDIR", "System"),
  makeVar("SystemRoot", "System"),
];

describe("Sidebar", () => {
  it("renders all variables by default", () => {
    render(<Sidebar vars={vars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    for (const v of vars) {
      expect(screen.getByText(v.name)).toBeInTheDocument();
    }
  });

  it("filters by search query", async () => {
    const user = userEvent.setup();
    render(<Sidebar vars={vars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    await user.type(screen.getByPlaceholderText("Search variables..."), "JAVA");
    expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
    expect(screen.queryByText("PATH")).not.toBeInTheDocument();
  });

  it("filters by User scope", async () => {
    const user = userEvent.setup();
    render(<Sidebar vars={vars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    await user.click(screen.getByRole("radio", { name: /^user/i }));
    expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
    expect(screen.queryByText("WINDIR")).not.toBeInTheDocument();
  });

  it("calls onSelect when a variable is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar vars={vars} selected={null} onSelect={onSelect} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    await user.click(screen.getByText("JAVA_HOME"));
    expect(onSelect).toHaveBeenCalledWith(vars[0]);
  });

  it("shows loading state", () => {
    render(<Sidebar vars={[]} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={true} staged={noStaged} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows empty state when no match", async () => {
    const user = userEvent.setup();
    render(<Sidebar vars={vars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    await user.type(screen.getByPlaceholderText("Search variables..."), "ZZZNOMATCH");
    expect(screen.getByText("No variables found")).toBeInTheDocument();
  });

  it("displays scope counts in tabs", () => {
    render(<Sidebar vars={vars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    // All=4, User=2, System=2 — no secret chip when secretCount=0
    const badges = screen.getAllByText(/^\d+$/);
    expect(badges.map((b) => b.textContent)).toEqual(["4", "2", "2"]);
  });

  it("detects secrets from value pattern even with a generic name", () => {
    const valueSecretVars: EnvVar[] = [
      { name: "MY_KEY", value: "ghp_abcdefghijklmnopqrstuvwxyz123456", scope: "User", listSeparator: null },
      { name: "NORMAL_VAR", value: "hello", scope: "User", listSeparator: null },
    ];
    render(<Sidebar vars={valueSecretVars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    // "GitHub" service badge should appear next to MY_KEY
    expect(screen.getByTitle("GitHub Personal Access Token")).toBeInTheDocument();
  });

  it("filters to secret variables only via secrets chip", async () => {
    const secretVars: EnvVar[] = [
      makeVar("AWS_SECRET_ACCESS_KEY", "User"),
      makeVar("GITHUB_TOKEN", "System"),
      makeVar("JAVA_HOME", "User"),
    ];
    const user = userEvent.setup();
    render(<Sidebar vars={secretVars} selected={null} onSelect={vi.fn()} onCreateNew={vi.fn()} loading={false} staged={noStaged} />);
    await user.click(screen.getByRole("button", { name: /secrets/i }));
    expect(screen.getByText("AWS_SECRET_ACCESS_KEY")).toBeInTheDocument();
    expect(screen.getByText("GITHUB_TOKEN")).toBeInTheDocument();
    expect(screen.queryByText("JAVA_HOME")).not.toBeInTheDocument();
  });
});
