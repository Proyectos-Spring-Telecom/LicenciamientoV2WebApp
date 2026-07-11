export function blockNonNumericKey(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (allowedKeys.includes(event.key)) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

export function blockNonAlphanumericKey(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (allowedKeys.includes(event.key)) {
    return;
  }

  if (!/^[a-zA-Z0-9]$/.test(event.key)) {
    event.preventDefault();
  }
}

export function sanitizeRfcValue(value: string): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 13).toUpperCase();
}

export function sanitizeNumericValue(value: string, maxLength: number): string {
  return (value ?? '').replace(/\D/g, '').slice(0, maxLength);
}
