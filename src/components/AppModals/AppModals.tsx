import { useI18n } from "../../hooks/useI18n";
import { DiffPanel } from "../DiffPanel/DiffPanel";
import { ImportExportPanel } from "../ImportExportPanel/ImportExportPanel";
import { LicensesPanel } from "../LicensesPanel/LicensesPanel";
import { NewVarModal } from "../NewVarModal/NewVarModal";
import { StagedModal } from "../StagedModal/StagedModal";
import { Modal } from "../ui/Modal";
import type { DiffEntry } from "../../lib/diff";
import type { EnvVar, VarScope } from "../../types";
import type { StagedChange } from "../../hooks/useStaged";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

interface Props {
  dialog: Dialog;
  setDialog: (d: Dialog) => void;
  staged: Map<string, StagedChange>;
  stagedDiff: DiffEntry[];
  stagedBusy: boolean;
  onApplyStaged: (takeSnapshot: boolean) => Promise<void>;
  diffEntries: DiffEntry[];
  applyBusy: boolean;
  onDiffApply: (accepted: DiffEntry[], reverted: DiffEntry[]) => Promise<void>;
  onDiffDismiss: () => void;
  onStageImport: (sets: Array<{ name: string; scope: VarScope; value: string }>, deletes?: Array<{ name: string; scope: VarScope }>) => void;
  effectiveVars: EnvVar[];
  elevated: boolean;
  onNewVarStage: (name: string, scope: VarScope, value: string) => void;
}

export function AppModals({
  dialog, setDialog,
  staged, stagedDiff, stagedBusy, onApplyStaged,
  diffEntries, applyBusy, onDiffApply, onDiffDismiss,
  onStageImport, effectiveVars, elevated, onNewVarStage,
}: Props) {
  const { t } = useI18n();

  return (
    <>
      <Modal open={dialog === "importexport"} onClose={() => setDialog(null)} title={t("modal.import_export")} size="xl">
        <ImportExportPanel onStage={onStageImport} />
      </Modal>

      <Modal
        open={dialog === "staged"}
        onClose={() => setDialog(null)}
        title={t("modal.apply_staged", { count: staged.size })}
        size="xl"
      >
        <StagedModal diff={stagedDiff} busy={stagedBusy} onApply={onApplyStaged} onClose={() => setDialog(null)} />
      </Modal>

      <Modal open={dialog === "changes"} onClose={onDiffDismiss} title={t("modal.external_changes", { count: diffEntries.length })} size="xl">
        <div className="px-6 py-5">
          <DiffPanel entries={diffEntries} onApply={onDiffApply} onDismiss={onDiffDismiss} busy={applyBusy} />
        </div>
      </Modal>

      <Modal open={dialog === "newvar"} onClose={() => setDialog(null)} title={t("modal.new_var")} size="md">
        <NewVarModal vars={effectiveVars} elevated={elevated} onStage={onNewVarStage} onClose={() => setDialog(null)} />
      </Modal>

      <Modal open={dialog === "licenses"} onClose={() => setDialog(null)} title={t("modal.licenses")} size="2xl" flex>
        <LicensesPanel />
      </Modal>
    </>
  );
}
