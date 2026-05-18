import { ReactNode, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ViewListIcon from '@mui/icons-material/ViewList';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { hideSnackbar, toggleTheme } from '@/features/ui/uiSlice';
import { logout } from '@/features/auth/authSlice';
import { formatFio } from '@/utils/format';

const DRAWER_WIDTH = 248;

interface NavEntry {
  label: string;
  to: string;
  icon: ReactNode;
  hrOnly?: boolean;
}

const NAV_ITEMS: NavEntry[] = [
  { label: 'Сводка', to: '/', icon: <DashboardIcon /> },
  { label: 'Сотрудники', to: '/employees', icon: <PeopleIcon />, hrOnly: true },
  { label: 'Подразделения', to: '/departments', icon: <AccountTreeIcon />, hrOnly: true },
  { label: 'Должности', to: '/positions', icon: <WorkOutlineIcon />, hrOnly: true },
  { label: 'Штатное расписание', to: '/staffing', icon: <ViewListIcon /> },
  { label: 'Заявки на отпуск', to: '/leaves', icon: <EventAvailableIcon /> },
  { label: 'Отчёты', to: '/reports', icon: <AssessmentIcon />, hrOnly: true },
  { label: 'Мой профиль', to: '/profile', icon: <PersonIcon /> },
  { label: 'Настройки', to: '/settings', icon: <SettingsIcon /> },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { mode, snackbar } = useAppSelector((s) => s.ui);

  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            ШР
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.1, fontWeight: 600 }}>
              ШтатПлан
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v1.0
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {NAV_ITEMS.filter((it) => !it.hrOnly || user?.role === 'HR_MANAGER').map((it) => (
          <ListItem key={it.to} disablePadding sx={{ px: 1 }}>
            <ListItemButton
              component={NavLink}
              to={it.to}
              end={it.to === '/'}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                '&.active': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{it.icon}</ListItemIcon>
              <ListItemText primary={it.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: 15, sm: 18 } }}>
            Платформа управления штатным расписанием
          </Typography>
          <Tooltip title="Уведомления">
            <IconButton color="inherit">
              <Badge badgeContent={0} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
            <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.employee?.firstName?.charAt(0) ?? user?.email?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>
              <Box>
                <Typography variant="body2">
                  {formatFio(user?.employee)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role === 'HR_MANAGER' ? 'HR-менеджер' : 'Сотрудник'}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchor(null);
                navigate('/profile');
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Профиль
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                navigate('/settings');
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Настройки
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1440, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      <Snackbar
        open={snackbar?.open ?? false}
        autoHideDuration={4000}
        onClose={() => dispatch(hideSnackbar())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar?.severity ?? 'info'}
          variant="filled"
          onClose={() => dispatch(hideSnackbar())}
          sx={{ width: '100%' }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
