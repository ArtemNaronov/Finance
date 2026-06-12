import { formatMoney } from '@/shared/lib/format';
import { PrivacyBlur } from '@/shared/ui/PrivacyBlur';
import { usePrivacyStore } from '@/store/usePrivacyStore';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
}

export function PrivacyChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      {label && <div>{label}</div>}
      {payload.map((entry, index) => (
        <div key={index}>
          {entry.name ? `${entry.name}: ` : ''}
          <PrivacyBlur inline>{formatMoney(entry.value)}</PrivacyBlur>
        </div>
      ))}
    </div>
  );
}

interface YAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: number };
  fill?: string;
}

export function PrivacyYAxisTick({ x = 0, y = 0, payload, fill }: YAxisTickProps) {
  const amountsHidden = usePrivacyStore((s) => s.amountsHidden);
  const value = payload?.value ?? 0;
  const label = amountsHidden ? formatMoney(value) : `${Math.round(value / 1000)}k`;

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={fill}
      fontSize={11}
      style={amountsHidden ? { filter: 'blur(5px)' } : undefined}
    >
      {label}
    </text>
  );
}
