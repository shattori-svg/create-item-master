function readWindowConfig(key) {
  if (typeof window === 'undefined') return '';
  const value = window.__APP_CONFIG__?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readBuildConfig(key) {
  const value = import.meta.env?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function getRuntimeConfig(key) {
  return readWindowConfig(key) || readBuildConfig(key) || '';
}
