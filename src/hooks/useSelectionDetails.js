import { useMemo } from 'react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { describeSelection } from '../model/selectionDetails.js';

/** Narrow adapter: domain lookup is pure, Zustand wiring stays here. */
export function useSelectionDetails() {
  const snapshot = useEditorStore(state => state.snapshot);
  const selection = useEditorStore(state => state.selection);
  const highlightedComponentId = useEditorStore(state => state.highlightedComponentId);
  const select = useEditorStore(state => state.select);
  const details = useMemo(
    () => describeSelection(snapshot, selection, highlightedComponentId),
    [snapshot, selection, highlightedComponentId],
  );
  return { snapshot, selection, select, details };
}
