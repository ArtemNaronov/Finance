import dayjs from 'dayjs';
import { getAllGoals } from './goals.js';

export interface CreditReminder {
  goalId: string;
  name: string;
  amount: number;
  dueDay: number;
  daysUntil: number;
  overdue: boolean;
  message: string;
}

export function getCreditReminders(): CreditReminder[] {
  const today = dayjs();
  const day = today.date();
  const reminders: CreditReminder[] = [];

  for (const g of getAllGoals()) {
    if (g.type !== 'credit' || g.currentAmount <= 0) continue;

    const dueDay = g.monthlyPayment > 0 ? 15 : 10;
    const amount = g.monthlyPayment > 0 ? g.monthlyPayment : g.recommendedMonthlyPayment;
    let daysUntil = dueDay - day;
    if (daysUntil < 0) daysUntil += today.daysInMonth();

    const overdue = day > dueDay && day <= dueDay + 5;
    const message =
      overdue
        ? `Платёж по «${g.name}» мог быть просрочен — проверьте оплату`
        : daysUntil <= 7
          ? `Через ${daysUntil} дн. — платёж ${amount.toLocaleString('ru-RU')} ₽ по «${g.name}»`
          : '';

    if (message) {
      reminders.push({
        goalId: g.id,
        name: g.name,
        amount,
        dueDay,
        daysUntil,
        overdue,
        message,
      });
    }
  }

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getMonthEndHint(balance: number, daysLeft: number): string | null {
  if (daysLeft > 5 || daysLeft <= 0) return null;
  if (balance < 0) {
    return `До конца месяца ${daysLeft} дн. — свободный остаток отрицательный. Проверьте расходы.`;
  }
  if (balance > 0) {
    return `До конца месяца ${daysLeft} дн. — свободный остаток ${balance.toLocaleString('ru-RU')} ₽. Можно отложить в копилку.`;
  }
  return null;
}
