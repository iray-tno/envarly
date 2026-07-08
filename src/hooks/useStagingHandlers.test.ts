import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StagedChange } from "./useStaged";
import { useStagingHandlers } from "./useStagingHandlers";

function makeStaged(entries: Array<[string, StagedChange]> = []): Map<string, StagedChange> {
  return new Map(entries);
}

function makeParams(overrides: Partial<Parameters<typeof useStagingHandlers>[0]> = {}) {
  return {
    staged: makeStaged(),
    stageSet: vi.fn(),
    stageDelete: vi.fn(),
    stageImport: vi.fn(),
    stageSnapshot: vi.fn(),
    unstage: vi.fn(),
    clearStaged: vi.fn(),
    restoreStaged: vi.fn(),
    push: vi.fn(),
    setDialog: vi.fn(),
    setSelected: vi.fn(),
    setSnapshotsOpen: vi.fn(),
    ...overrides,
  };
}

describe("useStagingHandlers", () => {
  describe("handleStage", () => {
    it("calls stageSet and pushes an undo command", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStage("MY_VAR", "User", "hello");
      });
      expect(params.stageSet).toHaveBeenCalledWith("MY_VAR", "User", "hello");
      expect(params.push).toHaveBeenCalledTimes(1);
    });

    it("undo calls unstage when there was no previous staged value", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStage("MY_VAR", "User", "hello");
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.unstage).toHaveBeenCalledWith("MY_VAR", "User");
    });

    it("undo restores previous set value", () => {
      const prev: StagedChange = {
        kind: "set",
        name: "MY_VAR",
        scope: "User",
        originalValue: "old",
        newValue: "prev",
      };
      const params = makeParams({
        staged: makeStaged([["User:MY_VAR", prev]]),
      });
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStage("MY_VAR", "User", "new");
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.stageSet).toHaveBeenCalledWith("MY_VAR", "User", "prev");
    });
  });

  describe("handleStageDelete", () => {
    it("calls stageDelete and pushes an undo command", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStageDelete("MY_VAR", "User");
      });
      expect(params.stageDelete).toHaveBeenCalledWith("MY_VAR", "User");
      expect(params.push).toHaveBeenCalledTimes(1);
    });

    it("undo calls unstage when there was no previous staged value", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStageDelete("MY_VAR", "User");
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.unstage).toHaveBeenCalledWith("MY_VAR", "User");
    });
  });

  describe("handleUnstage", () => {
    it("calls unstage and pushes an undo command", () => {
      const prev: StagedChange = {
        kind: "set",
        name: "MY_VAR",
        scope: "User",
        originalValue: "old",
        newValue: "v",
      };
      const params = makeParams({ staged: makeStaged([["User:MY_VAR", prev]]) });
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleUnstage("MY_VAR", "User");
      });
      expect(params.unstage).toHaveBeenCalledWith("MY_VAR", "User");
      expect(params.push).toHaveBeenCalledTimes(1);
    });

    it("undo re-stages the previous set value", () => {
      const prev: StagedChange = {
        kind: "set",
        name: "MY_VAR",
        scope: "User",
        originalValue: "old",
        newValue: "v",
      };
      const params = makeParams({ staged: makeStaged([["User:MY_VAR", prev]]) });
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleUnstage("MY_VAR", "User");
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.stageSet).toHaveBeenCalledWith("MY_VAR", "User", "v");
    });
  });

  describe("handleClearStaged", () => {
    it("calls clearStaged and pushes an undo command", () => {
      const params = makeParams({
        staged: makeStaged([
          ["User:A", { kind: "set", name: "A", scope: "User", originalValue: null, newValue: "x" }],
        ]),
      });
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleClearStaged();
      });
      expect(params.clearStaged).toHaveBeenCalledTimes(1);
      expect(params.push).toHaveBeenCalledTimes(1);
    });

    it("undo restores the staged snapshot", () => {
      const entry: StagedChange = {
        kind: "set",
        name: "A",
        scope: "User",
        originalValue: null,
        newValue: "x",
      };
      const params = makeParams({ staged: makeStaged([["User:A", entry]]) });
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleClearStaged();
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.restoreStaged).toHaveBeenCalledWith(new Map([["User:A", entry]]));
    });
  });

  describe("handleStageImport", () => {
    it("calls stageImport, closes dialog, and pushes undo", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleStageImport([{ name: "A", scope: "User", value: "1" }]);
      });
      expect(params.stageImport).toHaveBeenCalledWith(
        [{ name: "A", scope: "User", value: "1" }],
        [],
      );
      expect(params.setDialog).toHaveBeenCalledWith(null);
      expect(params.push).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleNewVarStage", () => {
    it("stages the new var, selects it, closes dialog, and pushes undo", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleNewVarStage("NEW_VAR", "User", "value");
      });
      expect(params.stageSet).toHaveBeenCalledWith("NEW_VAR", "User", "value");
      expect(params.setSelected).toHaveBeenCalledWith({
        name: "NEW_VAR",
        scope: "User",
        value: "value",
        listSeparator: null,
      });
      expect(params.setDialog).toHaveBeenCalledWith(null);
      expect(params.push).toHaveBeenCalledTimes(1);
    });

    it("undo calls unstage", () => {
      const params = makeParams();
      const { result } = renderHook(() => useStagingHandlers(params));
      act(() => {
        result.current.handleNewVarStage("NEW_VAR", "User", "value");
      });
      const cmd = (params.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      act(() => {
        cmd.undo();
      });
      expect(params.unstage).toHaveBeenCalledWith("NEW_VAR", "User");
    });
  });
});
