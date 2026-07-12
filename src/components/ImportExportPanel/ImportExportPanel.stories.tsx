import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { fn } from "storybook/test";
import { api } from "../../api";
import type { EnvSnapshot, EnvVar } from "../../types";
import { ImportExportPanel } from "./ImportExportPanel";

const storyVars: EnvVar[] = [
  {
    name: "JAVA_HOME",
    value: "C:\\Program Files\\Java\\jdk-21",
    valueKind: "String",
    scope: "User",
    listSeparator: null,
  },
  {
    name: "PATH",
    value: "%USERPROFILE%\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Users\\tanao\\.cargo\\bin",
    valueKind: "ExpandString",
    scope: "User",
    listSeparator: ";",
  },
  {
    name: "GITHUB_TOKEN",
    value: "ghp_exampletoken1234567890",
    valueKind: "String",
    scope: "User",
    listSeparator: null,
  },
  {
    name: "WINDIR",
    value: "C:\\Windows",
    valueKind: "String",
    scope: "System",
    listSeparator: null,
  },
];

const storySnapshot: EnvSnapshot = {
  user: {
    JAVA_HOME: { value: "C:\\Program Files\\Java\\jdk-21", kind: "String" },
    PATH: {
      value: "%USERPROFILE%\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Users\\tanao\\.cargo\\bin",
      kind: "ExpandString",
    },
    GITHUB_TOKEN: { value: "ghp_exampletoken1234567890", kind: "String" },
  },
  system: {
    WINDIR: { value: "C:\\Windows", kind: "String" },
  },
};

const meta = {
  title: "Components/ImportExportPanel",
  component: ImportExportPanel,
  args: { onStage: fn() },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="w-[580px] h-[640px] bg-panel flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImportExportPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const withStoryApi: Story["decorators"] = [
  (Story) => {
    api.getEnvVars = async () => storyVars;
    api.getRegistrySnapshot = async () => storySnapshot;
    api.exportVars = async () => "C:\\Users\\tanao\\Downloads\\envarly-20260712.json";
    api.exportCustomVars = async () =>
      "C:\\Users\\tanao\\Downloads\\envarly-custom-20260712.json";
    api.parseImport = async () => storySnapshot;
    return <Story />;
  },
];

function CustomExportStory(args: ComponentProps<typeof ImportExportPanel>) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      const custom = Array.from(document.querySelectorAll("label")).find((label) =>
        label.textContent?.includes("Custom"),
      );
      custom?.click();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return <ImportExportPanel {...args} />;
}

export const ExportDefault: Story = {
  decorators: withStoryApi,
};

export const CustomExport: Story = {
  decorators: withStoryApi,
  render: (args) => <CustomExportStory {...args} />,
};

export const ImportEmpty: Story = {
  decorators: withStoryApi,
  play: async ({ canvasElement }) => {
    const importTab = Array.from(canvasElement.querySelectorAll("label")).find((label) =>
      label.textContent?.includes("Import"),
    );
    importTab?.click();
  },
};
