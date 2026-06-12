import type { GoalType, TransactionType } from '../types/index.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parsePositiveAmount(value: unknown, field = 'amount'): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new ValidationError(`Поле «${field}» должно быть положительным числом`);
  }
  return Math.round(num * 100) / 100;
}

export function parseOptionalAmount(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parsePositiveAmount(value, field);
}

export function parseDate(value: unknown): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new ValidationError('Дата должна быть в формате YYYY-MM-DD');
  }
  return value;
}

export function parseTransactionType(value: unknown): TransactionType {
  if (value !== 'income' && value !== 'expense') {
    throw new ValidationError('Тип операции: income или expense');
  }
  return value;
}

export function parseGoalType(value: unknown): GoalType {
  if (value !== 'savings' && value !== 'credit') {
    throw new ValidationError('Тип цели: savings или credit');
  }
  return value;
}

export function parseNonEmptyString(value: unknown, field: string, maxLen = 200): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`Поле «${field}» обязательно`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw new ValidationError(`Поле «${field}» слишком длинное (макс. ${maxLen})`);
  }
  return trimmed;
}

export function parseOptionalString(value: unknown, maxLen = 500): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new ValidationError('Некорректный текст');
  if (value.length > maxLen) throw new ValidationError(`Текст слишком длинный (макс. ${maxLen})`);
  return value;
}

export function parseLimit(value: unknown, defaultLimit = 10, max = 100): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultLimit;
  return Math.min(Math.max(1, Math.floor(num)), max);
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  comment: string;
}

export function parseTransactionBody(body: unknown): TransactionInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Некорректное тело запроса');
  }
  const data = body as Record<string, unknown>;
  return {
    type: parseTransactionType(data.type),
    amount: parsePositiveAmount(data.amount),
    category: parseNonEmptyString(data.category, 'category', 100),
    date: parseDate(data.date),
    comment: parseOptionalString(data.comment),
  };
}

export interface GoalCreateInput {
  name: string;
  type: GoalType;
  targetAmount: number;
  monthlyPayment?: number;
  interestRate?: number;
  deadline?: string;
  initialAmount?: number;
}

export function parseGoalCreateBody(body: unknown): GoalCreateInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Некорректное тело запроса');
  }
  const data = body as Record<string, unknown>;
  const deadline =
    data.deadline === undefined || data.deadline === null || data.deadline === ''
      ? undefined
      : parseDate(data.deadline);

  return {
    name: parseNonEmptyString(data.name, 'name'),
    type: parseGoalType(data.type),
    targetAmount: parsePositiveAmount(data.targetAmount, 'targetAmount'),
    monthlyPayment: parseOptionalAmount(data.monthlyPayment, 'monthlyPayment'),
    interestRate:
      data.interestRate === undefined || data.interestRate === null || data.interestRate === ''
        ? undefined
        : Number(data.interestRate),
    deadline,
    initialAmount: parseOptionalAmount(data.initialAmount, 'initialAmount'),
  };
}

export interface GoalUpdateInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  monthlyPayment?: number;
  interestRate?: number;
  deadline?: string | null;
}

export function parseGoalUpdateBody(body: unknown): GoalUpdateInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Некорректное тело запроса');
  }
  const data = body as Record<string, unknown>;
  const result: GoalUpdateInput = {};

  if (data.name !== undefined) result.name = parseNonEmptyString(data.name, 'name');
  if (data.targetAmount !== undefined) {
    result.targetAmount = parsePositiveAmount(data.targetAmount, 'targetAmount');
  }
  if (data.currentAmount !== undefined) {
    result.currentAmount = parsePositiveAmount(data.currentAmount, 'currentAmount');
  }
  if (data.monthlyPayment !== undefined) {
    result.monthlyPayment = parseOptionalAmount(data.monthlyPayment, 'monthlyPayment') ?? 0;
  }
  if (data.interestRate !== undefined) result.interestRate = Number(data.interestRate) || 0;
  if (data.deadline !== undefined) {
    result.deadline =
      data.deadline === null || data.deadline === '' ? null : parseDate(data.deadline);
  }

  return result;
}
