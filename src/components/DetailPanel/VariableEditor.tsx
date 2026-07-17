import { open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../../hooks/useI18n";
import type { EnvVar } from "../../types";
import { ListEditor } from "../ListEditor/ListEditor";
import { PathEditor } from "../PathEditor/PathEditor";
import { IconButton } from "../ui/IconButton";
import { Textarea } from "../ui/Textarea";

const PATH_NAME_SUFFIXES = ["_HOME", "_ROOT", "_PATH", "_DIR", "_DIRECTORY"];
const PATH_NAME_EXACT = new Set([
  "APPDATA",
  "CUDA_PATH",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "PUBLIC",
  "SYSTEMDRIVE",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "WINDIR",
]);

export function looksLikeSinglePath(name: string, value: string) {
  const normalizedName = name.toUpperCase();
  const trimmedValue = value.trim();
  if (
    PATH_NAME_EXACT.has(normalizedName) ||
    PATH_NAME_SUFFIXES.some((suffix) => normalizedName.endsWith(suffix))
  ) {
    return true;
  }
  return (
    /^[a-z]:[\\/]/i.test(trimmedValue) ||
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("\\\\")
  );
}

interface VariableEditorProps {
  variable: EnvVar;
  value: string;
  separator: ";" | "," | null;
  readOnly: boolean;
  allVars: EnvVar[];
  onChange: (value: string) => void;
  onPaste: React.ClipboardEventHandler<HTMLTextAreaElement>;
  onBeforeReorder: () => void;
}

export function VariableEditor({
  variable,
  value,
  separator,
  readOnly,
  allVars,
  onChange,
  onPaste,
  onBeforeReorder,
}: VariableEditorProps) {
  const { t } = useI18n();
  const showFolderPicker =
    !readOnly && separator === null && looksLikeSinglePath(variable.name, value);

  const handleBrowseFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: value.trim() || undefined,
    });
    if (typeof selected === "string") {
      onChange(selected);
    }
  };

  if (separator === ";") {
    return (
      <PathEditor
        rawValue={value}
        onChange={onChange}
        readOnly={readOnly}
        allVars={allVars}
        skipPathValidation={variable.name.toUpperCase() === "PATHEXT"}
        allowFolderBrowse={variable.name.toUpperCase() !== "PATHEXT"}
        onBeforeReorder={onBeforeReorder}
      />
    );
  }

  if (separator === ",") {
    return (
      <ListEditor separator="," rawValue={value} onChange={onChange} readOnly={readOnly} />
    );
  }

  return (
    <div className="group relative">
      <Textarea
        label="Value"
        labelHidden
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        rows={Math.max(3, value.split("\n").length + 1)}
        spellCheck={false}
        disabled={readOnly}
        className={showFolderPicker ? "pr-11" : undefined}
      />
      {showFolderPicker && (
        <IconButton
          aria-label={t("detail.browse_folder")}
          title={t("detail.browse_folder")}
          icon="folder"
          onClick={handleBrowseFolder}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        />
      )}
    </div>
  );
}
