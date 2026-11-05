import { seedWorkspace } from '../model/seed.js';
import { parseWorkspaceImport } from '../model/validateImport.js';
const storageKey = (projectId) => `umaa-mock-v2-autopilot:${projectId}`;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const clone = (v) => structuredClone(v);
const volatileStorage = new Map();
/** file:// pages can have an opaque origin; the browser may deny localStorage access. */
export function canPersistLocally() {
    try {
        const key = '__umaa_static_storage_probe__';
        window.localStorage.setItem(key, '1');
        window.localStorage.removeItem(key);
        return true;
    }
    catch {
        return false;
    }
}
function getSaved(key) {
    try {
        return window.localStorage.getItem(key) ?? volatileStorage.get(key) ?? null;
    }
    catch {
        return volatileStorage.get(key) ?? null;
    }
}
function setSaved(key, value) {
    volatileStorage.set(key, value);
    try {
        window.localStorage.setItem(key, value);
    }
    catch { /* volatile fallback */ }
}
function removeSaved(key) {
    volatileStorage.delete(key);
    try {
        window.localStorage.removeItem(key);
    }
    catch { /* volatile fallback */ }
}
export class MockProjectRepository {
    async load(projectId) {
        await wait(80);
        const saved = getSaved(storageKey(projectId));
        if (!saved)
            return clone(seedWorkspace);
        try {
            return clone(parseWorkspaceImport(JSON.parse(saved)));
        }
        catch {
            return clone(seedWorkspace);
        }
    }
    async save(projectId, snapshot) {
        await wait(50);
        setSaved(storageKey(projectId), JSON.stringify(snapshot));
    }
    async reset(projectId) {
        await wait(40);
        removeSaved(storageKey(projectId));
        return clone(seedWorkspace);
    }
}
export const repository = new MockProjectRepository();
