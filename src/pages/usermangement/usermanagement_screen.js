import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Chip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Fab,
  Grid,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  FormControlLabel,
  Slide,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  SearchOff as SearchOffIcon,
  PersonOutline as PersonOutlineIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  BorderAll
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../../services/api';
import authManager from '../../services/authsession.js';
import AdminNavbar from '../../component/adminnavbar.js';

// Styled components
const StyledCard = styled(Card)(({ theme, isCurrentUser }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0, 79, 152, 0.08)',
  borderLeft: isCurrentUser ? '4px solid #004F98' : 'none',
  transition: 'all 0.3s ease',
  margin: '16px 0',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 20px rgba(0, 79, 152, 0.12)',
  }
}));

const RoleChip = styled(Chip)(({ color }) => ({
  borderRadius: 8,
  height: 28,
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: `${color}15`,
  color: color,
  border: `1px solid ${color}30`
}));

const ActionButton = styled(IconButton)(({ color, hoverColor }) => ({
  backgroundColor: `${color}08`,
  border: `1px solid ${color}20`,
  transition: 'all 0.2s ease',
  padding: 8,
  '&:hover': {
    backgroundColor: hoverColor || `${color}20`,
  }
}));

const FilterPaper = styled(Paper)({
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 10px rgba(0, 79, 152, 0.06)',
  border: '1px solid #EBF0F5'
});

const SearchField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    color: '#111BA5',
    backgroundColor: '#F9FAFC',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#00eaffff',
      borderWidth: 3},
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#00eaffff',
      borderWidth: 2
    }
  }
});

const ContentContainer = styled(Container)({
  paddingTop: 24,
  paddingBottom: 24
});

const CompactTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: 40,
    fontSize: '0.9rem',
    borderRadius: 6
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
    transform: 'translate(14px, 12px) scale(1)'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)'
  }
}));

const RoleOption = styled(Paper)(({ theme, selected, color }) => ({
  cursor: 'pointer',
  padding: theme.spacing(1.5),
  borderRadius: 6,
  border: selected ? `2px solid ${color}` : '1px solid #E5E7EB',
  backgroundColor: selected ? `${color}08` : 'white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  height: '100%',
  minHeight: 100,
  transition: 'all 0.2s ease'
}));

const RoleIcon = styled(Box)(({ theme, color }) => ({
  backgroundColor: `${color}15`,
  color: color,
  borderRadius: '50%',
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1)
}));

const AppColors = {
  primaryColor: '#004F98',
  primaryLight: '#1976D2',
  primaryDark: '#003366',
  backgroundColor: '#F8FAFC',
  cardColor: '#FFFFFF',
  surfaceColor: '#F9FAFB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  dividerColor: '#E5E7EB',
  shadowColor: 'rgba(0, 79, 152, 0.08)',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  inactiveColor: '#94A3B8'
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleting, setDeleting] = useState(false);
  
  // Form Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { id: 'admin', title: 'Administrator', description: 'Full system access and management capabilities', color: AppColors.primaryColor, icon: PersonIcon },
    { id: 'team_leader', title: 'Team Leader', description: 'Can manage team members and assignments', color: '#10B981', icon: PersonIcon },
    { id: 'team_member', title: 'Team Member', description: 'Standard user with basic system access', color: '#6366F1', icon: PersonIcon }
  ];

  const isCreating = !editingUser;

  useEffect(() => {
    loadUsersAndCurrentUser();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchText, selectedRoleFilter, showActiveOnly]);

  const loadUsersAndCurrentUser = async () => {
    try {
      setLoading(true);
      const [usersData, currentUserData] = await Promise.all([
        api.getAllUsers(),
        authManager.getCurrentUser()
      ]);
      
      setUsers(usersData || []);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading users: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchText) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter);
    }

    if (showActiveOnly) {
      filtered = filtered.filter(user => user.isActive);
    }

    setFilteredUsers(filtered);
  };

  const confirmDeleteUser = async (user) => {
    const userId = user._id || user.id;
    
    if (!userId) {
      showSnackbar('Invalid user data. Cannot delete user.', 'error');
      return;
    }

    if (user.role === 'admin') {
      try {
        const admins = users.filter(u => u.role === 'admin' && u.isActive);
        if (admins.length <= 1 && user.isActive) {
          showSnackbar('Cannot delete the last active administrator account.', 'warning');
          return;
        }
      } catch (error) {
        showSnackbar('Error checking admin count', 'error');
        return;
      }
    }

    if (currentUser && (currentUser._id || currentUser.id) === userId) {
      showSnackbar('You cannot delete your own account.', 'warning');
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const userId = userToDelete._id || userToDelete.id;
    
    if (!userId) {
      console.error('No user ID found:', userToDelete);
      showSnackbar('Invalid user data. Cannot delete user.', 'error');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }
    
    setDeleting(true);
    try {
      const result = await api.deleteUser(userId);
      
      if (result.success) {
        showSnackbar(result.message || 'User deleted successfully!', 'success');
        setUsers(users.filter(user => (user._id || user.id) !== userId));
      } else {
        showSnackbar(result.message || 'Failed to delete user.', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showSnackbar('Unexpected error during deletion', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Form Modal functions
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      isActive: true
    });
    setFormErrors({});
    setShowPassword(false);
    setFormModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || '',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setFormErrors({});
    setShowPassword(false);
    setFormModalOpen(true);
  };

  const closeModal = () => {
    setFormModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      isActive: true
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a name';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter an email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (isCreating && !formData.password) {
      newErrors.password = 'Please enter a password';
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      let result;
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      };
      if (formData.password) {
        userData.password = formData.password;
      }
      if (isCreating) {
        result = await api.createUser(userData);
      } else {
        result = await api.updateUser(editingUser._id || editingUser.id, userData);
      }
      if (result.success) {
        showSnackbar(
          result.message || (isCreating ? 'User created successfully!' : 'User updated successfully!'),
          'success'
        );
        await loadUsersAndCurrentUser();
        closeModal();
      } else {
        showSnackbar(
          result.message || (isCreating ? 'Failed to create user.' : 'Failed to update user.'),
          'error'
        );
      }
    } catch (error) {
      showSnackbar('Error saving user: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAvatarColors = (role) => {
    switch (role) {
      case 'admin':
        return ['#004F98', '#0066CC'];
      case 'team_leader':
        return ['#10B981', '#0E9F6E'];
      case 'team_member':
        return ['#6366F1', '#4F46E5'];
      default:
        return ['#94A3B8', '#64748B'];
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return AppColors.primaryColor;
      case 'team_leader':
        return AppColors.successColor;
      case 'team_member':
        return '#6366F1';
      default:
        return AppColors.textMuted;
    }
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleRefresh = () => {
    loadUsersAndCurrentUser();
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedRoleFilter('all');
    setShowActiveOnly(false);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: AppColors.backgroundColor, minHeight: '100vh' }}>
        <AdminNavbar handleRefresh={handleRefresh} />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 80px)',
          flexDirection: 'column',
          gap: 3
        }}>
          <CircularProgress sx={{ color: AppColors.primaryColor }} />
          <Typography variant="h6" color="textSecondary">
            Loading user data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: AppColors.backgroundColor, minHeight: '100vh' }}>
      <AdminNavbar handleRefresh={handleRefresh} />
      
      {/* Page Header */}
      <Box
        sx={{
          bgcolor: AppColors.primaryColor,
          color: 'white',
          py: 5,
          px: 3,
          borderRadius: '0 0 24px 24px',
          mb: -3
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                View, create, edit and manage all system users
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <SearchField
                fullWidth
                placeholder="Search users by name or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(17, 59, 165, 1)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchText && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchText('')}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    border: 'none',
                    borderRadius: 2,
                    py: 0.5
                  }
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <ContentContainer maxWidth="xl">
        {/* Filters Section */}
        <FilterPaper elevation={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: AppColors.primaryColor }} />
              <Typography variant="h6" fontWeight={600}>
                Filters & Options
              </Typography>
            </Box>
            <Box>
              <Button 
                size="small" 
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                disabled={!searchText && selectedRoleFilter === 'all' && !showActiveOnly}
                sx={{ 
                  color: AppColors.textSecondary,
                  '&:hover': { bgcolor: `${AppColors.textSecondary}10` }
                }}
              >
                Clear Filters
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{ 
                  ml: 1,
                  borderColor: AppColors.primaryColor,
                  color: AppColors.primaryColor,
                  '&:hover': { 
                    bgcolor: `${AppColors.primaryColor}10`,
                    borderColor: AppColors.primaryColor 
                  }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="role-filter-label">Filter by Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  label="Filter by Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Administrators</MenuItem>
                  <MenuItem value="team_leader">Team Leaders</MenuItem>
                  <MenuItem value="team_member">Team Members</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 2,
                  border: `1px solid ${showActiveOnly ? AppColors.successColor : AppColors.dividerColor}`,
                  bgcolor: showActiveOnly ? `${AppColors.successColor}08` : 'transparent',
                  height: 40
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, ml: 1 }}>
                  <PeopleIcon
                    fontSize="small"
                    sx={{
                      mr: 1,
                      color: showActiveOnly ? AppColors.successColor : AppColors.textSecondary
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      color: showActiveOnly ? AppColors.successColor : AppColors.textSecondary
                    }}
                  >
                    Show Active Users Only
                  </Typography>
                </Box>
                <Switch
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  color="success"
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={openCreateModal}
                  sx={{
                    bgcolor: AppColors.primaryColor,
                    '&:hover': { bgcolor: AppColors.primaryDark },
                    borderRadius: 2,
                    px: 3,
                    py: 1
                  }}
                >
                  Add New User
                </Button>
              </Box>
            </Grid>
          </Grid>
        </FilterPaper>

        {/* Results Stats */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            px: 2
          }}
        >
          <Typography variant="body2" color="textSecondary" fontWeight={500}>
            Showing {filteredUsers.length} of {users.length} users
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SortIcon fontSize="small" sx={{ color: AppColors.textSecondary }} />
            <Typography variant="body2" color="textSecondary">
              Sort by: Name
            </Typography>
          </Box>
        </Box>

        {/* User List */}
        <Box>
          {filteredUsers.length === 0 ? (
            <Paper
              sx={{
                p: 5,
                textAlign: 'center',
                bgcolor: AppColors.cardColor,
                borderRadius: 3,
                border: `1px dashed ${AppColors.dividerColor}`
              }}
            >
              {searchText || selectedRoleFilter !== 'all' || showActiveOnly ? (
                <>
                  <SearchOffIcon sx={{ fontSize: 64, color: AppColors.textMuted, mb: 2 }} />
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    No users match your filters
                  </Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                    We couldn't find any users that match your current filter settings.
                  </Typography>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    sx={{ 
                      borderColor: AppColors.primaryColor,
                      color: AppColors.primaryColor,
                      px: 3
                    }}
                  >
                    Clear All Filters
                  </Button>
                </>
              ) : (
                <>
                  <PersonOutlineIcon sx={{ fontSize: 64, color: AppColors.textMuted, mb: 2 }} />
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    No users in the system
                  </Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                    Get started by creating your first user account
                  </Typography>
                  <Button 
                    variant="contained"
                    color="primary"
                    onClick={openCreateModal}
                    startIcon={<AddIcon />}
                    sx={{ 
                      bgcolor: AppColors.primaryColor,
                      '&:hover': { bgcolor: AppColors.primaryDark },
                      px: 3,
                      py: 1
                    }}
                  >
                    Add Your First User
                  </Button>
                </>
              )}
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser && (currentUser._id || currentUser.id) === (user._id || user.id);
                const avatarColors = getAvatarColors(user.role);
                const roleColor = getRoleColor(user.role);

                return (
                  <Grid item xs={12} sm={6} md={4} key={user._id || user.id}>
                    <StyledCard isCurrentUser={isCurrentUser}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              fontSize: 24,
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                              mr: 2
                            }}
                          >
                            {getInitials(user.name)}
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: AppColors.textPrimary,
                                  mr: 1,
                                  flex: 1
                                }}
                              >
                                {user.name || 'Unnamed User'}
                              </Typography>
                              
                              {isCurrentUser && (
                                <Chip
                                  label="You"
                                  size="small"
                                  sx={{
                                    bgcolor: `${AppColors.primaryColor}10`,
                                    color: AppColors.primaryColor,
                                    borderRadius: 1,
                                    height: 24,
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{ 
                                color: AppColors.textSecondary,
                                mb: 1.5
                              }}
                            >
                              {user.email || 'No email provided'}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <RoleChip 
                                label={capitalize(user.role)}
                                color={roleColor}
                              />
                              
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                bgcolor: user.isActive ? `${AppColors.successColor}10` : `${AppColors.inactiveColor}10`,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                              }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: user.isActive ? AppColors.successColor : AppColors.inactiveColor
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  fontWeight={500}
                                  sx={{
                                    color: user.isActive ? AppColors.successColor : AppColors.inactiveColor
                                  }}
                                >
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ mb: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <ActionButton
                                color={AppColors.primaryColor}
                                onClick={() => openEditModal(user)}
                                size="small"
                              >
                                <EditIcon fontSize="small" sx={{ color: AppColors.primaryColor }} />
                              </ActionButton>
                              
                              <ActionButton
                                color={AppColors.errorColor}
                                onClick={() => confirmDeleteUser(user)}
                                size="small"
                                disabled={isCurrentUser}
                              >
                                <DeleteIcon fontSize="small" sx={{ color: isCurrentUser ? AppColors.textMuted : AppColors.errorColor }} />
                              </ActionButton>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </ContentContainer>

      {/* Mobile-only FAB for adding users */}
      <Box sx={{ display: { md: 'none' } }}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: AppColors.primaryColor,
            '&:hover': { bgcolor: AppColors.primaryDark }
          }}
          onClick={openCreateModal}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Create/Edit User Modal */}
      <Dialog
        open={formModalOpen}
        onClose={() => !formLoading && closeModal()}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 600,
            bgcolor: AppColors.primaryColor,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {isCreating ? 'Create New User' : `Edit User: ${editingUser?.name}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              {isCreating 
                ? 'Add a new user to the system with specific permissions and access levels'
                : 'Update user information and permissions'
              }
            </Typography>
          </Box>
          <IconButton
            onClick={closeModal}
            disabled={formLoading}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleFormSubmit}>
            {/* User Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={750} mb={2}>
                User Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <CompactTextField
                    fullWidth
                    label="Full Name"
                    size="small"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <CompactTextField
                    fullWidth
                    label="Email Address"
                    size="small"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <CompactTextField
                    fullWidth
                    label={isCreating ? "Password" : "New Password (optional)"}
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Role Selection */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex',flexWrap:'wrap',gap:1,alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  User Role
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  (Select the role that defines the user's access and permissions in the system)
                </Typography>
              </Box>
              
              {formErrors.role && (
                <Alert severity="error" sx={{ mb: 2, py: 0 }}>
                  {formErrors.role}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                {roles.map((role) => (
                  <Grid item xs={12} md={2} key={role.id}>
                    <RoleOption sx={{maxWidth:'120px',}}
                      selected={formData.role === role.id}
                      color={role.color}
                      elevation={0}
                      onClick={() => handleInputChange('role', role.id)}
                    >
                      <RoleIcon color={role.color}>
                        <role.icon fontSize="small" />
                      </RoleIcon>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {role.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {role.description}
                      </Typography>
                    </RoleOption>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Account Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Account Status
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Control whether this user can access the system
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                borderRadius: 1,
                border: '1px solid #E5E7EB',
                bgcolor: '#F9FAFB',
                display: 'flex',
                alignItems: 'center'
              }}>
                {formData.isActive ? 
                  <CheckCircleIcon sx={{ color: AppColors.successColor, mr: 1.5 }} /> : 
                  <CancelIcon sx={{ color: AppColors.inactiveColor, mr: 1.5 }} />
                }
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {formData.isActive ? 'Active Account' : 'Inactive Account'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    User can {formData.isActive ? '' : 'not'} log in and access the system
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      color="success"
                    />
                  }
                  label=""
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={closeModal}
            disabled={formLoading}
            sx={{
              color: AppColors.textSecondary,
              '&:hover': { bgcolor: `${AppColors.textSecondary}10` }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{
              bgcolor: AppColors.primaryColor,
              '&:hover': { bgcolor: AppColors.primaryDark },
              px: 3
            }}
          >
            {formLoading ? 'Processing...' : (isCreating ? 'Create User' : 'Update User')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600 }}>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${AppColors.errorColor}20`,
                color: AppColors.errorColor,
                mr: 2
              }}
            >
              <DeleteIcon />
            </Avatar>
            <Typography variant="body1">
              Are you sure you want to delete the user <strong>{userToDelete?.name}</strong>?
            </Typography>
          </Box>
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            This action cannot be undone. All data associated with this user will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              color: AppColors.textSecondary,
              '&:hover': { bgcolor: `${AppColors.textSecondary}10` }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: AppColors.errorColor,
              '&:hover': { bgcolor: '#D32F2F' },
              px: 3
            }}
          >
            {deleting ? <CircularProgress size={24} color="inherit" /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;