import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import { PathEditor } from "./PathEditor";

vi.mock("../../api", () => ({
  api: {
    validatePaths: vi.fn(),
  },
}));

// Use forward-slash paths to avoid backslash escaping issues in userEvent
const A = "/usr/local/bin";
const B = "/nonexistent/path";
const C = "/usr/bin";
const RAW = `${A};${B};${C}`;

describe("PathEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: A=valid, B=invalid, C=valid
    vi.mocked(api.validatePaths).mockResolvedValue([true, false, true]);
  });

  it("renders each path entry", () => {
    render(<PathEditor rawValue={RAW} onChange={vi.fn()} />);
    expect(screen.getByText(A)).toBeInTheDocument();
    expect(screen.getByText(B)).toBeInTheDocument();
    expect(screen.getByText(C)).toBeInTheDocument();
  });

  it("marks invalid paths after validation", async () => {
    render(<PathEditor rawValue={RAW} onChange={vi.fn()} />);
    await waitFor(() => {
      // The "✗ not found" badge on the invalid entry
      expect(screen.getAllByText(/not found/).length).toBeGreaterThan(0);
    });
  });

  it("shows warning count for invalid paths", async () => {
    render(<PathEditor rawValue={RAW} onChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/1 path not found/i)).toBeInTheDocument();
    });
  });

  it("adds a new entry on Add click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    vi.mocked(api.validatePaths).mockResolvedValue([true, true]);
    render(<PathEditor rawValue={A} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText(/add new path/i), "/new/path");
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).toHaveBeenCalledWith(`${A};/new/path`);
  });

  it("adds entry on Enter key", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    vi.mocked(api.validatePaths).mockResolvedValue([true]);
    render(<PathEditor rawValue="" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText(/add new path/i), "/my/path{Enter}");
    expect(onChange).toHaveBeenCalledWith("/my/path");
  });

  it("removes an entry when × is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    vi.mocked(api.validatePaths).mockResolvedValue([true, true]);
    render(<PathEditor rawValue={`${A};${C}`} onChange={onChange} />);
    const removeButtons = await screen.findAllByTitle("Remove");
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(C);
  });
});
