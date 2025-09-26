// Admin Navbar Component
import React, { useState, useEffect } from "react";
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
  SwipeableDrawer, // Changed to SwipeableDrawer for better mobile UX
  List,
  ListItem,
  ListItemButton, // Use ListItemButton inside ListItem for better click area
  ListItemAvatar, // Not used in this context, can remove if not used elsewhere
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
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
  Menu as MenuIcon,
  Business,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import authManager from "../services/authsession.js";

// --- Styled Components (No significant functional change, but default font size might impact) ---
const WebsiteHeader = styled(AppBar)(({ theme }) => ({
  backgroundColor: "#FFFFFF",
  color: "#1F2937",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  borderBottom: "1px solid #E5E7EB",
  position: "sticky",
  top: 0,
  zIndex: 1000,
}));
const NavigationBar = styled(Box)(({ theme }) => ({
  backgroundColor: "#004F98",
  color: "#004F98", // This color applies to the Box itself, not text.
  borderBottom: "3px solid #0066CC",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  // Removed border-radius here as it was applied directly to Toolbar in previous version
}));
const WebsiteTab = styled(Tab)(({ theme }) => ({
  color: "rgba(255, 255, 255, 0.8)",
  fontWeight: 600,
  fontSize: "13px", // Reduced font size for tabs
  textTransform: "none",
  minHeight: 50, // Reduced minHeight for tabs
  "&.Mui-selected": {
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
  },
}));
//
const AdminNavbar = ({ handleRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // `true` for screens <= 960px (default md breakpoint)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // Profile menu anchor
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null); // Notifications menu anchor
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New user registered", time: "2 minutes ago", read: false },
    { id: 2, message: "Team assignment completed", time: "5 hours ago", read: false },
    { id: 3, message: "System update available", time: "1 day ago", read: true }
  ]);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Navigation Items
  const navigationItems = [
    { label: "Dashboard", icon: DashboardIcon, path: "/admin" },
    { label: "Users", icon: PeopleIcon, path: "/admin/users" },
    { label: "Teams", icon: GroupsIcon, path: "/admin/teams" },
    { label: "Master Data", icon: DescriptionIcon, path: "/admin/master-desc" },
    { label: "Reports", icon: AnalyticsIcon, path: "/admin/reports" }
  ];

  // Effect to set active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeIndex = navigationItems.findIndex(item => item.path === currentPath);
    if (activeIndex !== -1) {
      setSelectedTab(activeIndex);
    } else {
        // Fallback for paths not directly in navigationItems, e.g., /admin/teams/teamId
        // This makes sure dashboard tab is selected if on /admin path.
        if (currentPath.startsWith("/admin") && currentPath.split('/').length <= 2) {
             setSelectedTab(0);
        }
    }
  }, [location.pathname, navigationItems]);

  // Effect to load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await authManager.getCurrentUser();
      setUserProfile(user);
    } catch (error) {
      console.error("Failed to load user profile in AdminNavbar:", error);
      setUserProfile(null); // Ensure profile is null if loading fails
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    navigate(navigationItems[newValue].path);
    if (isMobile) { // Close drawer after navigation on mobile
      setDrawerOpen(false);
    }
  };

  // Handlers for profile and notification menus/dialogs
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotificationsOpen = (event) => setNotificationsAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleLogout = async () => {
    await authManager.logout();
    setLogoutDialogOpen(false);
    navigate("/"); // Redirect to login/home page after logout
  };

  return (
    <>
      <WebsiteHeader position="static" elevation={0}>
        <Container maxWidth="xl"> {/* Keep maxWidth="xl" for the overall container */}
          <Toolbar sx={{ height: 60, justifyContent: "space-between", px: { xs: 2, md: 0 } }}> {/* Reduced Toolbar height */}
            {/* Left Section: Logo/Brand and Mobile Menu Icon */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isMobile && (
                <IconButton color="primary" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Business sx={{ color: "#004F98", fontSize: { xs: 28, md: 30 }, mr: 1.5 }} /> {/* Smaller icon */}
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 800, 
                  color: "#004F98", 
                  lineHeight: 1,
                  fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' } // Smaller responsive font sizes
                }}>
                  Parts Auditing System
                </Typography>
                {!isMobile && (
                  <Typography variant="caption" sx={{ 
                    color: "#6B7280", 
                    fontSize: "11px", // Smaller caption font size
                    fontWeight: 500 
                  }}>
                    Professional Management Platform
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Middle Section: Desktop Tabs */}
            {!isMobile && (
              <NavigationBar sx={{ borderRadius: '0 0 8px 8px' }}> {/* Applied border-radius here */}
                <Container maxWidth="xl" sx={{ px: 0 }}> {/* Remove Container padding within NavigationBar */}
                  <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    sx={{
                      height: 50, // Reduced tabs height
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#00D4FF",
                        height: 3
                      }
                    }}
                  >
                    {navigationItems.map((item, idx) => {
                      const IconComp = item.icon;
                      return (
                        <WebsiteTab
                          key={item.label}
                          icon={<IconComp sx={{ fontSize: 18 }} />} // Smaller icon in tab
                          label={item.label}
                          iconPosition="start"
                          sx={{ mr: 0.5, px: 1.5 }} // Reduced margin and padding for tabs
                        />
                      );
                    })}
                  </Tabs>
                </Container>
              </NavigationBar>
            )}

            {/* Right Section: Header Actions */}
            <Stack 
              direction="row" 
              spacing={{ xs: 0.5, sm: 1 }} 
              alignItems="center" 
              sx={{ ml: { xs: 1, md: 2 } }}
            >
              {!isMobile && ( // Only show Refresh on desktop for now
                <IconButton onClick={handleRefresh} sx={{ color: "#6B7280", p: 1 }}> {/* Reduced padding */}
                  <RefreshIcon sx={{ fontSize: 20 }} /> {/* Smaller icon */}
                </IconButton>
              )}
              <IconButton onClick={handleNotificationsOpen} sx={{ color: "#6B7280", p: 1 }}> {/* Reduced padding */}
                <Badge badgeContent={unreadNotifications} color="error" overlap="circular" variant="dot">
                  <NotificationsIcon sx={{ fontSize: 20 }} /> {/* Smaller icon */}
                </Badge>
              </IconButton>
              {/* Profile Chip / Avatar */}
              {!isMobile ? (
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: "#004F98", width: 24, height: 24, fontSize: 12 }}>
                      <AdminIcon sx={{ fontSize: 16 }} /> {/* Smaller avatar icon */}
                    </Avatar>
                  }
                  label={userProfile?.name || "Administrator"}
                  onClick={handleProfileMenuOpen}
                  sx={{
                    bgcolor: "#EFF6FF",
                    color: "#004F98",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#DBEAFE" },
                    height: 32, // Smaller chip height
                    fontSize: '13px', // Smaller chip font size
                    px: 1
                  }}
                />
              ) : (
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 1 }}> {/* Reduced padding */}
                  <Avatar sx={{ bgcolor: "#004F98", width: 28, height: 28, fontSize: 14 }}> {/* Smaller mobile avatar */}
                    <AdminIcon sx={{ fontSize: 18 }} /> {/* Smaller mobile avatar icon */}
                  </Avatar>
                </IconButton>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </WebsiteHeader>

      {/* Drawer for mobile navigation */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      >
        <List sx={{ width: 220, pt: 2, bgcolor: "#F8FAFC", minHeight: '100%' }}> {/* Slightly narrower drawer, light background */}
          <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center' }}>
            <Business sx={{ color: "#004F98", fontSize: 28, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#004F98", fontSize: '1rem' }}>
              Navigation
            </Typography>
          </Box>
          <Divider sx={{ mb: 1, borderColor: '#E5E7EB' }} />
          {navigationItems.map((item, index) => {
            const IconComp = item.icon;
            return (
              <ListItem disablePadding key={item.label}>
                <ListItemButton 
                  selected={selectedTab === index}
                  onClick={() => handleTabChange(null, index)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'rgba(0, 79, 152, 0.1)', // Highlight selected
                      color: '#004F98',
                      '& .MuiListItemIcon-root': { color: '#004F98' },
                      '&:hover': { bgcolor: 'rgba(0, 79, 152, 0.15)' }
                    },
                    color: '#1F2937',
                    '& .MuiListItemIcon-root': { color: '#6B7280' },
                    '&:hover': { bgcolor: '#F0F2F5' }
                  }}
                >
                  <ListItemIcon>
                    <IconComp sx={{ fontSize: 20 }} /> {/* Smaller icon */}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} /> {/* Smaller text */}
                </ListItemButton>
              </ListItem>
            );
          })}
          <Divider sx={{ my: 1, borderColor: '#E5E7EB' }} />
          {/* Profile and Logout in Drawer */}
          {userProfile && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleProfileMenuOpen}>
                <ListItemIcon>
                  <AccountCircleIcon sx={{ color: "#6B7280", fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary={userProfile?.name || "Profile"} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding>
            <ListItemButton onClick={() => { setLogoutDialogOpen(true); setDrawerOpen(false); }}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#EF4444", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', color: '#EF4444' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </SwipeableDrawer>

      {/* Profile Menu (retains original functionality) */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
        
        <MenuItem onClick={() => { handleProfileMenuClose(); setLogoutDialogOpen(true); }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{color:'#f01c1cff'}} /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu (retains original functionality) */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
      >
        <MenuItem sx={{ fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.95rem' }}>Notifications</Typography>
          <Badge badgeContent={unreadNotifications} color="primary" sx={{ ml: "auto" }} />
        </MenuItem>
        {notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={() => markNotificationAsRead(notification.id)}
            sx={{
              py: 1.5, // Reduced padding
              borderLeft: notification.read ? "none" : "3px solid #004F98",
              bgcolor: notification.read ? "transparent" : "#F8FAFC"
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}> {/* Smaller text */}
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}> {/* Smaller caption */}
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: "center", color: "#004F98" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* Logout Dialog (retains original functionality) */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle sx={{ fontSize: '1.25rem' }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to logout from the admin dashboard?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLogout} sx={{ bgcolor: "#004F98" }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminNavbar;
