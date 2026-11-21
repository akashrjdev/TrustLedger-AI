/**
 * Enterprise validation utilities for TrustLedger AI
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

// Indian GSTIN standard format: 2 numbers, 5 letters, 4 numbers, 1 letter, 1 number/letter, Z, 1 number/letter
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Standard Indian IFSC format: 4 uppercase letters, 0, 6 characters
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Standard bank account: 9 to 18 digits
export const BANK_ACCOUNT_REGEX = /^[0-9]{9,18}$/;

export function validateGstin(gstin: string): ValidationResult {
  const clean = (gstin || '').trim().toUpperCase();
  if (!clean) {
    return { isValid: false, errorMessage: 'GSTIN is required.' };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return {
      isValid: false,
      errorMessage: 'Invalid GSTIN format. Example: 29AABCU9603R1Z7 (15 alphanumeric characters).',
    };
  }
  return { isValid: true };
}

export function validateBankAccount(accountNo: string): ValidationResult {
  const clean = (accountNo || '').trim();
  if (!clean) {
    return { isValid: false, errorMessage: 'Bank account number is required.' };
  }
  if (!BANK_ACCOUNT_REGEX.test(clean)) {
    return {
      isValid: false,
      errorMessage: 'Bank account number must be between 9 and 18 digits.',
    };
  }
  return { isValid: true };
}

export function validateIfsc(ifsc: string): ValidationResult {
  const clean = (ifsc || '').trim().toUpperCase();
  if (!clean) {
    return { isValid: false, errorMessage: 'IFSC code is required.' };
  }
  if (!IFSC_REGEX.test(clean)) {
    return {
      isValid: false,
      errorMessage: 'Invalid IFSC format. Example: HDFC0001234 or SBIN0004567.',
    };
  }
  return { isValid: true };
}

export function validateInvoiceNumber(invoiceNo: string): ValidationResult {
  const clean = (invoiceNo || '').trim();
  if (!clean) {
    return { isValid: false, errorMessage: 'Invoice number is required.' };
  }
  if (clean.length < 3) {
    return { isValid: false, errorMessage: 'Invoice number must be at least 3 characters.' };
  }
  if (clean.length > 30) {
    return { isValid: false, errorMessage: 'Invoice number cannot exceed 30 characters.' };
  }
  return { isValid: true };
}

export function validateAmount(amount: number | string): ValidationResult {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || amount === '') {
    return { isValid: false, errorMessage: 'Please enter a valid numeric amount.' };
  }
  if (num <= 0) {
    return { isValid: false, errorMessage: 'Amount must be greater than zero.' };
  }
  if (num > 100000000) {
    return { isValid: false, errorMessage: 'Amount exceeds maximum allowed limit (₹10 Crores).' };
  }
  return { isValid: true };
}

export function validateRequiredText(value: string, fieldName: string, minLen = 2, maxLen = 100): ValidationResult {
  const clean = (value || '').trim();
  if (!clean) {
    return { isValid: false, errorMessage: `${fieldName} is required.` };
  }
  if (clean.length < minLen) {
    return { isValid: false, errorMessage: `${fieldName} must be at least ${minLen} characters.` };
  }
  if (clean.length > maxLen) {
    return { isValid: false, errorMessage: `${fieldName} cannot exceed ${maxLen} characters.` };
  }
  return { isValid: true };
}
