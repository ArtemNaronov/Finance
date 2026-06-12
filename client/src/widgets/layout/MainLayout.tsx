import { useEffect, useState } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import {

  AppBar,

  Box,

  Drawer,

  Fab,

  IconButton,

  List,

  ListItemButton,

  ListItemIcon,

  ListItemText,

  Toolbar,

  Tooltip,

  Typography,

  useMediaQuery,

  useTheme,

} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import AnalyticsIcon from '@mui/icons-material/Analytics';

import SmartToyIcon from '@mui/icons-material/SmartToy';

import MenuBookIcon from '@mui/icons-material/MenuBook';

import SavingsIcon from '@mui/icons-material/Savings';

import MenuIcon from '@mui/icons-material/Menu';

import Brightness4Icon from '@mui/icons-material/Brightness4';

import Brightness7Icon from '@mui/icons-material/Brightness7';

import VisibilityIcon from '@mui/icons-material/Visibility';

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import SearchIcon from '@mui/icons-material/Search';

import SettingsIcon from '@mui/icons-material/Settings';

import RepeatIcon from '@mui/icons-material/Repeat';

import PieChartIcon from '@mui/icons-material/PieChart';

import { useThemeStore } from '@/store/useThemeStore';

import { usePrivacyStore } from '@/store/usePrivacyStore';

import { GlobalSearchDialog } from '@/features/search/GlobalSearchDialog';
import { OnboardingDialog } from '@/features/onboarding/OnboardingDialog';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAppStore } from '@/store/useAppStore';



const DRAWER_WIDTH = 260;



const toolbarActionSx = {

  border: 1,

  borderColor: 'divider',

  borderRadius: 2,

  width: 40,

  height: 40,

  color: 'text.primary',

  '&:hover': { bgcolor: 'action.hover' },

} as const;



const toolbarActionActiveSx = {

  ...toolbarActionSx,

  bgcolor: 'primary.main',

  color: 'primary.contrastText',

  borderColor: 'primary.main',

  '&:hover': { bgcolor: 'primary.dark' },

} as const;



const navItems = [

  { path: '/', label: 'Дашборд', icon: <DashboardIcon /> },

  { path: '/transactions', label: 'Операции', icon: <ReceiptLongIcon /> },

  { path: '/add', label: 'Добавить', icon: <AddCircleOutlineIcon /> },

  { path: '/goals', label: 'Копилки', icon: <SavingsIcon /> },

  { path: '/budgets', label: 'Бюджеты', icon: <PieChartIcon /> },

  { path: '/recurring', label: 'Повторы', icon: <RepeatIcon /> },

  { path: '/analytics', label: 'Аналитика', icon: <AnalyticsIcon /> },

  { path: '/ai', label: 'AI-Помощник', icon: <SmartToyIcon /> },

  { path: '/diary', label: 'Дневник', icon: <MenuBookIcon /> },

  { path: '/settings', label: 'Настройки', icon: <SettingsIcon /> },

];



export function MainLayout() {

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const location = useLocation();

  const navigate = useNavigate();

  const { mode, toggleMode } = useThemeStore();

  const { amountsHidden, toggleAmountsHidden } = usePrivacyStore();
  const transactions = useFinanceStore((s) => s.transactions);
  const loading = useFinanceStore((s) => s.loading);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const showOnboarding = !loading && !onboardingDone && transactions.length === 0;



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {

        e.preventDefault();

        setSearchOpen(true);

      }

      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {

        navigate('/add');

      }

    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);

  }, [navigate]);



  const drawer = (

    <Box sx={{ pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>

        <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />

        <Typography variant="h6" fontWeight={700} color="primary">

          Finance

        </Typography>

      </Box>

      <List sx={{ px: 1.5, flex: 1, overflow: 'auto' }}>

        {navItems.map((item) => (

          <ListItemButton

            key={item.path}

            selected={location.pathname === item.path}

            onClick={() => {

              navigate(item.path);

              setMobileOpen(false);

            }}

            sx={{

              borderRadius: 2,

              mb: 0.5,

              '&.Mui-selected': {

                bgcolor: 'primary.main',

                color: 'white',

                '& .MuiListItemIcon-root': { color: 'white' },

                '&:hover': { bgcolor: 'primary.dark' },

              },

            }}

          >

            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>

            <ListItemText primary={item.label} />

          </ListItemButton>

        ))}

      </List>

    </Box>

  );



  return (

    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      <AppBar

        position="fixed"

        elevation={0}

        color="default"

        sx={{

          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },

          ml: { md: `${DRAWER_WIDTH}px` },

          bgcolor: 'background.paper',

          borderBottom: 1,

          borderColor: 'divider',

        }}

      >

        <Toolbar>

          {isMobile && (

            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: 'text.primary' }}>

              <MenuIcon />

            </IconButton>

          )}

          <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>

            {navItems.find((i) => i.path === location.pathname)?.label || 'Финансовый помощник'}

          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            <Tooltip title="Поиск (Ctrl+K)">

              <IconButton onClick={() => setSearchOpen(true)} sx={toolbarActionSx} aria-label="Поиск">

                <SearchIcon fontSize="small" />

              </IconButton>

            </Tooltip>

            <Tooltip title={amountsHidden ? 'Показать суммы' : 'Скрыть суммы'}>

              <IconButton

                onClick={toggleAmountsHidden}

                sx={amountsHidden ? toolbarActionActiveSx : toolbarActionSx}

                aria-label={amountsHidden ? 'Показать суммы' : 'Скрыть суммы'}

              >

                {amountsHidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}

              </IconButton>

            </Tooltip>

            <Tooltip title={mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}>

              <IconButton onClick={toggleMode} sx={toolbarActionSx} aria-label="Переключить тему">

                {mode === 'light' ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}

              </IconButton>

            </Tooltip>

          </Box>

        </Toolbar>

      </AppBar>



      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>

        {isMobile ? (

          <Drawer

            variant="temporary"

            open={mobileOpen}

            onClose={() => setMobileOpen(false)}

            ModalProps={{ keepMounted: true }}

            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}

          >

            {drawer}

          </Drawer>

        ) : (

          <Drawer

            variant="permanent"

            sx={{

              '& .MuiDrawer-paper': {

                width: DRAWER_WIDTH,

                boxSizing: 'border-box',

                borderRight: 1,

                borderColor: 'divider',

              },

            }}

            open

          >

            {drawer}

          </Drawer>

        )}

      </Box>



      <Box

        component="main"

        sx={{

          flexGrow: 1,

          p: { xs: 2, sm: 3 },

          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },

          mt: 8,

          pb: 10,

        }}

      >

        <Outlet />

      </Box>



      {location.pathname !== '/add' && (

        <Fab

          color="primary"

          aria-label="Добавить операцию"

          onClick={() => navigate('/add')}

          sx={{ position: 'fixed', bottom: 24, right: 24 }}

        >

          <AddCircleOutlineIcon />

        </Fab>

      )}



      {searchOpen && <GlobalSearchDialog open onClose={() => setSearchOpen(false)} />}

      {showOnboarding && <OnboardingDialog />}

    </Box>

  );

}

