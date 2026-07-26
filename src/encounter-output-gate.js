export function createEncounterOutputGate(requiredFields = []) {
  const required = requiredFields
    .map((field) => (typeof field === 'string' ? field : field?.name))
    .filter(Boolean);
  return {
    ready: required.length === 0,
    required,
    message: required.length
      ? `Output locked — complete ${required.join(', ')} using synthetic information.`
      : ''
  };
}

export function runEncounterOutput(gate, action, onBlocked = () => {}) {
  if (!gate.ready) {
    onBlocked(gate);
    return { ok: false, value: null };
  }
  return { ok: true, value: action() };
}

export function renderEncounterOutput(gate, buildOutput) {
  return gate.ready ? buildOutput() : gate.message;
}
