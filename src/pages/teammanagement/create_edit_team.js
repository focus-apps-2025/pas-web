// src/pages/admin/CreateEditTeam.js
import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Container,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  MyLocation as MyLocationIcon,
  NewReleases as NewReleasesIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import authManager from '../../services/authsession.js';

// Color palette matching your brand
const AppColors = {
  primaryColor: '#004F98',
  primaryLight: '#1976D2',
  primaryDark: '#003366',
  backgroundColor: '#FAFBFC',
  cardColor: '#FFFFFF',
  surfaceColor: '#F8F9FA',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  dividerColor: '#E5E7EB',
  shadowColor: 'rgba(0, 79, 152, 0.08)',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  inactiveColor: '#94A3B8'
};

const CreateEditTeam = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const team = location.state?.team || null;

  const [formData, setFormData] = useState({
    siteName: '',
    location: '',
    description: '',
    isNewSite: false,
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableTeamMembers, setAvailableTeamMembers] = useState([]);
  const [availableTeamLeaders, setAvailableTeamLeaders] = useState([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isCreating = !team;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (team) {
      setFormData({
        siteName: team.siteName || '',
        location: team.location || '',
        description: team.description || '',
        isNewSite: team.isNewSite || false,
        status: team.status || 'active'
      });
      setSelectedTeamMembers(team.members || []);
      setSelectedTeamLeader(team.teamLeader || null);
    }
  }, [team]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const user = await authManager.getCurrentUser();
      if (!user) {
        showSnackbar('Please log in again', 'error');
        navigate('/login');
        return;
      }

      setCurrentUser(user);

      // Load available team members
      await fetchAvailableTeamMembers();

      if (user.role === 'admin') {
        await fetchAvailableTeamLeaders();
        if (isCreating) {
          setSelectedTeamLeader(null);
        }
      } else if (user.role === 'team_leader') {
        if (isCreating) {
          setSelectedTeamLeader(user);
          setAvailableTeamLeaders([user]);
        } else {
          setAvailableTeamLeaders(selectedTeamLeader ? [selectedTeamLeader] : []);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showSnackbar('Error loading data: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeamMembers = async () => {
    try {
      const members = await api.getUsersByRole('team_member');
      
      // Filter out members who are already in active teams
      const availableMembers = [];
      for (const user of members) {
        try {
          const memberTeams = await api.getTeamsForMember(user._id || user.id);
          const hasActiveTeam = memberTeams.some(team => team.status.toLowerCase() === 'active');
          if (!hasActiveTeam && user._id !== currentUser?._id && user.id !== currentUser?.id) {
            availableMembers.push(user);
          }
        } catch (error) {
          console.error(`Error checking teams for user ${user.name}:`, error);
          // If we can't check, include the user to be safe
          availableMembers.push(user);
        }
      }
      
      setAvailableTeamMembers(availableMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      showSnackbar('Failed to load team members', 'error');
    }
  };

  const fetchAvailableTeamLeaders = async () => {
    try {
      const teamLeaders = await api.getUsersByRole('team_leader');
      const admins = await api.getUsersByRole('admin');
      
      const allLeaders = [...teamLeaders, ...admins];
      const uniqueLeaders = allLeaders.filter((leader, index, self) =>
        index === self.findIndex(t => (t._id || t.id) === (leader._id || leader.id))
      );
      
      setAvailableTeamLeaders(uniqueLeaders);
    } catch (error) {
      console.error('Error fetching team leaders:', error);
      showSnackbar('Failed to load team leaders', 'error');
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        showSnackbar('Geolocation is not supported by this browser', 'warning');
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use a geocoding service (here using OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          location: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showSnackbar('Failed to get current location', 'error');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.siteName.trim()) {
      newErrors.siteName = 'Please enter a site name';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Please enter a location';
    }

    if (isAdmin && !selectedTeamLeader) {
      newErrors.teamLeader = 'Please select a team leader';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const teamData = {
        siteName: formData.siteName,
        location: formData.location,
        description: formData.description,
        isNewSite: formData.isNewSite,
        status: formData.status,
        members: selectedTeamMembers.map(member => member._id || member.id)
      };

      if (selectedTeamLeader) {
        teamData.leader = selectedTeamLeader._id || selectedTeamLeader.id;
      }

      let result;
      if (isCreating) {
        result = await api.createTeam(teamData);
      } else {
        result = await api.updateTeam(team._id || team.id, teamData);
      }

      if (result.success) {
        showSnackbar(
          result.message || (isCreating ? 'Team created successfully!' : 'Team updated successfully!'),
          'success'
        );
        setTimeout(() => navigate('/admin/teams'), 1500);
      } else {
        showSnackbar(
          result.message || (isCreating ? 'Failed to create team' : 'Failed to update team'),
          'error'
        );
      }
    } catch (error) {
      console.error('Save error:', error);
      showSnackbar('Error saving team: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }));
  };
const handleTeamLeaderChange = (e) => {
  const leaderId = e.target.value;
  const leader = availableTeamLeaders.find(l => l.id === leaderId || l._id === leaderId);
  setSelectedTeamLeader(leader);
  if (errors.teamLeader) {
    setErrors(prev => ({ ...prev, teamLeader: '' }));
  }
};

  const openMemberDialog = () => {
    setMemberDialogOpen(true);
  };

  const closeMemberDialog = () => {
    setMemberDialogOpen(false);
  };

  const toggleTeamMember = (member) => {
    setSelectedTeamMembers(prev => {
      const isSelected = prev.some(m => (m._id || m.id) === (member._id || member.id));
      if (isSelected) {
        return prev.filter(m => (m._id || m.id) !== (member._id || member.id));
      } else {
        return [...prev, member];
      }
    });
  };

  const removeTeamMember = (memberId) => {
    setSelectedTeamMembers(prev => prev.filter(m => (m._id || m.id) !== memberId));
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: AppColors.primaryColor }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: AppColors.backgroundColor, minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: AppColors.primaryColor,
          borderRadius: '0 0 24px 24px',
          px: 2,
          py: 1
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
            {isCreating ? 'Create New Team' : 'Edit Team'}
          </Typography>

          <Box sx={{ width: 40 }} /> {/* Spacer for balance */}
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'white',
            boxShadow: `0 4px 20px ${AppColors.shadowColor}`
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: AppColors.textPrimary }}>
            {isCreating ? 'Create New Team' : 'Edit Team Information'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {/* Site Name */}
            <TextField
              fullWidth
              label="Site Name"
              value={formData.siteName}
              onChange={handleInputChange('siteName')}
              error={!!errors.siteName}
              helperText={errors.siteName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${AppColors.primaryColor}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BusinessIcon sx={{ color: AppColors.primaryColor, fontSize: 20 }} />
                    </Box>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            {/* Location */}
            <TextField
              fullWidth
              label="Area Name (Location)"
              value={formData.location}
              onChange={handleInputChange('location')}
              error={!!errors.location}
              helperText={errors.location}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${AppColors.primaryColor}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <LocationOnIcon sx={{ color: AppColors.primaryColor, fontSize: 20 }} />
                    </Box>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      edge="end"
                    >
                      {gettingLocation ? (
                        <CircularProgress size={20} />
                      ) : (
                        <MyLocationIcon sx={{ color: AppColors.primaryColor }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description (Optional)"
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${AppColors.primaryColor}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <DescriptionIcon sx={{ color: AppColors.primaryColor, fontSize: 20 }} />
                    </Box>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            {/* New Site Toggle */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: AppColors.surfaceColor,
                border: `1px solid ${AppColors.dividerColor}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: formData.isNewSite ? `${AppColors.warningColor}10` : `${AppColors.inactiveColor}10`,
                    mr: 2
                  }}
                >
                  <NewReleasesIcon sx={{ 
                    color: formData.isNewSite ? AppColors.warningColor : AppColors.inactiveColor, 
                    fontSize: 24 
                  }} />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: AppColors.textPrimary }}>
                    New Site
                  </Typography>
                  <Typography variant="body2" sx={{ color: AppColors.textSecondary }}>
                    Mark this as a new site location
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isNewSite}
                      onChange={handleSwitchChange('isNewSite')}
                      color="warning"
                    />
                  }
                  label=""
                />
              </Box>
            </Paper>

            {/* Team Leader Section */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: AppColors.surfaceColor,
                border: `1px solid ${AppColors.dividerColor}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${AppColors.primaryColor}10`,
                    mr: 2
                  }}
                >
                  <PersonIcon sx={{ color: AppColors.primaryColor, fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Team Leader
                </Typography>
              </Box>

              {isAdmin ? (
                <FormControl fullWidth error={!!errors.teamLeader}>
                  <InputLabel>Select Team Leader</InputLabel>
                 <Select
                    value={selectedTeamLeader ? selectedTeamLeader.id || selectedTeamLeader._id : ''}
                    label="Select Team Leader"
                    onChange={handleTeamLeaderChange}
                >
                    {availableTeamLeaders.map((leader) => (
                        <MenuItem key={leader._id || leader.id} value={leader.id || leader._id}>                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: AppColors.primaryColor,
                              mr: 2,
                              fontSize: 14,
                              fontWeight: 'bold'
                            }}
                          >
                            {getInitials(leader.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{leader.name}</Typography>
                            <Typography variant="caption" sx={{ color: AppColors.textSecondary }}>
                              {leader.role.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.teamLeader && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {errors.teamLeader}
                    </Typography>
                  )}
                </FormControl>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${AppColors.primaryColor}10`,
                    border: `1px solid ${AppColors.primaryColor}30`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: AppColors.primaryColor,
                        mr: 2,
                        fontSize: 16,
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(selectedTeamLeader?.name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: AppColors.primaryColor, fontWeight: 500 }}>
                        Team Leader
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedTeamLeader?.name || 'Loading...'}
                      </Typography>
                    </Box>
                    <VerifiedIcon sx={{ color: AppColors.primaryColor }} />
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Team Members Section */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: AppColors.surfaceColor,
                border: `1px solid ${AppColors.dividerColor}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${AppColors.primaryColor}10`,
                    mr: 2
                  }}
                >
                  <GroupIcon sx={{ color: AppColors.primaryColor, fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Team Members
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: AppColors.textSecondary }}>
                  {selectedTeamMembers.length} member{selectedTeamMembers.length !== 1 ? 's' : ''} selected
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openMemberDialog}
                  sx={{
                    bgcolor: AppColors.primaryColor,
                    '&:hover': { bgcolor: AppColors.primaryDark }
                  }}
                >
                  Select Members
                </Button>
              </Box>

              {selectedTeamMembers.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: AppColors.backgroundColor,
                    borderRadius: 2,
                    border: `1px dashed ${AppColors.dividerColor}`
                  }}
                >
                  <GroupIcon sx={{ fontSize: 40, color: AppColors.textMuted, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: AppColors.textMuted }}>
                    No team members selected
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTeamMembers.map((member) => (
                    <Chip
                      key={member._id || member.id}
                      label={member.name}
                      onDelete={() => removeTeamMember(member._id || member.id)}
                      avatar={
                        <Avatar sx={{ bgcolor: AppColors.primaryColor, fontSize: 12 }}>
                          {getInitials(member.name)}
                        </Avatar>
                      }
                      sx={{
                        bgcolor: `${AppColors.primaryColor}10`,
                        color: AppColors.primaryColor,
                        '& .MuiChip-deleteIcon': {
                          color: AppColors.primaryColor
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Paper>

            {/* Timestamps for editing */}
            {!isCreating && (
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: AppColors.surfaceColor,
                  border: `1px solid ${AppColors.dividerColor}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: `${AppColors.primaryColor}10`,
                      mr: 2
                    }}
                  >
                    <AccessTimeIcon sx={{ color: AppColors.primaryColor, fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Timestamps
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100 }}>
                      Created:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(team.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100 }}>
                      Updated:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(team.updatedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <CheckIcon />}
              sx={{
                bgcolor: AppColors.primaryColor,
                height: 56,
                borderRadius: 2,
                '&:hover': { bgcolor: AppColors.primaryDark },
                '&:disabled': { bgcolor: AppColors.textMuted }
              }}
            >
              {saving ? (isCreating ? 'Creating Team...' : 'Saving Changes...') : (isCreating ? 'Create Team' : 'Save Changes')}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Team Member Selection Dialog */}
      <Dialog
        open={memberDialogOpen}
        onClose={closeMemberDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ color: AppColors.primaryColor, mr: 2 }} />
            <Typography variant="h6">Select Team Members</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: AppColors.textSecondary }}>
            Select team members from the available list
          </Typography>

          {availableTeamMembers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GroupIcon sx={{ fontSize: 48, color: AppColors.textMuted, mb: 2 }} />
              <Typography variant="body2" sx={{ color: AppColors.textMuted }}>
                No available team members found
              </Typography>
            </Box>
          ) : (
            <List>
              {availableTeamMembers.map((member) => {
                const isSelected = selectedTeamMembers.some(m => (m._id || m.id) === (member._id || member.id));
                return (
                  <ListItem
                    key={member._id || member.id}
                    button
                    onClick={() => toggleTeamMember(member)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: isSelected ? `${AppColors.primaryColor}10` : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? `${AppColors.primaryColor}15` : `${AppColors.surfaceColor}`
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTeamMember(member)}
                        sx={{
                          color: AppColors.primaryColor,
                          '&.Mui-checked': {
                            color: AppColors.primaryColor
                          }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={member.name}
                      secondary={member.email}
                    />
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: AppColors.primaryColor,
                        fontSize: 14,
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(member.name)}
                    </Avatar>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMemberDialog}>Cancel</Button>
          <Button
            onClick={closeMemberDialog}
            variant="contained"
            sx={{
              bgcolor: AppColors.primaryColor,
              '&:hover': { bgcolor: AppColors.primaryDark }
            }}
          >
            Done ({selectedTeamMembers.length})
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateEditTeam;