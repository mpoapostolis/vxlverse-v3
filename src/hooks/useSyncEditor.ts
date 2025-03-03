import { useEffect, useRef, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useEditorStore } from "../stores/editorStore";

// Create a single debounced save function that persists between renders
export function useSyncGameState(id: string) {
  const store = useEditorStore();
  const isInitialMount = useRef(true);
  const timeoutRef = useRef<number | null>(null);

  // Create a stable save function with useCallback
  const saveToDatabase = useCallback(async () => {
    if (!id) return;

    try {
      // Always get the latest state when saving
      const latestState = useEditorStore.getState();

      await pb.collection("games").update(id, {
        gameConf: {
          scenes: latestState.scenes,
          currentSceneId: latestState.currentSceneId,
          gridSnap: latestState.gridSnap,
          showGrid: latestState.showGrid,
          gridSize: latestState.gridSize,
          snapPrecision: latestState.snapPrecision,
        },
      });
    } catch (err) {}
  }, [id]);

  // Set up subscription to store changes
  useEffect(() => {
    // Skip the first render to avoid immediate save on mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear any existing timeout to ensure only the latest change is saved
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout for the latest change
    timeoutRef.current = setTimeout(() => {
      saveToDatabase();
    }, 2000);

    // Clean up timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, store, saveToDatabase]);
}
