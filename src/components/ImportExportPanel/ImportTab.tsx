import { useRef, useState } from "react";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { resolveSecret } from "../../lib/secrets";
import type { VarScope } from "../../types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Textarea } from "../ui/Textarea";
import {
  type ExportFormat,
  type FlatVar,
  flattenSnapshot,
  importFormatOptions,
  type MergeStrategy,
  strategyOptions,
  varKey,
} from "./types";
import { SecretBanner, VarTable } from "./VarTable";

interface ImportTabProps {
  onStage: (
    sets: Array<{ name: string; scope: VarScope; value: string }>,
    deletes: Array<{ name: string; scope: VarScope }>,
  ) => void;
  onStatus: (msg: string | null) => void;
}

export function ImportTab({ onStage, onStatus }: ImportTabProps) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<FlatVar[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [strategy, setStrategy] = useState<MergeStrategy>("merge");
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".reg")) setFormat("reg");
    else setFormat("json");
    const reader = new FileReader();
    reader.onload = (ev) => setText((ev.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
    setPreview(null);
    onStatus(null);
  };

  const handleParse = async () => {
    const content = text.trim();
    if (!content) {
      onStatus(t("import.no_content"));
      return;
    }
    setParsing(true);
    onStatus(null);
    try {
      const snap = await api.parseImport(content, format);
      const vars = flattenSnapshot(snap);
      if (vars.length === 0) {
        onStatus(t("import.no_vars"));
        setPreview(null);
        return;
      }
      setPreview(vars);
      setChecked(Object.fromEntries(vars.map((v) => [varKey(v), true])));
    } catch (e) {
      onStatus(`Parse failed: ${e}`);
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    const selected = preview.filter((v) => checked[varKey(v)]);
    if (selected.length === 0) {
      onStatus(t("import.no_selected"));
      return;
    }
    setApplying(true);
    onStatus(null);
    try {
      const sets = selected.map((v) => ({ name: v.name, scope: v.scope, value: v.value }));
      const deletes: Array<{ name: string; scope: VarScope }> = [];

      if (strategy === "replace") {
        const affectedScopes = new Set(selected.map((v) => v.scope));
        const current = await api.getRegistrySnapshot();
        const selectedKeys = new Set(selected.map((v) => `${v.scope}:${v.name}`));
        if (affectedScopes.has("User")) {
          for (const name of Object.keys(current.user)) {
            if (!selectedKeys.has(`User:${name}`)) deletes.push({ name, scope: "User" });
          }
        }
        if (affectedScopes.has("System")) {
          for (const name of Object.keys(current.system)) {
            if (!selectedKeys.has(`System:${name}`)) deletes.push({ name, scope: "System" });
          }
        }
      }

      onStage(sets, deletes);
      const extra =
        strategy === "replace" && deletes.length > 0
          ? t("import.result_extra", { count: deletes.length })
          : "";
      onStatus(t("import.result", { count: selected.length, extra }));
      setPreview(null);
      setText("");
    } catch (e) {
      onStatus(`Stage failed: ${e}`);
    } finally {
      setApplying(false);
    }
  };

  const checkedCount = preview ? preview.filter((v) => checked[varKey(v)]).length : 0;
  const secretCount = preview
    ? preview.filter((v) => checked[varKey(v)] && resolveSecret(v.name, v.value) !== null).length
    : 0;
  const noneChecked = checkedCount === 0;

  const affectedScopes = preview
    ? [...new Set(preview.filter((v) => checked[varKey(v)]).map((v) => v.scope))]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          {t("import.choose_file")}
        </Button>
        <SegmentedControl
          aria-label="Import format"
          options={importFormatOptions}
          value={format}
          onChange={setFormat}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".json,.reg"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Import file"
        />
      </div>

      <Textarea
        label="File contents"
        labelHidden
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        placeholder={t("import.paste_placeholder")}
        rows={5}
      />

      <Button
        variant="secondary"
        onClick={handleParse}
        disabled={parsing || !text.trim()}
        className="self-start"
      >
        {parsing ? t("import.parsing") : t("import.parse")}
      </Button>

      {preview && (
        <div className="flex flex-col gap-3">
          <SecretBanner count={secretCount} />

          <VarTable
            vars={preview}
            checked={checked}
            onToggle={(key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
            onToggleAll={(val) =>
              setChecked(Object.fromEntries((preview ?? []).map((v) => [varKey(v), val])))
            }
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">
              {t("import.merge_strategy")}
            </span>
            <SegmentedControl
              aria-label="Merge strategy"
              options={strategyOptions}
              value={strategy}
              onChange={setStrategy}
            />
            <p className="text-xs text-dim">
              {strategy === "merge" ? t("import.merge_desc") : t("import.replace_desc")}
            </p>
          </div>

          {strategy === "replace" && affectedScopes.length > 0 && (
            <div className="flex gap-2 px-3 py-2 rounded border border-danger/40 bg-danger/10 text-danger text-xs">
              <Icon name="warning" size={14} className="mt-px" />
              <span>{t("import.replace_warning", { scopes: affectedScopes.join(" and ") })}</span>
            </div>
          )}

          <Button
            variant={strategy === "replace" ? "danger" : "primary"}
            size="md"
            onClick={handleApply}
            disabled={applying || noneChecked}
            className="self-start"
          >
            {applying
              ? t("import.staging")
              : strategy === "replace"
                ? t("import.stage_replace", { count: checkedCount })
                : t("import.stage", { count: checkedCount })}
          </Button>
        </div>
      )}
    </div>
  );
}
