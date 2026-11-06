import { WorkspaceWorkbench } from '../../../components/WorkspaceWorkbench.jsx';

/** View chooses the existing contextual editor; the component owns its behavior. */
export function WorkbenchView(props) {
  return <WorkspaceWorkbench {...props}/>;
}
