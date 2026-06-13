import type { FieldTree } from '@angular/forms/signals';

/** Muestra error cuando el campo fue tocado y es inválido. */
export function showFieldError(field: FieldTree<unknown>): boolean {
  const state = field();
  return state.invalid() && state.touched();
}

/** Primer mensaje de error del campo signal form. */
export function firstFieldError(field: FieldTree<unknown>): string {
  const errors = field().errors();
  if (!errors.length) {
    return 'Valor inválido';
  }
  return errors[0]?.message ?? 'Valor inválido';
}

/** Marca todos los campos de primer nivel como tocados. */
export function touchFields(...fields: FieldTree<unknown>[]): void {
  for (const field of fields) {
    field().markAsTouched();
  }
}
