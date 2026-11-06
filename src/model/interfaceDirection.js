/**
 * A Service Interface's INPUT/OUTPUT classification is a separate contract
 * property, not DDS publish/subscribe direction or DataWriter/DataReader role.
 */
export const INTERFACE_DIRECTIONS = Object.freeze(['input', 'output']);
const valid = value => INTERFACE_DIRECTIONS.includes(value);

/** Migration helper ONLY. Naming-based guesses are not authoritative ICD facts. */
export function legacyDirectionFromName(name) {
  if (/^report[A-Z_]/.test(String(name??''))) return 'output';
  if (/^(set|query|cancel|add|delete|start|stop|update|request|clear|reset|enable|disable)[A-Z_]/.test(String(name??''))) return 'input';
  return null;
}

export function serviceOperationDirection(operation) {
  return valid(operation?.interfaceDirection) ? operation.interfaceDirection : null;
}

export function migrateLegacyOperationDirection(operation) {
  if (Object.prototype.hasOwnProperty.call(operation, 'interfaceDirection')) return operation;
  const inferred=legacyDirectionFromName(operation.name);
  return { ...operation, interfaceDirection:inferred,
    interfaceDirectionSource:inferred?'legacy-name':'unspecified' };
}
