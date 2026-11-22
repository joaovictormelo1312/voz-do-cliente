export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string) {
  return value.length >= 8 && new TextEncoder().encode(value).length <= 72;
}

export function validProfileField(value: string) {
  return value.trim().length > 0 && value.trim().length <= 80;
}
