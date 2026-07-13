import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import packageMetadata from "../../../package.json";
import { LicensesPanel } from "./LicensesPanel";

describe("LicensesPanel", () => {
  it("shows the current product version and copyright years", () => {
    render(<LicensesPanel />);

    expect(screen.getByText(`Version ${packageMetadata.version}`)).toBeInTheDocument();
    expect(screen.getByText(/Copyright © 2025-2026 iray-tno/)).toBeInTheDocument();
    expect(screen.getByText(/Copyright \(c\) 2025-2026 iray-tno/)).toBeInTheDocument();
  });
});
