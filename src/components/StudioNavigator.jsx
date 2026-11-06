import { ProjectModelExplorer } from './explorer/ProjectModelExplorer.jsx';

/** Kept as the stable explorer panel entrypoint. */
export function StudioNavigator(props) {
  return <ProjectModelExplorer {...props}/>;
}
