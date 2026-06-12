import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SavingsIcon from '@mui/icons-material/Savings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export function OnboardingDialog() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const navigate = useNavigate();

  const handleClose = () => {
    completeOnboarding();
  };

  const steps = [
    { icon: <AddCircleOutlineIcon color="primary" />, text: 'Добавляйте доходы и расходы — копилки и кредиты учитываются отдельно' },
    { icon: <SavingsIcon color="primary" />, text: 'Создайте копилку или укажите кредит в разделе «Копилки»' },
    { icon: <AnalyticsIcon color="primary" />, text: 'Следите за бюджетами и аналитикой по категориям' },
    { icon: <SettingsIcon color="primary" />, text: 'Экспортируйте данные и настройте повторяющиеся операции в «Настройках»' },
  ];

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock={false}
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } },
      }}
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>Добро пожаловать в Finance</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Личный финансовый учёт на всех устройствах — Windows, macOS, iOS и Android.
        </Typography>
        <List>
          {steps.map((s, i) => (
            <ListItem key={i}>
              <ListItemIcon>{s.icon}</ListItemIcon>
              <ListItemText primary={s.text} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            completeOnboarding();
            navigate('/add');
          }}
        >
          Добавить первую операцию
        </Button>
        <Button onClick={handleClose}>Пропустить</Button>
      </DialogActions>
    </Dialog>
  );
}
