export const INCOME_CATEGORIES = [
  'Зарплата',
  'Подработка',
  'Подарки',
  'Инвестиции',
  'Другое',
] as const;

export const EXPENSE_CATEGORIES = [
  'Продукты',
  'Кафе',
  'Кофе',
  'Транспорт',
  'Автомобиль',
  'Развлечения',
  'Подписки',
  'Здоровье',
  'Одежда',
  'Путешествия',
  'Дом',
  'Связь',
  'Другое',
] as const;

/** Переводы в копилку — не расходы, но уменьшают свободный остаток */
export const PIGGY_TRANSFER_CATEGORIES = ['Копилка', 'Накопления', 'Сбережения'] as const;

/** Платежи по кредиту через операции — не расходы, но уменьшают свободный остаток */
export const CREDIT_TRANSFER_CATEGORIES = ['Кредит'] as const;

export const TRANSFER_CATEGORIES = [
  ...PIGGY_TRANSFER_CATEGORIES,
  ...CREDIT_TRANSFER_CATEGORIES,
] as const;

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoriesForType(type: 'income' | 'expense'): readonly string[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function isTransferCategory(category: string): boolean {
  return (TRANSFER_CATEGORIES as readonly string[]).includes(category);
}

export function isPiggyTransferCategory(category: string): boolean {
  return (PIGGY_TRANSFER_CATEGORIES as readonly string[]).includes(category);
}

export function isCreditTransferCategory(category: string): boolean {
  return (CREDIT_TRANSFER_CATEGORIES as readonly string[]).includes(category);
}

export function isValidCategory(type: 'income' | 'expense', category: string): boolean {
  if (type === 'income') {
    return (INCOME_CATEGORIES as readonly string[]).includes(category);
  }
  return (
    (EXPENSE_CATEGORIES as readonly string[]).includes(category) ||
    isTransferCategory(category)
  );
}
