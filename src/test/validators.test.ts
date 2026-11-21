import { describe, it, expect } from 'vitest';
import {
  validateGstin,
  validateBankAccount,
  validateIfsc,
  validateInvoiceNumber,
  validateAmount,
  validateRequiredText,
} from '../utils/validators';

describe('Enterprise Validators Unit Tests', () => {
  describe('validateGstin', () => {
    it('validates correct Indian GSTIN format', () => {
      expect(validateGstin('29AABCU9603R1Z7').isValid).toBe(true);
      expect(validateGstin('27AABCV5678G2Z1').isValid).toBe(true);
    });

    it('rejects invalid GSTIN format', () => {
      expect(validateGstin('').isValid).toBe(false);
      expect(validateGstin('INVALID_GSTIN').isValid).toBe(false);
      expect(validateGstin('12345').isValid).toBe(false);
    });
  });

  describe('validateBankAccount', () => {
    it('validates 9 to 18 digit account numbers', () => {
      expect(validateBankAccount('918020491029').isValid).toBe(true);
      expect(validateBankAccount('02811040001928').isValid).toBe(true);
    });

    it('rejects non-numeric or too short bank accounts', () => {
      expect(validateBankAccount('').isValid).toBe(false);
      expect(validateBankAccount('12345').isValid).toBe(false);
      expect(validateBankAccount('ABCD12345678').isValid).toBe(false);
    });
  });

  describe('validateIfsc', () => {
    it('validates standard IFSC codes', () => {
      expect(validateIfsc('HDFC0001029').isValid).toBe(true);
      expect(validateIfsc('ICIC0000281').isValid).toBe(true);
      expect(validateIfsc('SBIN0000691').isValid).toBe(true);
    });

    it('rejects invalid IFSC codes', () => {
      expect(validateIfsc('').isValid).toBe(false);
      expect(validateIfsc('HDFC123').isValid).toBe(false);
    });
  });

  describe('validateInvoiceNumber', () => {
    it('accepts valid invoice numbers', () => {
      expect(validateInvoiceNumber('INV-2026-089').isValid).toBe(true);
      expect(validateInvoiceNumber('BILL/2026/01').isValid).toBe(true);
    });

    it('rejects empty or too short invoice numbers', () => {
      expect(validateInvoiceNumber('').isValid).toBe(false);
      expect(validateInvoiceNumber('1').isValid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('validates positive amounts within limit', () => {
      expect(validateAmount(5000).isValid).toBe(true);
      expect(validateAmount('98000').isValid).toBe(true);
    });

    it('rejects zero or negative amounts', () => {
      expect(validateAmount(0).isValid).toBe(false);
      expect(validateAmount(-500).isValid).toBe(false);
      expect(validateAmount('abc').isValid).toBe(false);
    });
  });

  describe('validateRequiredText', () => {
    it('validates required text length', () => {
      expect(validateRequiredText('Valid Company', 'Vendor Name', 2, 50).isValid).toBe(true);
      expect(validateRequiredText('', 'Vendor Name').isValid).toBe(false);
    });
  });
});
