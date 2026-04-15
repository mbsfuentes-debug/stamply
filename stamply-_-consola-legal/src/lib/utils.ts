import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRut(value: string): string {
  // 1. Limpia el input eliminando todo excepto números y la letra K (mayúscula o minúscula)
  const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleaned.length === 0) return '';

  // 2. Formatea automáticamente el RUT como: XX.XXX.XXX-DV
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (cleaned.length === 1) {
    return cleaned;
  }

  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }

  return `${formattedBody}-${dv}`;
}

export function validateRut(rut: string): { isValid: boolean; isComplete: boolean; message: string } {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  // 4. Solo valida cuando el RUT esté completo (mínimo 7 dígitos más DV -> 8 chars)
  if (cleaned.length < 8) {
    return { isValid: false, isComplete: false, message: '' };
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  const isValid = dv === calculatedDv;

  if (isValid) {
    return { isValid: true, isComplete: true, message: 'RUT válido' };
  } else {
    // Si tiene 8 caracteres y es inválido, asumimos que el usuario sigue escribiendo el cuerpo de un RUT de 8 dígitos
    if (cleaned.length === 8) {
      return { isValid: false, isComplete: false, message: '' };
    }
    return { isValid: false, isComplete: true, message: 'RUT inválido: dígito verificador incorrecto' };
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // Try parsing the date
  let date = new Date(dateString);
  
  // If invalid, try parsing common formats like DD/MM/YYYY or DD-MM-YYYY
  if (isNaN(date.getTime())) {
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      // Assume DD-MM-YYYY
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }

  // If still invalid, return the original string
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('es-ES', { month: 'short' }).toLowerCase().replace('.', '');
  const year = date.getFullYear().toString().slice(-2);
  
  return `${day}-${month}-${year}`;
}
