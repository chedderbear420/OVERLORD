export function edgeSignalId({ sourceStateId, side, modelId }) {
  const raw = `${sourceStateId}_${side}_${modelId}`;
  return `sig_${raw.replace(/[^A-Za-z0-9._:-]/g, "_")}`;
}
