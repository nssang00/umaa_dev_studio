import { StudioShell } from './StudioShell.jsx';
import { WorkbenchPanelRenderer } from '../WorkbenchPanelRenderer.jsx';

/**
 * Studio screen composition: a layout positions registered views.
 * Feature content belongs to each View; this component never reads the store.
 */
export function StudioLayout({
  explorerProps = {}, workbenchProps = {}, propertiesProps = {}, consoleProps = {},
}) {
  return <StudioShell
    explorer={<WorkbenchPanelRenderer panelId="explorer" viewProps={explorerProps}/>}
    workbench={<WorkbenchPanelRenderer panelId="workbench" viewProps={workbenchProps}/>}
    properties={<WorkbenchPanelRenderer panelId="properties" viewProps={propertiesProps}/>}
    bottomPanel={<WorkbenchPanelRenderer panelId="bottom" viewProps={consoleProps}/>}
  />;
}
