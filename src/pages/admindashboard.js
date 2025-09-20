// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminNavbar from '../component/adminnavbar.js';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Stack,
  alpha
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupsIcon,
  Description as DescriptionIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  CheckCircle,
  Business,
  Phone,
  Email,
  LocationOn,
  Schedule,
  Star
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import AdminLoginModal from '../component/adminloginmodel';
import api from '../services/api';
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

// Hero Section
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg,  #004F98  100%, #3a79b3ff 0%)',
  color: 'white',
  padding: theme.spacing(8, 0),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  }
}));

// Professional Card
const ProfessionalCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #E5E7EB',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
}));

// Stats Card
const StatsCard = styled(ProfessionalCard)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    background: 'var(--accent-color)',
  }
}));

// Management Card Style
const ManagementCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 20,
  backgroundColor: '#ffffff',
  border: '1px solid #E5E7EB',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  height: '200px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
    '& .management-icon': {
      transform: 'scale(1.1)',
    },
    '& .access-button': {
      backgroundColor: 'var(--card-color)',
      color: 'white',
      transform: 'translateX(4px)',
    }
  }
}));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State variables
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [stats, setStats] = useState({ users: 11, teams: 8 });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New user registered', time: '2 minutes ago', read: false },
    { id: 2, message: 'Team assignment completed', time: '5 hours ago', read: false },
    { id: 3, message: 'System update available', time: '1 day ago', read: true }
  ]);
  const [selectedTab, setSelectedTab] = useState(0);

  // Website Navigation Items with routes
  const navigationItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
    { label: 'Users', icon: PeopleIcon, path: '/admin/users' },
    { label: 'Teams', icon: GroupsIcon, path: '/admin/teams' },
    { label: 'Master Data', icon: DescriptionIcon, path: '/admin/master-desc' },
    { label: 'Reports', icon: AnalyticsIcon, path: '/admin/reports' },
  ];

  // Management Tools with routes
  const managementTools = [
    {
      title: 'User Management',
      description: 'Manage users and roles',
      icon: PeopleIcon,
      color: '#004F98',
      bgColor: 'rgba(173, 216, 230, 0.1)',
      path: '/admin/users'
    },
    {
      title: 'Team Management',
      description: 'Organize teams and assignments',
      icon: GroupsIcon,
      color: '#10B981',
      bgColor: 'rgba(144, 238, 144, 0.1)',
      path: '/admin/teams'
    },
    {
      title: 'Master Descriptions',
      description: 'Maintain item descriptions',
      icon: DescriptionIcon,
      color: '#F59E0B',
      bgColor: 'rgba(255, 255, 224, 0.1)',
      path: '/admin/master-desc'
    },
    {
      title: 'Reports',
      description: 'View reports and analytics',
      icon: AnalyticsIcon,
      color: '#8B5CF6',
      bgColor: 'rgba(221, 160, 221, 0.1)',
      path: '/admin/reports'
    }
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
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (loggedIn && isAdmin) {
      loadDashboardData();
      loadUserProfile();
    }
  }, [loggedIn, isAdmin]);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authManager.isLoggedIn();
      setLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const user = await authManager.getCurrentUser();
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        } else {
          setAccessDenied(true);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsDataLoading(true);
      const users = await api.getAllUsers();
      const teams = await api.getTeams();
      setStats({ users: users?.length || 11, teams: teams?.length || 8 });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setStats({ users: 0, teams: 0});
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = await authManager.getCurrentUser();
      setUserProfile(user);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const handleRefresh = () => loadDashboardData();
  const handleLogout = async () => {
    await authManager.logout();
    setLogoutDialogOpen(false);
    setLoggedIn(false);
    setIsAdmin(false);
  };
  const handleLoginSuccess = () => checkAuthStatus();
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotificationsOpen = (event) => setNotificationsAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    navigate(navigationItems[newValue].path);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: '#F8FAFC'
      }}>
        <CircularProgress sx={{ color: '#004F98' }} size={50} />
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        flexDirection: 'column',
        bgcolor: '#F8FAFC'
      }}>
        <WarningIcon sx={{ fontSize: 80, color: '#EF4444', mb: 3 }} />
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#1F2937' }}>
          Access Denied
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#6B7280', textAlign: 'center', maxWidth: 500 }}>
          This administrative area requires proper credentials to access.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/')} 
          sx={{ 
            bgcolor: '#004F98', 
            px: 4, 
            py: 1.5, 
            borderRadius: 3,
            fontSize: '1.1rem'
          }}
        >
          Return to Homepage
        </Button>
      </Box>
    );
  }

  if (!loggedIn) {
    return (
      <AdminLoginModal open={true} onLoginSuccess={handleLoginSuccess} adminOnly={true} />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Professional Navigation */}
      <AdminNavbar></AdminNavbar>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container alignItems="center" spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h2" sx={{ 
                fontWeight: 500, 
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}>
                Welcome to Admin Dashboard
              </Typography>
              <Typography variant="h5" sx={{ 
                mb: 4, 
                opacity: 0.9,
                fontWeight: 400,
                maxWidth: 600
              }}>
                Monitor, manage, and optimize your operations from one central hub.
              </Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Chip 
                  icon={<Schedule />}
                  label={`Today: ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 600,
                    py: 1
                  }} 
                />
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        
        {/* Statistics Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 4, 
            color: '#1F2937',
            textAlign: 'center',
            textDecoration: 'underline',

          }}>
            System Overview & Statistics
          </Typography>
          
          {isDataLoading && (
            <LinearProgress 
              sx={{ 
                mb: 4, 
                height: 6, 
                borderRadius: 3,
                bgcolor: '#E5E7EB'
              }} 
            />
          )}
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={10} sm={1} md={2}>
              <StatsCard sx={{ '--accent-color': '#004F98' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: '#EFF6FF', 
                    color: '#004F98', 
                    width: 80, 
                    height: 80, 
                    mx: 'auto',
                    mb: 3,
                    border: '3px solid #DBEAFE'
                  }}>
                    <PeopleIcon sx={{ fontSize: 36 }} />
                  </Avatar>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    color: '#004F98',
                    mb: 1
                  }}>
                    {stats.users}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#6B7280', 
                    fontWeight: 600,
                    mb: 2
                  }}>
                    Active Users
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>

            <Grid item xs={10} sm={3} md={2}>
              <StatsCard sx={{ '--accent-color': '#10B981' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar sx={{ 
                    bgcolor: '#F0FDF4', 
                    color: '#10B981', 
                    width: 80, 
                    height: 80, 
                    mx: 'auto',
                    mb: 3,
                    border: '3px solid #DCFCE7'
                  }}>
                    <GroupsIcon sx={{ fontSize: 36 }} />
                  </Avatar>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    color: '#10B981',
                    mb: 1
                  }}>
                    {stats.teams}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#6B7280', 
                    fontWeight: 600,
                    mb: 2
                  }}>
                    Active Teams
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>
        </Box>

        {/* Enhanced Management Tools Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 6, 
            color: '#1F2937',
            textAlign: 'center',
            textDecoration: 'underline',

          }}>
            Management Tools
          </Typography>
          
          <Grid container spacing={4}>
            {managementTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <ManagementCard
                    elevation={0}
                    onClick={() => handleNavigation(tool.path)}
                    sx={{ '--card-color': tool.color }}
                  >
                    {/* Top Section */}
                    <Box>
                      <Box sx={{ 
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: tool.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        mx: 'auto',
                        border: `2px solid ${tool.color}30`
                      }}>
                        <IconComponent 
                          className="management-icon"
                          sx={{ 
                            fontSize: 36, 
                            color: tool.color,
                            transition: 'transform 0.3s ease'
                          }} 
                        />
                      </Box>
                      
                      <Typography variant="h5" sx={{ 
                        fontWeight: 700, 
                        color: '#1F2937',
                        textAlign: 'center',
                        mb: 1
                      }}>
                        {tool.title}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: '#6B7280',
                        textAlign: 'center',
                        mb: 3
                      }}>
                        {tool.description}
                      </Typography>
                    </Box>

                    {/* Bottom Button */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        className="access-button"
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderColor: tool.color,
                          color: tool.color,
                          borderRadius: 3,
                          py: 1.5,
                          fontWeight: 600,
                          fontSize: '14px',
                          textTransform: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: tool.color,
                          }
                        }}
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                      >
                        Access Now
                      </Button>
                    </Box>
                  </ManagementCard>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>

      {/* Professional Footer */}
      <Box sx={{ 
        bgcolor: '#1F2937', 
        color: 'white', 
        py: 6,
        mt: 8
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ fontSize: 28, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Parts Auditing System
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Professional management platform for modern businesses. Streamline operations, enhance productivity, and drive growth.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ color: '#10B981', mr: 1, fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                  System Status: Online
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Links
              </Typography>
              <Stack spacing={2}>
                {navigationItems.slice(0, 4).map((link) => (
                  <Typography 
                    key={link.path}
                    variant="body2" 
                    onClick={() => handleNavigation(link.path)}
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      '&:hover': { color: 'white' }
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Contact Information
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 2, fontSize: 18, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    admin@partsauditing.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 2, fontSize: 18, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    +1 (555) 123-4567
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 2, fontSize: 18, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Business District, City
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 4 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              © {new Date().getFullYear()} Parts Auditing System. All rights reserved. | Professional Management Platform
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* All your existing dialogs remain the same */}
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
    </Box>
  );
};

export default AdminDashboard;