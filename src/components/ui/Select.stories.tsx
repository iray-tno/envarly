import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Language: Story = {
  render: () => {
    const [language, setLanguage] = useState("en");
    return (
      <Select
        aria-label="Language"
        value={language}
        onValueChange={setLanguage}
        options={[
          { value: "en", label: "English" },
          { value: "ja", label: "日本語" },
        ]}
      />
    );
  },
};

export const SortOrder: Story = {
  render: () => {
    const [sortBy, setSortBy] = useState("name-asc");
    return (
      <Select
        aria-label="Sort order"
        value={sortBy}
        onValueChange={setSortBy}
        options={[
          { value: "name-asc", label: "Name A-Z" },
          { value: "name-desc", label: "Name Z-A" },
          { value: "scope", label: "Scope" },
          { value: "staged", label: "Staged first" },
        ]}
        className="text-[10px]"
      />
    );
  },
};
