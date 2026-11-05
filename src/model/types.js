export const uuid = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        return crypto.randomUUID();
    return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};
