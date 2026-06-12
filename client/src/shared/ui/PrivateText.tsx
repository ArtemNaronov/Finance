import { Fragment, ReactNode } from 'react';
import { usePrivacyStore } from '@/store/usePrivacyStore';
import { PrivacyBlur } from '@/shared/ui/PrivacyBlur';

const AMOUNT_PATTERN =
  /(\d[\d\s\u00A0]*(?:[.,]\d+)?\s*(?:₽|руб\.?|RUB))|((?:\+|−|-)\s*\d[\d\s\u00A0]*(?:[.,]\d+)?\s*(?:₽|руб\.?|RUB)?)/gi;

function isAmountPart(part: string): boolean {
  return /(\d[\d\s\u00A0]*(?:[.,]\d+)?\s*(?:₽|руб\.?|RUB))|((?:\+|−|-)\s*\d[\d\s\u00A0]*(?:[.,]\d+)?)/i.test(
    part,
  );
}

interface PrivateTextProps {
  children: string;
}

export function PrivateText({ children }: PrivateTextProps) {
  const amountsHidden = usePrivacyStore((s) => s.amountsHidden);

  if (!amountsHidden) {
    return <>{children}</>;
  }

  const parts = children.split(AMOUNT_PATTERN).filter((part) => part !== '');
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (isAmountPart(part)) {
      nodes.push(
        <PrivacyBlur key={index} inline>
          {part}
        </PrivacyBlur>,
      );
    } else {
      nodes.push(<Fragment key={index}>{part}</Fragment>);
    }
  });

  return <>{nodes}</>;
}
