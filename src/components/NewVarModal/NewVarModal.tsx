import { type FormEvent, useState } from "react";
import { cn } from "../../lib/cn";
import type { EnvVar, VarScope } from "../../types";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";

interface NewVarModalProps {
  vars: EnvVar[];
  elevated: boolean;
  onStage: (name: string, scope: VarScope, value: string) => void;
  onClose: () => void;
}

export function NewVarModal({ vars, elevated, onStage, onClose }: NewVarModalProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<VarScope>("User");
  const [value, setValue] = useState("");

  const trimmedName = name.trim();
  const alreadyExists = trimmedName
    ? vars.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase() && v.scope === scope)
    : false;
  const canSubmit = trimmedName.length > 0 && !alreadyExists;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStage(trimmedName, scope, value);
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wide" htmlFor="newvar-name">
          Name
        </label>
        <input
          id="newvar-name"
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
          placeholder="VARIABLE_NAME"
          className={cn(
            "px-2.5 py-1.5 bg-surface border rounded font-mono text-sm text-fg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
            alreadyExists ? "border-danger" : "border-rim",
          )}
        />
        {alreadyExists && (
          <p className="text-xs text-danger">{trimmedName} already exists in {scope} scope</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Scope</p>
        <SegmentedControl
          aria-label="Variable scope"
          options={[
            { value: "User" as VarScope, label: "User" },
            { value: "System" as VarScope, label: elevated ? "System" : "System (admin)", disabled: !elevated },
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wide" htmlFor="newvar-value">
          Value
        </label>
        <textarea
          id="newvar-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          rows={3}
          placeholder="(empty)"
          className={cn(
            "px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-sm text-fg resize-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
          )}
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" disabled={!canSubmit}>
          Stage new variable
        </Button>
      </div>
    </form>
  );
}
