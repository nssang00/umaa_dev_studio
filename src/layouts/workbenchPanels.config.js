// Studio layout view registry: each View composes reusable UI components.
import { ExplorerView } from './studio/views/ExplorerView.jsx';
import { WorkbenchView } from './studio/views/WorkbenchView.jsx';
import { PropertiesView } from './studio/views/PropertiesView.jsx';
import { ConsoleView } from './studio/views/ConsoleView.jsx';

export const workbenchPanelsConfig = Object.freeze({
  explorer: {
    id: 'explorer', defaultView: 'navigator',
    views: [{ id: 'navigator', label: 'Explorer', component: ExplorerView }],
  },
  workbench: {
    id: 'workbench', defaultView: 'editor',
    views: [{ id: 'editor', label: 'Workbench', component: WorkbenchView }],
  },
  properties: {
    id: 'properties', defaultView: 'selection',
    views: [{ id: 'selection', label: 'Properties', component: PropertiesView }],
  },
  bottom: {
    id: 'bottom', defaultView: 'diagnostics',
    views: [{ id: 'diagnostics', label: 'Output / Console', component: ConsoleView }],
  },
});
