// Registry for feature views; StudioShell remains responsible only for geometry.
import { StudioNavigator } from '../components/StudioNavigator.jsx';
import { WorkspaceWorkbench } from '../components/WorkspaceWorkbench.jsx';
import { SelectionPropertiesPanel } from '../components/SelectionPropertiesPanel.jsx';
import { BottomPanel } from '../components/BottomPanel.jsx';

export const workbenchPanelsConfig = Object.freeze({
  explorer: {
    id: 'explorer', defaultView: 'navigator',
    views: [{ id: 'navigator', label: 'Explorer', component: StudioNavigator }],
  },
  workbench: {
    id: 'workbench', defaultView: 'editor',
    views: [{ id: 'editor', label: 'Workbench', component: WorkspaceWorkbench }],
  },
  properties: {
    id: 'properties', defaultView: 'selection',
    views: [{ id: 'selection', label: 'Properties', component: SelectionPropertiesPanel }],
  },
  bottom: {
    id: 'bottom', defaultView: 'diagnostics',
    views: [{ id: 'diagnostics', label: 'Output / Console', component: BottomPanel }],
  },
});
