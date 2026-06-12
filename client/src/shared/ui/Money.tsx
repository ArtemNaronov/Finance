import { formatMoney } from '@/shared/lib/format';
import { PrivacyBlur } from '@/shared/ui/PrivacyBlur';

interface MoneyProps {
  amount: number;
  sign?: '+' | '−' | '-';
}

export function Money({ amount, sign }: MoneyProps) {
  return (
    <PrivacyBlur>
      {sign}
      {formatMoney(amount)}
    </PrivacyBlur>
  );
}
