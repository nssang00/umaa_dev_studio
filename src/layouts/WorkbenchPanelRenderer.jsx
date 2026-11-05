import { workbenchPanelsConfig } from './workbenchPanels.config.js';

/** Instantiate a registered feature through its public props, without store access. */
export function WorkbenchPanelRenderer({ panelId, viewId, viewProps = {} }) {
  const panel = workbenchPanelsConfig[panelId];
  if (!panel) return null;
  const activeId = viewId ?? panel.defaultView;
  const view = panel.views.find(item => item.id === activeId);
  if (!view) return null;
  const View = view.component;
  return <View {...viewProps}/>;
}
