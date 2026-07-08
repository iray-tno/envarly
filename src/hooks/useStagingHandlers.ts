import { useCallback } from "react";
import type { EnvSnapshot, EnvVar, VarScope } from "../types";
import type { StagedChange } from "./useStaged";
import type { Command } from "./useUndoStack";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

interface Params {
  staged: Map<string, StagedChange>;
  stageSet: (name: string, scope: VarScope, value: string) => void;
  stageDelete: (name: string, scope: VarScope) => void;
  stageImport: (
    sets: Array<{ name: string; scope: VarScope; value: string }>,
    deletes: Array<{ name: string; scope: VarScope }>,
  ) => void;
  stageSnapshot: (snap: EnvSnapshot) => void;
  unstage: (name: string, scope: VarScope) => void;
  clearStaged: () => void;
  restoreStaged: (map: Map<string, StagedChange>) => void;
  push: (command: Command) => void;
  setDialog: (d: Dialog) => void;
  setSelected: (v: EnvVar | null) => void;
  setSnapshotsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export function useStagingHandlers({
  staged,
  stageSet,
  stageDelete,
  stageImport,
  stageSnapshot,
  unstage,
  clearStaged,
  restoreStaged,
  push,
  setDialog,
  setSelected,
  setSnapshotsOpen,
}: Params) {
  const handleStage = useCallback(
    (name: string, scope: VarScope, value: string) => {
      const prev = staged.get(`${scope}:${name}`);
      stageSet(name, scope, value);
      push({
        label: `Stage ${name}`,
        undo: () => {
          if (prev?.kind === "set") stageSet(name, scope, prev.newValue);
          else if (prev?.kind === "delete") stageDelete(name, scope);
          else unstage(name, scope);
        },
        redo: () => stageSet(name, scope, value),
      });
    },
    [staged, stageSet, stageDelete, unstage, push],
  );

  const handleStageDelete = useCallback(
    (name: string, scope: VarScope) => {
      const prev = staged.get(`${scope}:${name}`);
      stageDelete(name, scope);
      push({
        label: `Delete ${name}`,
        undo: () => {
          if (prev?.kind === "set") stageSet(name, scope, prev.newValue);
          else unstage(name, scope);
        },
        redo: () => stageDelete(name, scope),
      });
    },
    [staged, stageDelete, stageSet, unstage, push],
  );

  const handleUnstage = useCallback(
    (name: string, scope: VarScope) => {
      const prev = staged.get(`${scope}:${name}`);
      unstage(name, scope);
      push({
        label: `Unstage ${name}`,
        undo: () => {
          if (prev?.kind === "set") stageSet(name, scope, prev.newValue);
          else if (prev?.kind === "delete") stageDelete(name, scope);
        },
        redo: () => unstage(name, scope),
      });
    },
    [staged, unstage, stageSet, stageDelete, push],
  );

  const handleClearStaged = useCallback(() => {
    const snapshot = new Map(staged);
    clearStaged();
    push({
      label: "Discard all",
      undo: () => restoreStaged(snapshot),
      redo: () => clearStaged(),
    });
  }, [staged, clearStaged, restoreStaged, push]);

  const handleStageImport = useCallback(
    (
      sets: Array<{ name: string; scope: VarScope; value: string }>,
      deletes: Array<{ name: string; scope: VarScope }> = [],
    ) => {
      const snapshot = new Map(staged);
      stageImport(sets, deletes);
      setDialog(null);
      push({
        label: "Import",
        undo: () => restoreStaged(snapshot),
        redo: () => stageImport(sets, deletes),
      });
    },
    [staged, stageImport, restoreStaged, push, setDialog],
  );

  const handleStageSnapshot = useCallback(
    (snap: EnvSnapshot) => {
      const snapshot = new Map(staged);
      stageSnapshot(snap);
      setSnapshotsOpen(false);
      push({
        label: "Stage snapshot restore",
        undo: () => restoreStaged(snapshot),
        redo: () => stageSnapshot(snap),
      });
    },
    [staged, stageSnapshot, restoreStaged, push, setSnapshotsOpen],
  );

  const handleNewVarStage = useCallback(
    (name: string, scope: VarScope, value: string) => {
      stageSet(name, scope, value);
      setSelected({ name, scope, value, listSeparator: null });
      setDialog(null);
      push({
        label: `New variable ${name}`,
        undo: () => unstage(name, scope),
        redo: () => stageSet(name, scope, value),
      });
    },
    [stageSet, unstage, push, setSelected, setDialog],
  );

  return {
    handleStage,
    handleStageDelete,
    handleUnstage,
    handleClearStaged,
    handleStageImport,
    handleStageSnapshot,
    handleNewVarStage,
  };
}
