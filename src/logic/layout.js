/**
 * Dagre-based Component graph layout.
 * Component graph semantics remain in WorkspaceSnapshot; node positions are presentation only.
 * Matches the @dagrejs/dagre graphlib/layout approach used by ea_react.
 */
import { graphlib, layout } from '@dagrejs/dagre';
export const COMPONENT_NODE_WIDTH = 266;
const COMPONENT_TITLE_HEIGHT = 48;
const SERVICE_PORT_HEIGHT = 33;
const EMPTY_PORTS_HEIGHT = 45;
const NODE_BORDER = 2;
export function componentNodeHeight(snapshot, componentId) {
    const count = snapshot.bindings.filter(b => b.componentId === componentId).length;
    return COMPONENT_TITLE_HEIGHT + Math.max(EMPTY_PORTS_HEIGHT, count * SERVICE_PORT_HEIGHT) + NODE_BORDER;
}
/**
 * Place providers to the left of their consumers (LR direction).
 * Dagre works with node centers, while React Flow uses top-left positions.
 */
export function layoutComponentPositions(snapshot) {
    const graph = new graphlib.Graph()
        .setDefaultEdgeLabel(() => ({}))
        .setGraph({ rankdir: 'LR', nodesep: 82, ranksep: 175, marginx: 48, marginy: 48 });
    const ids = new Set(snapshot.components.map(c => c.id));
    for (const component of snapshot.components) {
        graph.setNode(component.id, {
            width: COMPONENT_NODE_WIDTH,
            height: componentNodeHeight(snapshot, component.id),
        });
    }
    const bindingIndex = new Map(snapshot.bindings.map(b => [b.id, b]));
    for (const connection of snapshot.connections) {
        const provider = bindingIndex.get(connection.providerBindingId);
        const consumer = bindingIndex.get(connection.consumerBindingId);
        if (!provider || !consumer)
            continue;
        if (provider.componentId === consumer.componentId)
            continue;
        if (!ids.has(provider.componentId) || !ids.has(consumer.componentId))
            continue;
        graph.setEdge(provider.componentId, consumer.componentId);
    }
    if (snapshot.components.length)
        layout(graph);
    const positions = {};
    for (const component of snapshot.components) {
        const node = graph.node(component.id);
        if (node) {
            positions[component.id] = {
                x: Math.round(node.x - COMPONENT_NODE_WIDTH / 2),
                y: Math.round(node.y - componentNodeHeight(snapshot, component.id) / 2),
            };
        }
    }
    return positions;
}
/** Preserve previously dragged nodes; fill missing positions from Dagre. */
export function ensureComponentPositions(snapshot) {
    const missing = snapshot.components.some(c => !snapshot.positions[c.id]);
    if (!missing)
        return snapshot;
    const generated = layoutComponentPositions(snapshot);
    return { ...snapshot, positions: { ...generated, ...snapshot.positions } };
}
