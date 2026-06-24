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

const A = "/usr/local/bin";
const B = "/nonexistent/path";
const C = "/usr/bin";
const RAW = `${A};${B};${C}`;

describe("PathEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.validatePaths).mockResolvedValue([true, false, true]);
  });

  it("renders each path entry", () => {
    render(<PathEditor rawValue={RAW} onChange={vi.fn()} />);
    // Entries are rendered as controlled inputs
    expect(screen.getByDisplayValue(A)).toBeInTheDocument();
    expect(screen.getByDisplayValue(B)).toBeInTheDocument();
    expect(screen.getByDisplayValue(C)).toBeInTheDocument();
  });

  it("marks invalid paths after validation", async () => {
    render(<PathEditor rawValue={RAW} onChange={vi.fn()} />);
    await waitFor(() => {
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

  it("removes an entry when remove button is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    vi.mocked(api.validatePaths).mockResolvedValue([true, true]);
    render(<PathEditor rawValue={`${A};${C}`} onChange={onChange} />);
    const removeButtons = await screen.findAllByRole("button", { name: /^remove/i });
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(C);
  });
});
