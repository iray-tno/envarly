import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn";
import { resolveSecret } from "../../lib/secrets";
import { Button } from "../ui/Button";
import { type FlatVar, varKey } from "./types";

export function SecretBanner({ count }: { count: number }) {
  const { t } = useTranslation();
  if (count === 0) return null;
  return (
    <div className="flex gap-2 px-3 py-2 rounded border border-warn/40 bg-warn/10 text-warn text-xs">
      <span className="shrink-0">⚠</span>
      <span>{t("var_table.secret", { count })}</span>
    </div>
  );
}

interface VarTableProps {
  vars: FlatVar[];
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  onToggleAll: (val: boolean) => void;
}

export function VarTable({ vars, checked, onToggle, onToggleAll }: VarTableProps) {
  const { t } = useTranslation();
  const checkedCount = vars.filter((v) => checked[varKey(v)]).length;
  const allChecked = checkedCount === vars.length;
  const noneChecked = checkedCount === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{t("var_table.count", { count: vars.length })}</span>
        <Button variant="ghost" size="sm" onClick={() => onToggleAll(true)} disabled={allChecked} className="px-1.5 py-0.5">{t("var_table.select_all")}</Button>
        <span className="text-dim">·</span>
        <Button variant="ghost" size="sm" onClick={() => onToggleAll(false)} disabled={noneChecked} className="px-1.5 py-0.5">{t("var_table.deselect_all")}</Button>
        <span className="ml-auto font-medium text-fg">{t("var_table.selected", { count: checkedCount })}</span>
      </div>

      <div className="rounded border border-rim overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-rim bg-surface text-muted uppercase text-[10px] tracking-wide">
              <th className="w-8 px-2 py-1.5 text-center">
                <input type="checkbox" checked={allChecked} onChange={(e) => onToggleAll(e.target.checked)} className="accent-accent" aria-label="Select all" />
              </th>
              <th className="px-3 py-1.5 text-left">{t("var_table.col_name")}</th>
              <th className="px-3 py-1.5 text-left">{t("var_table.col_scope")}</th>
              <th className="px-3 py-1.5 text-left">{t("var_table.col_value")}</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v) => {
              const key = varKey(v);
              const secret = resolveSecret(v.name, v.value);
              return (
                <tr
                  key={key}
                  onClick={() => onToggle(key)}
                  className={cn(
                    "border-b border-rim-subtle last:border-0 cursor-pointer transition-colors",
                    checked[key] ? "bg-canvas hover:bg-hover" : "bg-canvas opacity-40 hover:opacity-60",
                  )}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={!!checked[key]} onChange={() => onToggle(key)} onClick={(e) => e.stopPropagation()} className="accent-accent" aria-label={v.name} />
                  </td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-fg">
                    <span className="flex items-center gap-1.5">
                      {v.name}
                      {secret && (
                        <span title={secret.label} className="text-warn text-[10px] font-medium shrink-0">
                          ⚠ {secret.service}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted">{v.scope}</td>
                  <td className="px-3 py-1.5 font-mono text-muted truncate max-w-xs">
                    {secret ? "••••••••" : v.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
