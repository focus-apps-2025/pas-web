// Admin Dashboard Page
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminNavbar from '../component/adminnavbar'; // Corrected import path
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Chip,
  LinearProgress,
  Stack,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupsIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle,
  Business,
  Phone,
  Email,
  LocationOn,
  Schedule,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import AdminLoginModal from '../component/adminloginmodel'; 
import api from '../services/api';
import authManager from '../services/authsession'; 

// --- Styled Components ---
const ProfessionalCard = styled(Card)(({ theme }) => ({
  borderRadius: 12, // Slightly smaller border-radius
  boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.08)', // Lighter shadow
  border: '1px solid #E5E7EB',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)', // Less intense hover effect
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // Lighter hover shadow
  }
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg,  #004F98  100%, #3a79b3ff 0%)',
  minHeight: '160px', // Reduced minHeight
  padding: theme.spacing(6, 0), // Reduced padding
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 0), // Further reduced padding on mobile
  },
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

const StatsCard = styled(ProfessionalCard)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 3, // Smaller accent line
    background: 'var(--accent-color)',
  }
}));

const ManagementCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3), // Reduced padding
  borderRadius: 16, // Smaller border-radius
  backgroundColor: '#ffffff',
  border: '1px solid #E5E7EB',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  height: '200px', // Adjusted height
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', // Lighter shadow
  '&:hover': {
    transform: 'translateY(-6px)', // Less intense hover effect
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)', // Lighter hover shadow
    '& .management-icon': {
      transform: 'scale(1.08)', // Slightly less intense scale
    },
    '& .access-button': {
      backgroundColor: 'var(--card-color)',
      color: 'white',
      transform: 'translateX(2px)', // Less intense translate
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2), // Further reduced padding for smaller screens
    height: 'auto',
    minHeight: '180px'
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
  const [stats, setStats] = useState({ users: 0, teams: 0 }); 
  const [accessDenied, setAccessDenied] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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
      setLoggedIn(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsDataLoading(true);
      const users = await api.getAllUsers();
      const teams = await api.getTeams();
      setStats({ users: users?.length || 0, teams: teams?.length || 0 }); 
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setStats({ users: 0, teams: 0});
    } finally {
      setIsDataLoading(false);
    }
  };
  
  const handleLogout = async () => {
    setLogoutDialogOpen(false);
  };
  

  const loadUserProfile = async () => {
    try {
      const user = await authManager.getCurrentUser();
      setUserProfile(user);
    } catch (error) {
      console.error("Failed to load user profile for dashboard:", error);
      setUserProfile(null);
    }
  };

  const handleRefresh = () => {
    if (loggedIn && isAdmin) {
      loadDashboardData();
      loadUserProfile();
    }
  };

  const handleLoginSuccess = () => checkAuthStatus();
  
  const handleNavigation = (path) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: '#F8FAFC'
      }}>
        <CircularProgress sx={{ color: '#004F98' }} size={40} /> {/* Smaller loader */}
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
        <WarningIcon sx={{ fontSize: 60, color: '#EF4444', mb: 2 }} /> {/* Smaller icon */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1F2937', fontSize: { xs: '1.8rem', md: '2.2rem' } }}> {/* Smaller title */}
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: '#6B7280', textAlign: 'center', maxWidth: 400, fontSize: { xs: '0.9rem', md: '1rem' } }}> {/* Smaller text */}
          This administrative area requires proper credentials to access.
        </Typography>
        <Button 
          variant="contained" 
          size="medium" // Smaller button
          onClick={() => navigate('/')} 
          sx={{ 
            bgcolor: '#004F98', 
            px: 3, 
            py: 1, 
            borderRadius: 2, // Smaller border-radius
            fontSize: '1rem' // Smaller font size
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
      <AdminNavbar handleRefresh={handleRefresh} />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}> {/* Changed maxWidth to "lg" */}
          <Grid container alignItems="center" spacing={3}> {/* Reduced spacing */}
            <Grid item xs={12} md={7}>
              <Typography 
                variant="h4" // Changed variant to h4 from h2
                sx={{ 
                  fontWeight: 700, 
                  mb: 1, // Reduced margin
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '2.8rem', lg: '3rem' } // Scaled down font sizes
                }}
              >
                Welcome to Admin Dashboard, {userProfile?.name?.split(' ')[0] || 'Admin'}!
              </Typography>
              <Typography 
                variant="body1" // Changed variant to body1 from h5
                sx={{ 
                  mb: { xs: 2, md: 3 }, // Reduced margin
                  opacity: 0.9,
                  fontWeight: 400, 
                  maxWidth: 500, // Reduced maxWidth
                  fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem', lg: '1.25rem' } // Scaled down font sizes
                }}
              >
                Monitor, manage, and optimize your operations from one central hub.
              </Typography>
              <Stack direction="row" spacing={isMobile ? 1 : 2} flexWrap="wrap"> {/* Reduced spacing */}
                <Chip 
                  icon={<Schedule sx={{ fontSize: 16 }} />} // Smaller icon
                  label={`Today: ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 600,
                    py: 0.5, // Reduced padding
                    height: 28, // Reduced height
                    fontSize: { xs: '0.75rem', sm: '0.85rem' } // Scaled down font size for chip
                  }} 
                />
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}> {/* Reduced padding */}
        
        {/* Statistics Section */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}> {/* Reduced margin */}
          <Typography 
            variant="h5" // Changed variant to h5 from h4
            sx={{ 
              fontWeight: 700, 
              mb: { xs: 2, md: 3 }, // Reduced margin
              color: '#004f98',
              textAlign: 'center',
              textDecoration: 'double underline',
              textDecorationColor: '#0f0f0fff',
              textUnderlineOffset: '6px', // Smaller underline offset
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' } // Scaled down font sizes
            }}
          >
            System Overview & Statistics
          </Typography>
          
          {isDataLoading && (
            <LinearProgress 
              sx={{ 
                mb: { xs: 1.5, md: 2.5 }, // Reduced margin
                height: 4, // Smaller progress bar
                borderRadius: 2, // Smaller border-radius
                bgcolor: '#E5E7EB'
              }} 
            />
          )}
          
          <Grid container spacing={isMobile ? 2 : 3} justifyContent="center"> {/* Reduced spacing */}
            <Grid item xs={10} sm={6} md={4}> {/* Adjusted grid item for better scaling */}
              <StatsCard sx={{ '--accent-color': '#004F98' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}> {/* Reduced padding */}
                  <Avatar sx={{ 
                    bgcolor: '#EFF6FF', 
                    color: '#004F98', 
                    width: { xs: 50, md: 60 }, // Scaled down width
                    height: { xs: 50, md: 60 }, // Scaled down height
                    mx: 'auto',
                    mb: { xs: 1.5, md: 2 }, // Reduced margin
                    border: '2px solid #DBEAFE' // Thinner border
                  }}>
                    <PeopleIcon sx={{ fontSize: { xs: 28, md: 32 } }} /> {/* Scaled down icon size */}
                  </Avatar>
                  <Typography variant="h3" sx={{ // Changed variant to h3
                    fontWeight: 800, 
                    color: '#004F98',
                    mb: 0.5, // Reduced margin
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '2.8rem' } // Scaled down font sizes
                  }}>
                    {stats.users}
                  </Typography>
                  <Typography variant="body1" sx={{ // Changed variant to body1
                    color: '#6B7280', 
                    fontWeight: 600,
                    mb: { xs: 0.5, md: 1 }, // Reduced margin
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } // Scaled down font sizes
                  }}>
                    Active Users
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>

            <Grid item xs={10} sm={6} md={4}> {/* Adjusted grid item for better scaling */}
              <StatsCard sx={{ '--accent-color': '#10B981' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}> {/* Reduced padding */}
                  <Avatar sx={{ 
                    bgcolor: '#F0FDF4', 
                    color: '#10B981', 
                    width: { xs: 50, md: 60 }, // Scaled down width
                    height: { xs: 50, md: 60 }, // Scaled down height
                    mx: 'auto',
                    mb: { xs: 1.5, md: 2 }, // Reduced margin
                    border: '2px solid #DCFCE7' // Thinner border
                  }}>
                    <GroupsIcon sx={{ fontSize: { xs: 28, md: 32 } }} /> {/* Scaled down icon size */}
                  </Avatar>
                  <Typography variant="h3" sx={{ // Changed variant to h3
                    fontWeight: 800, 
                    color: '#10B981',
                    mb: 0.5, // Reduced margin
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '2.8rem' } // Scaled down font sizes
                  }}>
                    {stats.teams}
                  </Typography>
                  <Typography variant="body1" sx={{ // Changed variant to body1
                    color: '#6B7280', 
                    fontWeight: 600,
                    mb: { xs: 0.5, md: 1 }, // Reduced margin
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } // Scaled down font sizes
                  }}>
                    Active Teams
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>
        </Box>

        {/* Enhanced Management Tools Section */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}> {/* Reduced margin */}
          <Typography 
            variant="h5" // Changed variant to h5 from h4
            sx={{ 
              fontWeight: 700, 
              mb: { xs: 2.5, md: 4 }, // Reduced margin
              color: '#004f98',
              textAlign: 'center',
              textDecoration: 'double underline',
              textDecorationColor: '#0f0f0fff',
              textUnderlineOffset: '6px', // Smaller underline offset
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' } // Scaled down font sizes
            }}
          >
            Management Tools
          </Typography>
          
          <Grid container spacing={isMobile ? 2 : 3} sx={{ justifyContent: 'center' }}> {/* Reduced spacing */}
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
                        width: { xs: 55, md: 60 }, // Scaled down width
                        height: { xs: 50, md: 55 }, // Scaled down height
                        borderRadius: '50%',
                        backgroundColor: tool.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: { xs: 2, md: 2.5 }, // Reduced margin
                        mx: 'auto',
                        border: `2px solid ${tool.color}30` // Thinner border
                      }}>
                        <IconComponent 
                          className="management-icon"
                          sx={{ 
                            fontSize: { xs: 28, md: 32 }, // Scaled down icon size
                            color: tool.color,
                            transition: 'transform 0.3s ease'
                          }} 
                        />
                      </Box>
                      
                      <Typography variant="h6" sx={{ // Changed variant to h6
                        fontWeight: 700, 
                        color: '#1F2937',
                        textAlign: 'center',
                        mb: 0.5, // Reduced margin
                        fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } // Scaled down font sizes
                      }}>
                        {tool.title}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: '#6B7280',
                        textAlign: 'center',
                        mb: { xs: 1.5, md: 2.5 }, // Reduced margin
                        fontSize: { xs: '0.8rem', sm: '0.85rem' } // Scaled down font sizes
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
                          borderRadius: 2, // Smaller border-radius
                          py: { xs: 0.8, md: 1.2 }, // Reduced padding
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', md: '0.85rem' }, // Scaled down font sizes
                          textTransform: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: tool.color,
                          }
                        }}
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />} // Smaller icon
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
        py: { xs: 3, md: 4 }, // Reduced padding
        mt: { xs: 4, md: 6 } // Reduced margin
      }}>
        <Container maxWidth="lg"> {/* Changed maxWidth to "lg" */}
          <Grid container spacing={isMobile ? 2 : 3}> {/* Reduced spacing */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                <Business sx={{ fontSize: { xs: 22, md: 24 }, mr: 1.5 }} /> {/* Scaled down icon size */}
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  Parts Auditing System
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: { xs: 1.5, md: 2 },
                fontSize: { xs: '0.75rem', md: '0.8rem' } // Scaled down font size
              }}>
                Professional management platform for modern businesses. Streamline operations, enhance productivity, and drive growth.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ color: '#10B981', mr: 1, fontSize: { xs: 14, md: 16 } }} />
                <Typography variant="body2" sx={{ 
                  color: '#10B981', 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', md: '0.8rem' } // Scaled down font size
                }}>
                  System Status: Online
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 1.5, md: 2 }, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                Quick Links
              </Typography>
              <Stack spacing={isMobile ? 0.5 : 1}> {/* Reduced spacing */}
                {managementTools.map((tool) => ( 
                  <Typography 
                    key={tool.path}
                    variant="body2" 
                    onClick={() => handleNavigation(tool.path)}
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      '&:hover': { color: 'white' },
                      fontSize: { xs: '0.75rem', md: '0.8rem' } // Scaled down font size
                    }}
                  >
                    {tool.title}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 1.5, md: 2 }, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                Contact Information
              </Typography>
              <Stack spacing={isMobile ? 0.5 : 1}> {/* Reduced spacing */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 1.5, fontSize: { xs: 14, md: 16 }, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '0.75rem', md: '0.8rem' } }}>
                    focusenggapps@gmail.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1.5, fontSize: { xs: 14, md: 16 }, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '0.75rem', md: '0.8rem' } }}>
                    +91 9047878224
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1.5, fontSize: { xs: 14, md: 16 }, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '0.75rem', md: '0.8rem' } }}>
                    Gudiyatham, Vellore, Tamil Nadu, India, 632602.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: { xs: 2.5, md: 3 } }} /> 
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
              © {new Date().getFullYear()} Parts Auditing System. All rights reserved. Professional Management Platform
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Login Modal and associated Menus/Dialogs remain as in previous versions. 
          Assuming logoutDialogOpen state and its handling are correctly in AdminDashboard. */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle sx={{ fontSize: '1.25rem' }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to logout from the admin dashboard?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { handleLogout(); navigate('/'); }} sx={{ bgcolor: '#004F98' }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note: Profile Menu and Notifications Menu should ideally be managed within AdminNavbar itself
          to avoid duplication and ensure consistent behavior across pages.
          If AdminDashboard's logic needs to specifically trigger a Menu/Dialog from AdminNavbar,
          you'd pass props/callbacks. For now, commented out duplicated menu logic. */}
      {/* <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>...</Menu> */}
      {/* <Menu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={handleNotificationsClose}>...</Menu> */}
    </Box>
  );
};

export default AdminDashboard;
