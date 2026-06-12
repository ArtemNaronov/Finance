import { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(dayjs(`${year}-${month}-01`).format('MMMM YYYY'));
  }, [month, year]);

  const shift = (delta: number) => {
    const d = dayjs(`${year}-${month}-01`).add(delta, 'month');
    onChange(d.month() + 1, d.year());
  };

  const isCurrent = dayjs(`${year}-${month}-01`).isSame(dayjs(), 'month');

  return (
    <>
      <Tooltip title="Предыдущий месяц">
        <IconButton size="small" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <span style={{ minWidth: 140, textAlign: 'center', textTransform: 'capitalize' }}>
        {label}
        {isCurrent ? ' (текущий)' : ''}
      </span>
      <Tooltip title="Следующий месяц">
        <IconButton
          size="small"
          onClick={() => shift(1)}
          disabled={isCurrent}
          aria-label="Следующий месяц"
        >
          <ChevronRightIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}
