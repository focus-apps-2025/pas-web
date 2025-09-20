// src/component/adminnavbar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Toolbar,
  AppBar,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupsIcon,
  Description as DescriptionIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Business
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import authManager from '../services/authsession.js';

// Professional Website Header
const WebsiteHeader = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  borderBottom: '1px solid #E5E7EB',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
}));

// Professional Navigation Bar
const NavigationBar = styled(Box)(({ theme }) => ({
  backgroundColor: '#004F98',
  color: '#004F98',
  borderBottom: '3px solid #0066CC',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  borderRadius: '0 0 8px 8px',
}));

// Website-style Tab
const WebsiteTab = styled(Tab)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.8)',
  fontWeight: 600,
  fontSize: '15px',
  textTransform: 'none',
  minHeight: 60,
  '&.Mui-selected': {
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
}));

const AdminNavbar = ({ handleRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State variables
  const [selectedTab, setSelectedTab] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New user registered', time: '2 minutes ago', read: false },
    { id: 2, message: 'Team assignment completed', time: '5 hours ago', read: false },
    { id: 3, message: 'System update available', time: '1 day ago', read: true }
  ]);

  // Website Navigation Items with routes
  const navigationItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
    { label: 'Users', icon: PeopleIcon, path: '/admin/users' },
    { label: 'Teams', icon: GroupsIcon, path: '/admin/teams' },
    { label: 'Master Data', icon: DescriptionIcon, path: '/admin/master-desc' },
    { label: 'Reports', icon: AnalyticsIcon, path: '/admin/reports' },
  ];

  // Set the active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeIndex = navigationItems.findIndex(item => item.path === currentPath);
    if (activeIndex !== -1) {
      setSelectedTab(activeIndex);
    }
  }, [location.pathname]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await authManager.getCurrentUser();
      setUserProfile(user);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    navigate(navigationItems[newValue].path);
  };

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotificationsOpen = (event) => setNotificationsAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);
  
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const handleLogout = async () => {
    await authManager.logout();
    setLogoutDialogOpen(false);
    navigate('/');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Professional Website Header */}
      <WebsiteHeader position="static" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ height: 80, justifyContent: 'space-between' }}>
            {/* Logo/Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Business sx={{ color: '#004F98', fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800, 
                  color: '#004F98',
                  lineHeight: 1
                }}>
                  Parts Auditing System
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: '#6B7280',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  Professional Management Platform
                </Typography>
              </Box>
            </Box>
            
            {/* Navigation Bar with Tabs */}
            <NavigationBar>
              <Container maxWidth="xl">
                <Tabs 
                  value={selectedTab} 
                  onChange={handleTabChange}
                  variant={isMobile ? "scrollable" : "standard"}
                  scrollButtons={isMobile ? "auto" : false}
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#00D4FF',
                      height: 3,
                    }
                  }}
                >
                  {navigationItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <WebsiteTab
                        key={index}
                        icon={<IconComponent />}
                        label={item.label}
                        iconPosition="start"
                        sx={{ mr: 1 }}
                      />
                    );
                  })}
                </Tabs>
              </Container>
            </NavigationBar>

            {/* Header Actions */}
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={handleRefresh} sx={{ color: '#6B7280' }}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={handleNotificationsOpen} sx={{ color: '#6B7280' }}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Chip
                avatar={<Avatar sx={{ bgcolor: '#004F98' }}><AdminIcon /></Avatar>}
                label={userProfile?.name || 'Administrator'}
                onClick={handleProfileMenuOpen}
                sx={{ 
                  bgcolor: '#EFF6FF', 
                  color: '#004F98',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#DBEAFE' }
                }}
              />
            </Stack>
          </Toolbar>
        </Container>
      </WebsiteHeader>

      {/* Menus and Dialogs */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to logout from the admin dashboard?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLogout} sx={{ bgcolor: '#004F98' }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profile Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Account Preferences</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleProfileMenuClose(); setLogoutDialogOpen(true); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      <Menu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={handleNotificationsClose}>
        <MenuItem sx={{ fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>
          <Typography variant="subtitle1">Notifications</Typography>
          <Badge badgeContent={unreadNotifications} color="primary" sx={{ ml: 'auto' }} />
        </MenuItem>
        {notifications.map((notification) => (
          <MenuItem 
            key={notification.id} 
            onClick={() => markNotificationAsRead(notification.id)}
            sx={{ 
              py: 2,
              borderLeft: notification.read ? 'none' : '3px solid #004F98',
              bgcolor: notification.read ? 'transparent' : '#F8FAFC'
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center', color: '#004F98' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AdminNavbar;
