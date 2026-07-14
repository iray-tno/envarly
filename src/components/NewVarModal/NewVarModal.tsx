import { type FormEvent, useEffect, useRef, useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import { inferEnvValueKind } from "../../lib/envValueKind";
import type { EnvValueKindSelection, EnvVar, VarScope } from "../../types";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Select } from "../ui/Select";

interface NewVarModalProps {
  vars: EnvVar[];
  elevated: boolean;
  onStage: (name: string, scope: VarScope, value: string, valueKind: EnvValueKindSelection) => void;
  onClose: () => void;
}

export function NewVarModal({ vars, elevated, onStage, onClose }: NewVarModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<VarScope>("User");
  const [value, setValue] = useState("");
  const [valueKind, setValueKind] = useState<EnvValueKindSelection>("Auto");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const trimmedName = name.trim();
  const alreadyExists = trimmedName
    ? vars.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase() && v.scope === scope)
    : false;
  const canSubmit = trimmedName.length > 0 && !alreadyExists;

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStage(trimmedName, scope, value, valueKind);
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold text-muted uppercase tracking-wide"
          htmlFor="newvar-name"
        >
          {t("new_var.name")}
        </label>
        <input
          id="newvar-name"
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
          placeholder={t("new_var.placeholder_name")}
          className={cn(
            "px-2 py-2 bg-surface border rounded font-mono text-sm text-fg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
            alreadyExists ? "border-danger" : "border-rim",
          )}
        />
        {alreadyExists && (
          <p className="text-xs text-danger">{t("new_var.exists", { name: trimmedName, scope })}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold text-muted uppercase tracking-wide"
          htmlFor="newvar-value-kind"
        >
          {t("new_var.value_kind")}
        </label>
        <Select
          id="newvar-value-kind"
          options={[
            {
              value: "Auto",
              label: t("value_kind.auto_current", {
                kind: t(
                  `value_kind.${inferEnvValueKind(value) === "String" ? "string" : "expand_string"}`,
                ),
              }),
            },
            { value: "String", label: t("value_kind.string") },
            { value: "ExpandString", label: t("value_kind.expand_string") },
          ]}
          value={valueKind}
          onValueChange={setValueKind}
          containerClassName="w-full"
          className="w-full px-2 py-2 bg-surface border border-rim text-sm text-fg"
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
          {t("new_var.scope")}
        </p>
        <SegmentedControl
          aria-label="Variable scope"
          options={[
            { value: "User" as VarScope, label: "User" },
            {
              value: "System" as VarScope,
              label: elevated ? "System" : t("new_var.system_admin"),
              disabled: !elevated,
            },
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-semibold text-muted uppercase tracking-wide"
          htmlFor="newvar-value"
        >
          {t("new_var.value")}
        </label>
        <textarea
          id="newvar-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          rows={3}
          placeholder={t("new_var.placeholder_value")}
          className={cn(
            "px-2 py-2 bg-surface border border-rim rounded font-mono text-sm text-fg resize-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
          )}
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="md" type="button" onClick={onClose}>
          {t("new_var.cancel")}
        </Button>
        <Button variant="primary" size="md" type="submit" disabled={!canSubmit}>
          {t("new_var.stage")}
        </Button>
      </div>
    </form>
  );
}
