import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Tab,
  Tabs,
  Menu,
  ListItemIcon,
  ListItemText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Autocomplete,
  Tooltip,
  Backdrop,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  Checkbox,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  SearchOff as SearchOffIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  GroupAdd as GroupAddIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
  MoreVert as MoreVertIcon,
  Dns as DnsIcon,
  Visibility as VisibilityIcon,
  Numbers as NumbersIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  CurrencyRupee as RupeeIcon,
  LocalOffer as OfferIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  InsertDriveFile as FileIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
  NavigateNext as NavigateNextIcon,
  MyLocation as MyLocationIcon,
  NewReleases as NewReleasesIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import AdminNavbar from '../../component/adminnavbar.js';
import LoadingOverlay from '../../component/loadingoverlay.js';
import api from '../../services/api';
import authManager from '../../services/authsession.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Style constants
const primaryColor = '#004F98';
const secondaryColor = '#0066CC';
const successColor = '#10B981';
const warningColor = '#F59E0B'; 
const errorColor = '#EF4444';
const backgroundColor = '#F8FAFC';
const surfaceColor = '#FFFFFF';

// Styled components
const StyledCard = styled(Card)(({ theme, active }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0, 79, 152, 0.08)',
  borderLeft: active ? `4px solid ${primaryColor}` : 'none',
  transition: 'all 0.3s ease',
  margin: '16px 0',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 20px rgba(0, 79, 152, 0.12)',
  }
}));

const StatusChip = styled(Chip)(({ color }) => ({
  borderRadius: 8,
  height: 28,
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: `${color}15`,
  color: color,
  border: `1px solid ${color}30`
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  fontWeight: 500,
  marginRight: theme.spacing(3),
  '&.Mui-selected': {
    fontWeight: 700,
    color: primaryColor
  }
}));

const ContentContainer = styled(Container)({
  paddingTop: 24,
  paddingBottom: 24
});

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0, 79, 152, 0.08)',
  '& .MuiTableHead-root': {
    backgroundColor: alpha(primaryColor, 0.04)
  },
  '& .MuiTableCell-head': {
    color: primaryColor,
    fontWeight: 600
  }
}));

// Helper functions
function getStatusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return successColor;
    case "active":
      return warningColor;
    case "inactive":
      return errorColor;
    default:
      return warningColor;
  }
}

function getQuantityStatus(quantity) {
  if (quantity <= 0) return "out_of_stock";
  if (quantity < 10) return "low_stock";
  return "in_stock";
}

function getQuantityStatusColor(status) {
  switch (status) {
    case "in_stock":
      return successColor;
    case "low_stock":
      return warningColor;
    case "out_of_stock":
      return errorColor;
    default:
      return "#6B7280";
  }
}

// Main component
const TeamManagement = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  
  // State for authentication and user
  const [currentUser, setCurrentUser] = useState(null);
  
  // Global state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(teamId ? 'racks' : 'teams');
  
  // Teams state
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Team operations state
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamActionMenuAnchor, setTeamActionMenuAnchor] = useState(null);
  const [teamMenuTarget, setTeamMenuTarget] = useState(null);
  const [teamDeleteDialogOpen, setTeamDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  
  // Racks state
  const [racks, setRacks] = useState([]);

  const [rackSearch, setRackSearch] = useState('');
  const [rackStatusFilter, setRackStatusFilter] = useState('all');
  const [rackSortOrder, setRackSortOrder] = useState('rack_asc');
  const [selectedDate, setSelectedDate] = useState(null);
  const [totalRacks, setTotalRacks] = useState(0);
  const [rackPage, setRackPage] = useState(0);
  const [racksPerPage, setRacksPerPage] = useState(10);
const [detailsActiveTab, setDetailsActiveTab] = useState('info');

  
  // Rack operations state
  const [rackActionMenuAnchor, setRackActionMenuAnchor] = useState(null);
  const [rackMenuTarget, setRackMenuTarget] = useState(null);
  const [rackDeleteDialogOpen, setRackDeleteDialogOpen] = useState(false);
  const [rackToDelete, setRackToDelete] = useState(null);
  const [rackDetailsOpen, setRackDetailsOpen] = useState(false);
  const [rackToView, setRackToView] = useState(null);
  const [isWorkSubmitted, setIsWorkSubmitted] = useState(false);
  const [serverUserStats, setServerUserStats] = useState({});
  const [totalMissingInfo, setTotalMissingInfo] = useState(0);
  const [loadingMissingInfo, setLoadingMissingInfo] = useState(false);

  
  // For rack details editing
const [isEditingRackDetails, setIsEditingRackDetails] = useState(false);
// Add this with your other state variables
const [rackFormLoading, setRackFormLoading] = useState(false);

const [editRackData, setEditRackData] = useState({
  rackNo: '',
  partNo: '',
  mrp: '',
  nextQty: '',
  location: '',
  materialDescription: '',
  ndp: ''
});
const [editRackErrors, setEditRackErrors] = useState({});
  // Add with your other state variables

  
  // Team form state
  const [teamFormData, setTeamFormData] = useState({
    siteName: '',
    location: '',
    description: '',
    status: 'active',
    isNewSite: false,
    teamLeader: null,
    members: []
  });
  const [teamFormErrors, setTeamFormErrors] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableTeamLeaders, setAvailableTeamLeaders] = useState([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  


  // Initialize and load data
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Apply filters to teams
  useEffect(() => {
    if (teams.length > 0) {
      filterTeams();
    }
  }, [teams, teamSearch, teamStatusFilter]);
  

  // Handle tab changes
 // NEW: Handle search and filter changes - reload from server// 1. Main effect for loading racks (handles team selection and tab changes)
useEffect(() => {
  if (activeTab === 'racks' && selectedTeam) {
    loadRacks();
    checkWorkStatus();
  }
}, [activeTab, selectedTeam]); // Only depend on tab and team changes

// 2. Separate effect for search/filter changes (with debouncing)
useEffect(() => {
  if (activeTab === 'racks' && selectedTeam) {
    const timeoutId = setTimeout(() => {
      setRackPage(0); // Reset to first page
      loadRacks();
    }, 500); // 500ms delay to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }
}, [rackSearch, rackSortOrder, racksPerPage]); // Search-related dependencies

// 3. Date filter effect (separate because it should reload immediately)
useEffect(() => {
  if (activeTab === 'racks' && selectedTeam) {
    setRackPage(0);
    loadRacks();
    checkWorkStatus();
  }
}, [selectedDate]);

useEffect(() => {
  if (selectedTeam) {
    // Clear rack data immediately when team changes
    setRacks([]);
    setTotalRacks(0);
    setServerUserStats({});
    setTotalMissingInfo(0);
    // Reset filters for new team
    setRackSearch('');
    setSelectedDate(null);
    setRackPage(0);
  }
}, [selectedTeam]);
  
  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load current user
      const user = await authManager.getCurrentUser();
      setCurrentUser(user);
      
      // Load teams
      const teamsData = await api.getTeams();
      setTeams(teamsData || []);
      
      // If teamId is provided, find and set the selected team
      if (teamId) {
        const foundTeam = teamsData.find(team => (team._id === teamId || team.id === teamId));
        if (foundTeam) {
          setSelectedTeam(foundTeam);
          setActiveTab('racks');
        } else {
          setError(`Team with ID ${teamId} not found`);
        }
      }
      
      // Load available users for team assignment
      const usersData = await api.getAllUsers();
      setAvailableUsers(usersData.filter(user => user.isActive) || []);
      
      // Load team leaders and team members
      await fetchAvailableTeamLeaders();
      await fetchAvailableTeamMembers();
      
    } catch (error) {
      setError(`Failed to load data: ${error.message}`);
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available team members
 // Fetch available team members and exclude users already assigned to an active team.
// If editingTeam is set, members already assigned to that same team will be allowed.
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


  // Fetch available team leaders
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
  
  
  // Refresh all data
  const handleRefresh = () => {
    if (activeTab === 'teams') {
      loadInitialData();
    } else if (activeTab === 'racks' && selectedTeam) {
      loadRacks();
      checkWorkStatus();
    }
  };
  
 // Load racks for selected team
const loadRacks = useCallback(async () => {
  // Use the state variables directly, no need for parameters unless you
  // specifically need to load a different page than the current one.
  if (!selectedTeam) return;

  setLoading(true);
  setError(null);

  try {
    const formattedDate = selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : null;

    const params = {
      teamId: selectedTeam._id,
      page: rackPage + 1, // Read directly from state
      limit: racksPerPage, // Read directly from state
      // ... other params ...
      search: rackSearch || undefined,
      sortBy: rackSortOrder !== 'rack_asc' ? rackSortOrder : undefined,
      date: formattedDate,
    };
    
    // The rest of your logic to build params is great!
    // ...

    console.log('Loading racks with params:', params);
    const response = await api.getRacks(params);

    setRacks(response.racks || []);
    setTotalRacks(response.totalCount || 0);
     fetchUserStats()
    fetchTotalMissingInfo(teamId);
    
    // NO setRackPage() call here.

  } catch (error) {
    // ... error handling ...
  } finally {
    setLoading(false);
  }
}, [selectedTeam, rackPage, racksPerPage, rackSearch, rackSortOrder, selectedDate]); // Add all dependencies

// Then, use it in useEffect
useEffect(() => {
  loadRacks();
}, [loadRacks]); // This hook now re-runs whenever any dependency of loadRacks changes


// Add this function to get the total N/A count
const fetchTotalMissingInfo = async (teamParam = selectedTeam) => {
  if (!teamParam) {
    setTotalMissingInfo(0);
    return;
  }

  try {
    const params = {
      teamId: teamParam._id || teamParam.id,
      search: 'n/a',   // ✅ make sure we request N/A racks like mobile
      limit: 1         // we don’t need data, only totalCount
    };

    if (selectedDate) {
      params.date = format(selectedDate, 'yyyy-MM-dd');
    }

    const response = await api.getRacks(params);
    setTotalMissingInfo(response.totalCount || 0);
  } catch (error) {
    console.error('Error fetching missing info count:', error);
    setTotalMissingInfo(0);
  }
   finally {
    setLoadingMissingInfo(false);  //  stop loading state
  }
};



  
  // Check if work is submitted for the team
  const checkWorkStatus = async () => {
    if (!selectedTeam) return;
    
    try {
      const status = await api.getTeamWorkStatus(selectedTeam._id || selectedTeam.id);
      setIsWorkSubmitted(status);
    } catch (error) {
      console.error("Error checking work status:", error);
    }
  };
  
  // Fetch user statistics
  const fetchUserStats = async () => {
    if (!selectedTeam) return;
    
    try {
      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const stats = await api.getFirstScanByUser(selectedTeam._id || selectedTeam.id, formattedDate);
        
        const formattedStats = {};
        Object.entries(stats).forEach(([user, data]) => {
          formattedStats[user] = {
            totalCount: data.count || 0,
            firstScanTime: data.firstScan ? new Date(data.firstScan) : null
          };
        });
        setServerUserStats(formattedStats);
      } else {
        const counts = await api.getTotalScanCounts(selectedTeam._id || selectedTeam.id);
        const formattedStats = {};
        Object.entries(counts).forEach(([user, count]) => {
          formattedStats[user] = {
            totalCount: count,
            firstScanTime: null
          };
        });
        setServerUserStats(formattedStats);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setServerUserStats({});
    }
  };
  
  // Filter teams based on search and status filter
  const filterTeams = () => {
    let filtered = teams;
    
    // Apply search filter
    if (teamSearch) {
      filtered = filtered.filter(team => 
        (team.siteName || "").toLowerCase().includes(teamSearch.toLowerCase()) ||
        (team.location || "").toLowerCase().includes(teamSearch.toLowerCase())
      );
    }
    
    // Apply status filter
    if (teamStatusFilter !== 'all') {
      filtered = filtered.filter(team => (team.status || "active").toLowerCase() === teamStatusFilter);
    }
    
    setFilteredTeams(filtered);
  };
  
  // Filter racks based on search, status, and sort order
 // Filter racks based on search, status, and sort order
const filterRacks = () => {
  let filtered = [...racks];
  
  // Apply search filter
  if (rackSearch) {
    // Special search filters
    if (rackSearch === 'in_stock') {
      filtered = filtered.filter(rack => getQuantityStatus(rack.nextQty) === "in_stock");
    } 
    else if (rackSearch === 'low_stock') {
      filtered = filtered.filter(rack => getQuantityStatus(rack.nextQty) === "low_stock");
    } 
    else if (rackSearch === 'out_of_stock') {
      filtered = filtered.filter(rack => getQuantityStatus(rack.nextQty) === "out_of_stock");
    } 
    else if (rackSearch === 'n/a') {
      filtered = filtered.filter(rack => 
        (!rack.mrp || rack.mrp === 0) || 
        (!rack.ndp || rack.ndp === 0) || 
        (!rack.materialDescription || rack.materialDescription.trim() === '')
      );
    }

    else {
      // Standard text search
      filtered = filtered.filter(rack => 
        (rack.rackNo || "").toLowerCase().includes(rackSearch.toLowerCase()) ||
        (rack.partNo || "").toLowerCase().includes(rackSearch.toLowerCase()) ||
        (rack.materialDescription || "").toLowerCase().includes(rackSearch.toLowerCase()) ||
        (rack.location || "").toLowerCase().includes(rackSearch.toLowerCase())
      );
    }
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (rackSortOrder) {
      case "rack_asc":
        return (a.rackNo || "").localeCompare(b.rackNo || "");
      case "rack_desc":
        return (b.rackNo || "").localeCompare(a.rackNo || "");
      case "qty_asc":
        return (a.nextQty || 0) - (b.nextQty || 0);
      case "qty_desc":
        return (b.nextQty || 0) - (a.nextQty || 0);
      case "mrp_asc":
        return (a.mrp || 0) - (b.mrp || 0);
      case "mrp_desc":
        return (b.mrp || 0) - (a.mrp || 0);
      default:
        return 0;
    }
  });
  
  setRacks(filtered);
};

  
  // Clear all filters
 // Clear all filters
const clearFilters = () => {
  if (activeTab === 'teams') {
    setTeamSearch('');
    setTeamStatusFilter('all');
  } else {
    setRackSearch('');
    setRackStatusFilter('all');
    setRackSortOrder('rack_asc');
    setSelectedDate(null);
    setRackPage(0); // Reset pagination
    // Server reload will happen automatically via useEffect
  }
};

  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 'teams') {
      setSelectedTeam(null);
    }
  };
  
  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  // ----- TEAM OPERATIONS -----
  
  // Open team form for creation
  const openCreateTeamForm = () => {
    setEditingTeam(null);
    setTeamFormData({
      siteName: '',
      location: '',
      description: '',
      isNewSite: false,
      status: 'active'
    });
    setSelectedTeamMembers([]);
    setSelectedTeamLeader(null);
    setTeamFormErrors({});
    setTeamFormOpen(true);
  };
  
  // Open team form for editing
  const openEditTeamForm = (team) => {
    setEditingTeam(team);
    setTeamFormData({
      siteName: team.siteName || '',
      location: team.location || '',
      description: team.description || '',
      isNewSite: team.isNewSite || false,
      status: team.status || 'active'
    });
    
    setSelectedTeamMembers(team.members || []);
    setSelectedTeamLeader(team.teamLeader || null);
    
    setTeamFormErrors({});
    setTeamFormOpen(true);
  };
  
  // Close team form
  const closeTeamForm = () => {
    setTeamFormOpen(false);
    setEditingTeam(null);
    setTeamFormData({
      siteName: '',
      location: '',
      description: '',
      isNewSite: false,
      status: 'active'
    });
    setSelectedTeamMembers([]);
    setSelectedTeamLeader(null);
    setTeamFormErrors({});
  };

  // Get current location
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
        setTeamFormData(prev => ({
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
  
  // Validate team form
  const validateTeamForm = () => {
    const errors = {};
    
    if (!teamFormData.siteName.trim()) {
      errors.siteName = 'Site name is required';
    }
    
    if (!teamFormData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (currentUser?.role === 'admin' && !selectedTeamLeader) {
      errors.teamLeader = 'Please select a team leader';
    }
    
    setTeamFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle team form submission
  const handleTeamFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTeamForm()) return;
    
    setTeamFormLoading(true);
    
    try {
      const teamData = {
        siteName: teamFormData.siteName,
        location: teamFormData.location,
        description: teamFormData.description,
        isNewSite: teamFormData.isNewSite,
        status: teamFormData.status,
        members: selectedTeamMembers.map(member => member._id || member.id)
      };
      
      if (selectedTeamLeader) {
        teamData.leader = selectedTeamLeader._id || selectedTeamLeader.id;
      }
      
      let result;
      
      if (editingTeam) {
        // Update existing team
        result = await api.updateTeam(editingTeam._id || editingTeam.id, teamData);
      } else {
        // Create new team
        result = await api.createTeam(teamData);
      }
      
      if (result.success) {
        showSnackbar(
          result.message || (editingTeam ? 'Team updated successfully!' : 'Team created successfully!'),
          'success'
        );
        
        // Refresh teams data
        const teamsData = await api.getTeams();
        setTeams(teamsData || []);
        
        closeTeamForm();
      } else {
        showSnackbar(
          result.message || (editingTeam ? 'Failed to update team.' : 'Failed to create team.'),
          'error'
        );
      }
    } catch (error) {
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setTeamFormLoading(false);
    }
  };
  
  // Handle team form input change
  const handleTeamFormChange = (field, value) => {
    setTeamFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for the field
    if (teamFormErrors[field]) {
      setTeamFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Handle team leader selection
  const handleTeamLeaderChange = (e) => {
    const leaderId = e.target.value;
    const leader = availableTeamLeaders.find(l => l.id === leaderId || l._id === leaderId);
    setSelectedTeamLeader(leader);
    if (teamFormErrors.teamLeader) {
      setTeamFormErrors(prev => ({ ...prev, teamLeader: '' }));
    }
  };

  // Toggle team member selection
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

  // Remove a team member
  const removeTeamMember = (memberId) => {
    setSelectedTeamMembers(prev => prev.filter(m => (m._id || m.id) !== memberId));
  };

  // Open member selection dialog
  const openMemberDialog = async () => {
  // Refresh available members before showing the dialog (so filtering is current)
  await fetchAvailableTeamMembers();
  setMemberDialogOpen(true);
};


  // Close member selection dialog
  const closeMemberDialog = () => {
    setMemberDialogOpen(false);
  };
  
  // Open team action menu
const handleTeamMenuOpen = (event, team) => {
  event.stopPropagation(); // Important to prevent card click
  setTeamActionMenuAnchor(event.currentTarget);
  setTeamMenuTarget(team);
};


  
  // Close team action menu
  const handleTeamMenuClose = () => {
    setTeamActionMenuAnchor(null);
    setTeamMenuTarget(null);
  };
  
  // Open team delete confirmation dialog
  const openTeamDeleteDialog = (team) => {
    setTeamToDelete(team);
    setTeamDeleteDialogOpen(true);
    handleTeamMenuClose();
  };
  
  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setLoading(true);
    
    try {
      const teamId = teamToDelete._id || teamToDelete.id;
      const result = await api.deleteTeam(teamId);
      
      if (result.success) {
        showSnackbar(result.message || 'Team deleted successfully!', 'success');
        setTeams(teams.filter(team => (team._id || team.id) !== teamId));
      } else {
        showSnackbar(result.message || 'Failed to delete team.', 'error');
      }
    } catch (error) {
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setTeamDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };
  
  // Select a team to view its racks
  // When user selects a team, clear UI immediately and load new team's racks
const selectTeamForRacks = (team) => {
  // Clear previous team UI quickly so user doesn't see stale rows
  setRacks([]);
  setTotalRacks(0);
  setRackPage(0);
  setRackSearch(''); // optional: clear search when switching teams
  setFilteredTeams([]); // if you use this for teams list

  // Set selected team and switch to racks tab
  setSelectedTeam(team);
  setActiveTab('racks');

  // Immediately fetch racks for the selected team (pass team param to avoid race)
  loadRacks(0, racksPerPage, team);
  checkWorkStatus(); // still call this as before (it reads selectedTeam, but it's fine)
  handleTeamMenuClose();
};

  
  // ----- RACK OPERATIONS -----
  
  // Open rack action menu
  const handleRackMenuOpen = (event, rack) => {
    setRackActionMenuAnchor(event.currentTarget);
    setRackMenuTarget(rack);
  };
  
  // Close rack action menu
  const handleRackMenuClose = () => {
    setRackActionMenuAnchor(null);
    setRackMenuTarget(null);
  };
  
  // Open rack delete confirmation dialog
  const openRackDeleteDialog = (rack) => {
    setRackToDelete(rack);
    setRackDeleteDialogOpen(true);
    handleRackMenuClose();
  };
  
  // Handle edit rack form field changes
// Update handle edit change function to properly handle all fields
// Update handle edit change function to properly handle all fields
// Update your handleEditRackChange function to use existing racks data
const handleEditRackChange = async (e) => {
  const { name, value } = e.target;

  // Always update the current field first
  setEditRackData(prev => ({
    ...prev,
    [name]: value
  }));

  // Clear any existing error for this field
  if (editRackErrors[name]) {
    setEditRackErrors(prev => ({ ...prev, [name]: '' }));
  }

  // If partNo changes → search through existing racks for matching part details
  if (name === "partNo" && value.trim()) {
    try {
      console.log('Searching for part details in existing data:', value);
      
      // Search through current racks array for a matching partNo
      const matchingRack = racks.find(rack => 
        rack.partNo && 
        rack.partNo.toLowerCase().trim() === value.toLowerCase().trim() &&
        rack.partNo !== rackToView.partNo // Don't match the same rack we're editing
      );

      if (matchingRack) {
        console.log('Found matching rack with part details:', matchingRack);
        
        // Update the form with details from the matching rack
        setEditRackData(prev => ({
          ...prev,
          partNo: value,
          mrp: matchingRack.mrp?.toString() || prev.mrp || '',
          ndp: matchingRack.ndp?.toString() || prev.ndp || '',
          materialDescription: matchingRack.materialDescription || prev.materialDescription || ''
        }));
        
        // Show a success message
        showSnackbar(`Found details for part ${value}`, 'info');
      } else {
        console.log('No matching part found in existing data for:', value);
        
        // If no match found, try to search via API
        try {
          console.log('Searching via API...');
          const searchResults = await api.getRacks({
            search: value,
            limit: 10 // Get a few results to find the best match
          });

          if (searchResults && searchResults.racks && searchResults.racks.length > 0) {
            // Find the best matching rack (exact partNo match)
            const exactMatch = searchResults.racks.find(rack => 
              rack.partNo && rack.partNo.toLowerCase().trim() === value.toLowerCase().trim()
            );
            
            const bestMatch = exactMatch || searchResults.racks[0];
            
            if (bestMatch && bestMatch.partNo === value) {
              console.log('Found part details via API search:', bestMatch);
              
              setEditRackData(prev => ({
                ...prev,
                partNo: value,
                mrp: bestMatch.mrp?.toString() || prev.mrp || '',
                ndp: bestMatch.ndp?.toString() || prev.ndp || '',
                materialDescription: bestMatch.materialDescription || prev.materialDescription || ''
              }));
              
              showSnackbar(`Found details for part ${value} via search`, 'success');
            } else {
              console.log('No exact part match found via API search');
            }
          }
        } catch (apiError) {
          console.log('API search failed:', apiError);
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error("Error searching for part details:", error);
      // Don't show error to user, just log it
    }
  }
};



// Validate edit rack form
const validateEditRackForm = () => {
  const errors = {};
  
  if (!editRackData.rackNo.trim()) errors.rackNo = 'Rack No. is required';
  if (!editRackData.partNo.trim()) errors.partNo = 'Part No. is required';
  if (!editRackData.location.trim()) errors.location = 'Location is required';
  
  if (!editRackData.nextQty.trim()) {
    errors.nextQty = 'Quantity is required';
  } else {
    const qty = parseInt(editRackData.nextQty);
    if (isNaN(qty) || qty < 0) errors.nextQty = 'Enter a valid quantity';
  }
  
  if (editRackData.mrp.trim()) {
    const mrp = parseFloat(editRackData.mrp);
    if (isNaN(mrp) || mrp < 0) errors.mrp = 'Enter a valid MRP';
  }
  
  if (editRackData.ndp.trim()) {
    const ndp = parseFloat(editRackData.ndp);
    if (isNaN(ndp) || ndp < 0) errors.ndp = 'Enter a valid NDP';
  }

  setEditRackErrors(errors);
  return Object.keys(errors).length === 0;
};

useEffect(() => {
  if (rackToView && isEditingRackDetails) {
    setEditRackData({
      rackNo: rackToView.rackNo || '',
      partNo: rackToView.partNo || '',
      mrp: rackToView.mrp?.toString() || '',
      nextQty: rackToView.nextQty?.toString() || '',
      location: rackToView.location || '',
      materialDescription: rackToView.materialDescription || '',
      ndp: rackToView.ndp?.toString() || ''
    });
  }
}, [rackToView, isEditingRackDetails]);
// Handle saving edited rack
const handleSaveRackEdit = async () => {
  if (!validateEditRackForm()) return;

  setRackFormLoading(true);

  try {
    const updatedRack = {
      rackNo: editRackData.rackNo,
      partNo: editRackData.partNo,
      mrp: editRackData.mrp ? parseFloat(editRackData.mrp) : null,
      nextQty: parseInt(editRackData.nextQty) || 0,
      location: editRackData.location,
      materialDescription: editRackData.materialDescription,
      ndp: editRackData.ndp ? parseFloat(editRackData.ndp) : null
    };

    const rackId = rackToView._id || rackToView.id;
    const result = await api.updateRack(rackId, updatedRack);

    if (result.success) {
      showSnackbar('Rack updated successfully!', 'success');
      setRackDetailsOpen(false)

      // ✅ Update rack view for display purposes
      setRackToView(prev => ({
        ...prev,
        ...updatedRack,
        updatedAt: new Date()
      }));

      // ❌ Do not touch editRackData here
      // Let the form keep whatever the user typed

      // Refresh racks list
      loadRacks();
    } else {
      showSnackbar(result.message || 'Failed to update rack!', 'error');
    }
  } catch (error) {
    console.error("Error saving rack:", error);
    showSnackbar(`Error: ${error.message}`, 'error');
  } finally {
    setRackFormLoading(false);
  }
};

  // Handle rack deletion
  const handleDeleteRack = async () => {
    if (!rackToDelete) return;
    
    setLoading(true);
    
    try {
      const rackId = rackToDelete._id || rackToDelete.id;
      const result = await api.deleteRack(rackId);
      
      if (result.success) {
        showSnackbar(result.message || 'Rack deleted successfully!', 'success');
        loadRacks();
      } else {
        showSnackbar(result.message || 'Failed to delete rack.', 'error');
      }
    } catch (error) {
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setRackDeleteDialogOpen(false);
      setRackToDelete(null);
    }
  };
  
  // Sync edit form whenever rackToView changes
// Re-seed the edit form any time we enter "edit mode" or load a new rackToView
// Only initialize edit form when opening details, not on every update


// Open rack details view
const openRackDetails = (rack) => {
  // Log the rack data being loaded
  console.log("Opening rack details for:", rack);
  setRackToView(rack);
  // Reset edit mode and errors
  setIsEditingRackDetails(false);
  setEditRackErrors({});
  
  // Open the dialog
  setRackDetailsOpen(true);
  handleRackMenuClose();
};


  
  // Handle pagination for racks
  const handleRackPageChange = (event, newPage) => {
    setRackPage(newPage);
    loadRacks();
  };
  
  // Handle rows per page change for racks
  const handleRacksPerPageChange = (event) => {
    setRacksPerPage(parseInt(event.target.value, 10));
    setRackPage(0);
    loadRacks();
  };
  
  // Handle date selection for racks
  const handleDateChange = (date) => {
    setSelectedDate(date ? new Date(date) : null);
    setRackPage(0);
  };
  
  // Export racks to Excel
  const exportRacksToExcel = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    
    try {
      const params = {
        teamId: selectedTeam._id || selectedTeam.id,
        ...(rackSearch && { search: rackSearch }),
        ...(selectedDate && { date: format(selectedDate, 'yyyy-MM-dd') })
      };
      
      const allRacks = await api.exportAllRacks(params);
      
      if (allRacks.length === 0) {
        showSnackbar('No data available to export with current filters.', 'warning');
        return;
      }
      
      // Sort racks by rack number
      const sortedRacks = [...allRacks].sort((a, b) => (a.rackNo || "").localeCompare(b.rackNo || ""));
      
      // Prepare data for Excel
      const excelData = sortedRacks.map((rack, index) => ({
        'S.No': index + 1,
        'Location': rack.location || '',
        'Rack No.': rack.rackNo || '',
        'Part No.': rack.partNo || '',
        'Qty': rack.nextQty || 0,
        'NDP': rack.ndp || 0,
        'MRP': rack.mrp || 0,
        'Material Description': rack.materialDescription || '',
        'Scanned By': rack.scannedBy?.name || 'Unknown',
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Racks');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename
      const now = format(new Date(), 'yyyyMMdd_HHmmss');
      let filename = 'Racks';
      
      if (selectedTeam.siteName) {
        const siteName = selectedTeam.siteName.replace(/[\\/:*?"<>|]/g, '_');
        filename = siteName;
      }
      
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        filename += `_${dateStr}`;
      }
      
      filename += `_${now}.xlsx`;
      
      // Download file
      saveAs(blob, filename);
      
      let message = `Excel exported successfully (${sortedRacks.length} records)`;
      if (selectedDate || rackSearch) {
        message += ' with current filters';
      }
      
      showSnackbar(message, 'success');
    } catch (error) {
      showSnackbar(`Failed to export Excel: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle finish work
  const handleFinishWork = async () => {
    if (!selectedTeam) return;
    
    if (totalRacks === 0) {
      showSnackbar('No racks to finish work for.', 'warning');
      return;
    }
    
    const confirmationDialog = {
      title: 'Confirm Finish Work',
      message: `Are you sure you want to finish work for site "${selectedTeam.siteName}"? This action will save a snapshot of all current rack data and clear team members and leader from the team.`,
      onConfirm: async () => {
        setLoading(true);
        
        try {
          // Step 1: Fetch all records needed for the submission
          showSnackbar('Fetching all records for submission...', 'info');
          const allRacksForSubmission = await api.exportAllRacks({
            teamId: selectedTeam._id || selectedTeam.id,
            search: rackSearch || undefined,
            date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
          });
          
          if (allRacksForSubmission.length === 0) {
            throw new Error('Could not fetch records to submit.');
          }
          
          // Step 2: Create the rows in the format expected by the backend
          const exportRows = allRacksForSubmission.map((rack, index) => ({
            sNo: index + 1,
            location: rack.location || '',
            rackNo: rack.rackNo || '',
            partNo: rack.partNo || '',
            nextQty: rack.nextQty || 0,
            mrp: rack.mrp || 0,
            ndp: rack.ndp || 0,
            materialDescription: rack.materialDescription || '',
            siteName: rack.siteName || selectedTeam.siteName || ''
          }));
          
          // Step 3: Save exported racks snapshot
          const snapshotResponse = await api.saveExportedRacksSnapshot(
            exportRows,
            selectedTeam._id || selectedTeam.id,
            selectedTeam.siteName
          );
          
          if (snapshotResponse.success !== true) {
            throw new Error(snapshotResponse.message || 'Failed to save rack snapshot.');
          }
          
          showSnackbar(snapshotResponse.message || 'Rack snapshot saved!', 'success');
          
          // Step 4: Complete team work
          const teamCompletionResponse = await api.completeTeamWork(selectedTeam._id || selectedTeam.id);
          if (teamCompletionResponse.success !== true) {
            throw new Error(teamCompletionResponse.message || 'Failed to complete team work.');
          }
          
          showSnackbar(
            teamCompletionResponse.message || 'Team work completed successfully!',
            'success'
          );
          
          // Refresh data
          loadRacks();
          checkWorkStatus();
        } catch (error) {
          showSnackbar(`Error finishing work: ${error.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Show confirmation dialog
    setTeamDeleteDialogOpen(true);
    setTeamToDelete({
      ...selectedTeam,
      _isFinishWorkAction: true, // Special flag to identify this as a finish work action
      confirmationDialog
    });
  };

   // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get initials from name
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Render status chip for rack quantity
  const renderStatusChip = (quantity) => {
    const status = getQuantityStatus(quantity);
    let label = "";
    
    switch (status) {
      case "in_stock":
        label = "In Stock";
        break;
      case "low_stock":
        label = "Low Stock";
        break;
      case "out_of_stock":
        label = "Out of Stock";
        break;
      default:
        label = "Unknown";
    }
    
    return (
      <StatusChip
        label={label}
        color={getQuantityStatusColor(status)}
        icon={
          status === "in_stock" ? (
            <CheckCircleIcon style={{ fontSize: 16 }} />
          ) : status === "low_stock" ? (
            <WarningIcon style={{ fontSize: 16 }} />
          ) : (
            <ErrorIcon style={{ fontSize: 16 }} />
          )
        }
      />
    );
  };

  // Determine if current user can edit/delete
  const canEditDelete = (item) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'team_leader') {
      // Team leaders can edit their own team items
      if (selectedTeam && selectedTeam.teamLeader) {
        return selectedTeam.teamLeader._id === currentUser._id || selectedTeam.teamLeader.id === currentUser.id;
      }
    }
    return false;
  };

  // ----- RENDER UI SECTIONS -----

  // Render empty state
  const renderEmptyState = (type, hasFilters = false) => {
    const isTeams = type === 'teams';
    const Icon = isTeams ? BusinessIcon : DnsIcon;
    const title = isTeams 
      ? (hasFilters ? 'No teams match your filters' : 'No teams found')
      : (hasFilters ? 'No racks match your filters' : 'No racks found');
    const addText = isTeams ? 'Add Your First Team' : 'Add Your First Rack';
    const addAction = isTeams ? openCreateTeamForm : () => {}; // No direct add rack action
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: "center",
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          mt: 2
        }}
      >
        <Icon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        {hasFilters ? (
          <>
            <Typography color="textSecondary" paragraph>
              Try adjusting your search or filter criteria
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ mr: 1 }}
            >
              Clear Filters
            </Button>
          </>
        ) : (
          <>
            <Typography color="textSecondary" paragraph>
              {isTeams ? 'Get started by adding a new team' : 'No rack data available for this team'}
            </Typography>
            {isTeams && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addAction}
                sx={{ 
                  bgcolor: primaryColor,
                  '&:hover': { bgcolor: secondaryColor }
                }}
              >
                {addText}
              </Button>
            )}
          </>
        )}
      </Paper>
    );
  };
   
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

  
  // Render teams view
  const renderTeamsView = () => {
    const hasFilteredTeams = filteredTeams.length > 0;
    const hasFilters = teamSearch || teamStatusFilter !== 'all';
    
    return (
      <>
       {/* Page Header */}
            <Box
              sx={{
                bgcolor:' #004F98',
                color: 'white',
                py: 5,
                px: 3,
                borderRadius: '0 0 24px 24px',
                mb: -3,
               
              }}
            >
              <Container maxWidth="xl">
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      Team Management
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      View, create, edit and manage all system users
                    </Typography>
                  </Grid>
                 
                </Grid>
              </Container>
            </Box>
        {/* Filters Section */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: primaryColor }} />
              <Typography variant="h6" fontWeight={600}>
                Filters & Options
              </Typography>
            </Box>
            <Box>
              <Button 
                size="small" 
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                disabled={!teamSearch && teamStatusFilter === 'all'}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    bgcolor: `${primaryColor}10`,
                    borderColor: primaryColor 
                  }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search teams by name or location"
                variant="outlined"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: teamSearch && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setTeamSearch('')}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={teamStatusFilter}
                  onChange={(e) => setTeamStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={openCreateTeamForm}
                  sx={{
                    bgcolor: primaryColor,
                    '&:hover': { bgcolor: secondaryColor },
                    borderRadius: 2,
                    px: 3,
                    py: 1
                  }}
                >
                  Add New Team
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Teams List */}
        {!hasFilteredTeams ? (
          renderEmptyState('teams', hasFilters)
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Showing {filteredTeams.length} of {teams.length} teams
            </Typography>
            
            <Grid container spacing={2}>
              {filteredTeams.map((team) => {
                const teamHasMembers = Array.isArray(team.members) && team.members.length > 0;
                const statusColor = getStatusColor(team.status);
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={team._id || team.id}>
                    <StyledCard
                      active={selectedTeam && (selectedTeam._id === team._id || selectedTeam.id === team.id)}
                      onClick={() => selectTeamForRacks(team)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: primaryColor, mr: 2 }}>
                              {team.siteName?.charAt(0).toUpperCase() || "?"}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {team.siteName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="textSecondary">
                                  {team.location || "No location"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeamMenuOpen(e, team);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>

                            
                            <StatusChip
                              label={team.status || "Active"}
                              color={statusColor}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                            
                            {team.isNewSite && (
                              <Chip
                                label="New Site"
                                size="small"
                                sx={{
                                  bgcolor: `${warningColor}15`,
                                  color: warningColor,
                                  mt: 1,
                                  fontSize: '0.7rem',
                                  height: 10
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Team Leader
                          </Typography>
                          
                          {team.teamLeader ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: `${primaryColor}40`, color: primaryColor }}>
                                {team.teamLeader.name?.charAt(0).toUpperCase() || "?"}
                              </Avatar>
                              <Typography variant="body2">{team.teamLeader.name}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                              No team leader assigned
                            </Typography>
                          )}
                          
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Team Members ({teamHasMembers ? team.members.length : 0})
                          </Typography>
                          
                          {teamHasMembers ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {team.members.slice(0, 3).map((member) => (
                                <Chip
                                  key={member._id || member.id}
                                  label={member.name}
                                  size="small"
                                  sx={{ 
                                    bgcolor: `${primaryColor}15`,
                                    color: primaryColor
                                  }}
                                />
                              ))}
                              
                              {team.members.length > 3 && (
                                <Chip
                                  label={`+${team.members.length - 3} more`}
                                  size="small"
                                  sx={{ 
                                    bgcolor: `${primaryColor}05`,
                                    color: primaryColor
                                  }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                              No members assigned
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="textSecondary">
                              Created: {team.createdAt ? format(new Date(team.createdAt), 'dd MMM yyyy') : "N/A"}
                            </Typography>
                          </Box>
                       
                          
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<NavigateNextIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectTeamForRacks(team);
                            }}
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              '&:hover': {
                                bgcolor: `${primaryColor}10`,
                                borderColor: primaryColor
                              }
                            }}
                          >
                            View Racks
                          </Button>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </>
    );
  };
  
  // Render racks view
  const renderRacksView = () => {
    if (!selectedTeam) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Team Selected
          </Typography>
          <Typography color="textSecondary" paragraph>
            Please select a team to view its racks
          </Typography>
          <Button
            variant="contained"
            onClick={() => setActiveTab('teams')}
            sx={{ 
              bgcolor: primaryColor,
              '&:hover': { bgcolor: secondaryColor }
            }}
          >
            View Teams
          </Button>
        </Paper>
      );
    }
    
    const hasFilteredRacks = racks.length > 0;
    const hasFilters = rackSearch || rackStatusFilter !== 'all' || selectedDate;
    
    return (
      <>
        {/* Team Info Header */}
      <Paper
  elevation={0}
  sx={{
    p: 2,
    borderRadius: 2,
    mb: 3,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
    color: 'white'
  }}
>
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%'
    }}
  >
    {/* Left: Back to Teams button */}
    <Box>
    <Button
  variant="outlined"
  startIcon={<ArrowBackIcon />}
  onClick={() => {
    // 1) Switch to Teams UI
    setActiveTab('teams');

    // 2) Clear rack-related UI so previous racks aren't shown
    setSelectedTeam(null);
    

    // 3) Re-load teams so the teams view is populated immediately
    //    loadInitialData will set `teams`, then your existing useEffect will run filterTeams()
    loadInitialData();
  }}
  sx={{
    color: 'white',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    '&:hover': {
      borderColor: 'white',
      bgcolor: 'rgba(255, 255, 255, 0.1)'
    }
  }}
>
  Back to Teams
</Button>

    </Box>
    
    {/* Center: Site info */}
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" fontWeight="bold">
        {selectedTeam?.siteName || "Site Name"}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
        <LocationIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {selectedTeam?.location || "No location"}
        </Typography>
        <StatusChip
          label={selectedTeam?.status || "Active"}
          color="white"
          size="small"
          sx={{ ml: 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }}
        />
      </Box>
    </Box>
    
    {/* Right: Finish Work button */}
    <Box>
      {isWorkSubmitted ? (
        <Chip
          icon={<CheckCircleIcon />}
          label="Work Submitted"
          color="success"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: successColor,
            fontWeight: 600
          }}
        />
      ) : (
        currentUser?.role === 'admin' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleFinishWork}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: successColor,
              '&:hover': {
                bgcolor: 'white'
              }
            }}
          >
            Finish Work
          </Button>
        )
      )}
    </Box>
  </Box>
</Paper>


        
        {/* Filters and Controls */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: primaryColor }} />
              <Typography variant="h6" fontWeight={600}>
                Filters & Options
              </Typography>
            </Box>
            <Box>
              <Button 
                size="small" 
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                disabled={!rackSearch && rackStatusFilter === 'all' && selectedDate}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
                  borderColor: primaryColor,
                  color: primaryColor,
                  '&:hover': { 
                    bgcolor: `${primaryColor}10`,
                    borderColor: primaryColor 
                  }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search racks by number, part or description"
                variant="outlined"
                value={rackSearch}
                onChange={(e) => setRackSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: rackSearch && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setRackSearch('')}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
  <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
    Date:
  </Typography>
  <TextField
    placeholder="dd-mm-yyyy"
    type="date"
    size="small"
    value={selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : ''}
    onChange={(e) => {
      const newDate = e.target.value ? new Date(e.target.value) : null;
      setSelectedDate(newDate);
    }}
    InputLabelProps={{ shrink: true }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <CalendarIcon fontSize="small" color="action" />
        </InputAdornment>
      ),
      endAdornment: selectedDate && (
        <InputAdornment position="end">
          <IconButton 
            size="small" 
            onClick={() => setSelectedDate(null)}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      ),
    }}
    sx={{ 
      width: '180px',
      '& input': { paddingLeft: selectedDate ? '8px' : '0' }
    }}
  />
</Box>

          
            
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportRacksToExcel}
                  disabled={loading || totalRacks === 0}
                  sx={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    '&:hover': { 
                      bgcolor: `${primaryColor}10`,
                      borderColor: primaryColor 
                    }
                  }}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* User Stats Chips */}
        {Object.keys(serverUserStats).length > 0 && (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              User Activity
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(serverUserStats).map(([userName, stats]) => (
                <Chip
                  key={userName}
                  icon={<PersonIcon sx={{ color: primaryColor }} />}
                  label={`${userName}: ${stats.totalCount}${
                    stats.firstScanTime ? ` (${format(stats.firstScanTime, 'hh:mm a')})` : ''
                  }`}
                  variant="outlined"
                  sx={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}10`
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}
        
        {/* Rack Stats Summary */}
<Paper 
  elevation={0} 
  sx={{ 
    p: 2, 
    borderRadius: 2, 
    mb: 3,
    backgroundColor: 'white',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)'
  }}
>
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" fontWeight="bold">
      Inventory Summary
    </Typography>
  </Box>
  
  <Grid container spacing={2}>
    <Grid item xs={12} sm={3}>
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: 'rgba(16,185,129, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold" color={successColor}>
          {racks.filter(r => getQuantityStatus(r.nextQty) === "in_stock").length}
        </Typography>
        <Typography variant="body2" color={successColor}>
          In Stock
        </Typography>
      </Box>
    </Grid>
    
    <Grid item xs={12} sm={3}>
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: 'rgba(245,158,11, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold" color={warningColor}>
          {racks.filter(r => getQuantityStatus(r.nextQty) === "low_stock").length}
        </Typography>
        <Typography variant="body2" color={warningColor}>
          Low Stock
        </Typography>
      </Box>
    </Grid>
    
    <Grid item xs={12} sm={3}>
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: 'rgba(239,68,68, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold" color={errorColor}>
          {racks.filter(r => getQuantityStatus(r.nextQty) === "out_of_stock").length}
        </Typography>
        <Typography variant="body2" color={errorColor}>
          Out of Stock
        </Typography>
      </Box>
    </Grid>
    
    <Grid item xs={12} sm={3}>
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: 'rgba(0,79,152, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold" color={primaryColor}>
          {totalRacks}
        </Typography>
        <Typography variant="body2" color={primaryColor}>
          Total Racks
        </Typography>
      </Box>
    </Grid>
    <Grid item xs={6} sm={3}>
  {/* N/A Counter Card */}
  <Box sx={{ 
    p: 2, 
    borderRadius: 1, 
    bgcolor: 'rgba(107,114,128, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }}>
    {/*  show the total N/A count here */}
    <Typography variant="h5" fontWeight="bold" color="#6B7280">
        {loadingMissingInfo ? (
          <CircularProgress size={20} sx={{ color: '#6B7280' }} />
        ) : (
          totalMissingInfo
        )}
    </Typography>


    <Typography variant="body2" color="#6B7280" sx={{ textAlign: 'center' }}>
      Missing Info
    </Typography>

    <Tooltip title="View racks with missing information">
      <Button 
        size="small" 
        sx={{ mt: 1, color: '#6B7280', fontSize: '0.7rem' }}
        onClick={() => {
          setRackSearch('n/a');   // ✅ clicking shows all N/A racks
        }}
      >
        View N/A
      </Button>
    </Tooltip>
  </Box>
</Grid>

  </Grid>
</Paper>

{/* Racks Content */}
{!hasFilteredRacks ? (
  renderEmptyState('racks', hasFilters)
) : (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" color="textSecondary">
        Showing {racks.length} of {totalRacks} racks
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SortIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="body2" color="textSecondary">
          {rackSortOrder.includes('rack') ? 'Rack No.' : 
           rackSortOrder.includes('qty') ? 'Quantity' : 'Price'}
        </Typography>
      </Box>
    </Box>
   

 
            
            {/* Table View */}
            <StyledTableContainer component={Paper} elevation={0}>
              <Table size="medium">
               {/* Table Header */}
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Rack No.</TableCell>
                  <TableCell>Part No.</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">MRP (₹)</TableCell>
                  <TableCell align="right">NDP (₹)</TableCell>
                  <TableCell>Description</TableCell>
                  {rackSearch === 'n/a' && <TableCell>Missing Info</TableCell>}
                  <TableCell>Scanned By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

                <TableBody>
                  {racks.map((rack) => (
                    <TableRow key={rack._id || rack.id} hover>
                      <TableCell>{format(new Date(rack.createdAt), 'dd-MM-yyyy')}</TableCell>
                      <TableCell>{rack.siteName}</TableCell>
                      <TableCell>
                        <Chip
                          label={rack.location}
                          size="small"
                          sx={{
                            bgcolor: `${primaryColor}15`,
                            color: primaryColor,
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">{rack.rackNo}</Typography>
                      </TableCell>
                      <TableCell>{rack.partNo}</TableCell>
                      <TableCell align="right">{rack.nextQty || 0}</TableCell>
                      <TableCell>{renderStatusChip(rack.nextQty)}</TableCell>
                      <TableCell align="right">{rack.mrp ? `₹${rack.mrp.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell align="right">{rack.ndp ? `₹${rack.ndp.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={rack.materialDescription}
                        >
                          {rack.materialDescription || 'N/A'}
                        </Typography>
                        
                      </TableCell>
                      {rackSearch.toLowerCase().includes('na') && (
                        <TableCell>
                          {(!rack.mrp || rack.mrp === 0) && <Chip label="Missing MRP" color="error" size="small" />}
                          {(!rack.ndp || rack.ndp === 0) && <Chip label="Missing NDP" color="warning" size="small" />}
                          {(!rack.materialDescription || rack.materialDescription.trim() === '') && (
                            <Chip label="Missing Description" color="info" size="small" />
                          )}
                        </TableCell>
                      )}
                      <TableCell>{rack.scannedBy?.name || 'Unknown'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openRackDetails(rack)}>
                              <VisibilityIcon fontSize="small" sx={{ color: primaryColor }} />
                            </IconButton>
                          </Tooltip>
                          
                          {canEditDelete(rack) && (
                            <Tooltip title="Delete Rack">
                              <IconButton size="small" onClick={() => openRackDeleteDialog(rack)}>
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalRacks}
                rowsPerPage={racksPerPage}
                page={rackPage}
                onPageChange={handleRackPageChange}
                onRowsPerPageChange={handleRacksPerPageChange}
              />
            </StyledTableContainer>
          </>
        )}
      </>
    );
  };
  
  // Main render
  return (
    <Box sx={{ bgcolor: backgroundColor, minHeight: '100vh' }}>
      <AdminNavbar handleRefresh={handleRefresh} />
      
      {/* Main Content */}
   {/* Main Content */}
<ContentContainer maxWidth="xl">
  <LoadingOverlay open={loading} message={activeTab === 'teams' ? "Loading Teams..." : "Loading Racks..."} />
  
  {error && (
    <Alert severity="error" sx={{ mb: 3 }}>
      {error}
    </Alert>
  )}

  {activeTab === 'teams' ? renderTeamsView() : renderRacksView()}
</ContentContainer>

<Menu
  anchorEl={teamActionMenuAnchor}
  open={Boolean(teamActionMenuAnchor)}
  onClose={handleTeamMenuClose}
  elevation={3}
  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  transformOrigin={{ vertical: "top", horizontal: "right" }}
>
  <MenuItem
    onClick={() => {
      selectTeamForRacks(teamMenuTarget);
      handleTeamMenuClose();
      handleRefresh();
    
    }}
  >
    <VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> View Racks
  </MenuItem>
  <MenuItem
    onClick={() => {
      openEditTeamForm(teamMenuTarget);
      handleTeamMenuClose();
         setActiveTab('teams');
        
    
    }}
  >
    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Team
  </MenuItem>
  <MenuItem
    onClick={() => {
      openTeamDeleteDialog(teamMenuTarget);
    }}
    sx={{ color: "error.main" }}
  >
    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete Team
  </MenuItem>
</Menu>

      
           {/* Team Form Dialog */}
      {/* Enhanced Team Form Dialog */}
<Dialog
  open={teamFormOpen}
  onClose={!teamFormLoading ? closeTeamForm : undefined}
  maxWidth="lg"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 4,
      maxHeight: '75vh',
      maxWidth: '950px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }
  }}
>
  {/* Modern Header */}
  <DialogTitle 
    sx={{ 
      p: 0,
      position: 'relative',
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      color: 'white',
      overflow: 'hidden'
    }}
  >
    {/* Background Pattern */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }}
    />
    
    {/* Header Content */}
    <Box sx={{ position: 'relative', p: 4, pb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: 56,
              height: 56,
              mr: 3
            }}
          >
            <GroupAddIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {editingTeam 
                ? `Update "${editingTeam.siteName}" team information` 
                : 'Set up a new team with site details and member assignments'}
            </Typography>
          </Box>
        </Box>
        
        <IconButton
          onClick={closeTeamForm}
          disabled={teamFormLoading}
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  </DialogTitle>
  
  <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
    <Box sx={{ p: 4 }}>
      {/* Progress Steps */}
    

      <form onSubmit={handleTeamFormSubmit}>
        {/* Site Information Card */}
        <StyledCard sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: `${primaryColor}15`, color: primaryColor, mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Site Information
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Basic details about the work site
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site Name"
                  placeholder="Enter the site name"
                  value={teamFormData.siteName}
                  onChange={(e) => handleTeamFormChange('siteName', e.target.value)}
                  error={!!teamFormErrors.siteName}
                  helperText={teamFormErrors.siteName}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': { borderColor: primaryColor },
                      '&.Mui-focused fieldset': { borderColor: primaryColor }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="Enter the site location"
                  value={teamFormData.location}
                  onChange={(e) => handleTeamFormChange('location', e.target.value)}
                  error={!!teamFormErrors.location}
                  helperText={teamFormErrors.location}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': { borderColor: primaryColor },
                      '&.Mui-focused fieldset': { borderColor: primaryColor }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Get current location">
                          <IconButton
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            edge="end"
                          >
                            {gettingLocation ? (
                              <CircularProgress size={20} />
                            ) : (
                              <MyLocationIcon sx={{ color: primaryColor }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  placeholder="Brief description about this site"
                  value={teamFormData.description}
                  onChange={(e) => handleTeamFormChange('description', e.target.value)}
                  multiline
                  rows={3}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': { borderColor: primaryColor },
                      '&.Mui-focused fieldset': { borderColor: primaryColor }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                        <DescriptionIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={teamFormData.status}
                    onChange={(e) => handleTeamFormChange('status', e.target.value)}
                    label="Status"
                    sx={{
                      borderRadius: 3,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor }
                    }}
                  >
                    <MenuItem value="active">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ color: successColor, mr: 1, fontSize: 20 }} />
                        Active
                      </Box>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ErrorIcon sx={{ color: errorColor, mr: 1, fontSize: 20 }} />
                        Inactive
                      </Box>
                    </MenuItem>
                    <MenuItem value="completed">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckIcon sx={{ color: '#6b7280', mr: 1, fontSize: 20 }} />
                        Completed
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
             
            </Grid>
          </CardContent>
        </StyledCard>
        
        {/* Team Assignment Card */}
        <StyledCard sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: `${secondaryColor}15`, color: secondaryColor, mr: 2 }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Team Assignment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Select team leader and members for this site
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Typography variant="h6" sx={{display:'flex'}} fontWeight={600}>
                    Team Leader:
                  </Typography>
              <Grid item xs={20} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 ,width:'100%'}}>
                 
                {currentUser?.role === 'admin' ? (
                  <FormControl fullWidth error={!!teamFormErrors.teamLeader} variant="outlined">
                    <InputLabel sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 ,width:'100%'}}>Select Team Leader</InputLabel>
                    <Select
                      value={selectedTeamLeader ? selectedTeamLeader.id || selectedTeamLeader._id : ''}
                      label="Select Team Leader"
                      onChange={handleTeamLeaderChange}
                      sx={{
                        borderRadius: 3,
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor }
                      }}
                    >
                      {availableTeamLeaders.map((leader) => (
                        <MenuItem key={leader._id || leader.id} value={leader.id || leader._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: primaryColor,
                                mr: 2,
                                fontSize: 14,
                                fontWeight: 'bold'
                              }}
                            >
                              {getInitials(leader.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={500}>{leader.name}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {leader.role.replace('_', ' ').toUpperCase()}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {teamFormErrors.teamLeader && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {teamFormErrors.teamLeader}
                      </Typography>
                    )}
                  </FormControl>
                ) : (
                  selectedTeamLeader && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: `${primaryColor}08`,
                        border: `2px solid ${primaryColor}20`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: primaryColor,
                            mr: 3,
                            fontSize: 18,
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(selectedTeamLeader?.name)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: primaryColor, fontWeight: 500 }}>
                            Team Leader
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedTeamLeader?.name || 'Loading...'}
                          </Typography>
                        </Box>
                        <CheckCircleIcon sx={{ color: successColor, fontSize: 32 }} />
                      </Box>
                    </Paper>
                  )
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Team Members ({selectedTeamMembers.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<GroupAddIcon />}
                    onClick={openMemberDialog}
                    sx={{
                      bgcolor: secondaryColor,
                      borderRadius: 3,
                      px: 3,
                      '&:hover': { bgcolor: primaryColor }
                    }}
                  >
                    Select Members
                  </Button>
                </Box>

                {selectedTeamMembers.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      bgcolor: backgroundColor,
                      borderRadius: 3,
                      border: `2px dashed ${primaryColor}30`
                    }}
                  >
                    <Avatar sx={{ width: 60, height: 60, bgcolor: `${primaryColor}10`, color: primaryColor, mx: 'auto', mb: 2 }}>
                      <GroupIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                      No team members selected
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Click "Select Members" to add team members
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {selectedTeamMembers.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member._id || member.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: `${primaryColor}05`,
                            border: `1px solid ${primaryColor}20`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 20px rgba(0, 79, 152, 0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: primaryColor,
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                  mr: 2
                                }}
                              >
                                {getInitials(member.name)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {member.name}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => removeTeamMember(member._id || member.id)}
                              sx={{ color: errorColor }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>
        
        {/* Timestamps for editing */}
        {editingTeam && (
          <StyledCard sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: `${warningColor}15`, color: warningColor, mr: 2 }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Audit Information
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Creation and modification details
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: `${successColor}08`,
                    border: `1px solid ${successColor}20`
                  }}>
                    <Typography variant="body2" color={successColor} fontWeight={600} gutterBottom>
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(editingTeam.createdAt)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: `${warningColor}08`,
                    border: `1px solid ${warningColor}20`
                  }}>
                    <Typography variant="body2" color={warningColor} fontWeight={600} gutterBottom>
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(editingTeam.updatedAt)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        )}
      </form>
    </Box>
  </DialogContent>
  
  {/* Enhanced Footer Actions */}
  <DialogActions 
    sx={{ 
      p: 4, 
      pt: 2,
      bgcolor: 'white',
      borderTop: '1px solid #e5e7eb',
      gap: 2
    }}
  >
    <Button
      onClick={closeTeamForm}
      disabled={teamFormLoading}
      variant="outlined"
      size="large"
      sx={{
        borderColor: '#d1d5db',
        color: '#6b7280',
        borderRadius: 3,
        px: 4,
        py: 1.5,
        '&:hover': { 
          borderColor: '#9ca3af',
          bgcolor: '#f9fafb'
        }
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleTeamFormSubmit}
      variant="contained"
      size="large"
      disabled={teamFormLoading}
      startIcon={teamFormLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
      sx={{
        bgcolor: primaryColor,
        borderRadius: 3,
        px: 6,
        py: 1.5,
        fontSize: '1rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 79, 152, 0.3)',
        '&:hover': { 
          bgcolor: secondaryColor,
          boxShadow: '0 6px 16px rgba(0, 79, 152, 0.4)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      {teamFormLoading ? 'Processing...' : (editingTeam ? 'Update Team' : 'Create Team')}
    </Button>
  </DialogActions>
</Dialog>

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
            <GroupIcon sx={{ color: primaryColor, mr: 2 }} />
            <Typography variant="h6">Select Team Members</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select team members from the available list
          </Typography>

          {availableTeamMembers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                      bgcolor: isSelected ? `${primaryColor}10` : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? `${primaryColor}15` : backgroundColor
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTeamMember(member)}
                        sx={{
                          color: primaryColor,
                          '&.Mui-checked': {
                            color: primaryColor
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
                        bgcolor: primaryColor,
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
              bgcolor: primaryColor,
              '&:hover': { bgcolor: secondaryColor }
            }}
          >
            Done ({selectedTeamMembers.length})
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Team Delete Confirmation Dialog */}
      <Dialog
        open={teamDeleteDialogOpen}
        onClose={() => setTeamDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
          {teamToDelete?._isFinishWorkAction 
            ? 'Confirm Finish Work' 
            : 'Confirm Team Deletion'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: teamToDelete?._isFinishWorkAction 
                  ? `${successColor}20`
                  : `${errorColor}20`,
                color: teamToDelete?._isFinishWorkAction 
                  ? successColor
                  : errorColor,
                mr: 2
              }}
            >
              {teamToDelete?._isFinishWorkAction 
                ? <CheckCircleIcon />
                : <DeleteIcon />}
            </Avatar>
            <Typography variant="body1">
              {teamToDelete?._isFinishWorkAction 
                ? teamToDelete.confirmationDialog.message
                : `Are you sure you want to delete the team "${teamToDelete?.siteName}"?`}
            </Typography>
          </Box>
          
          {!teamToDelete?._isFinishWorkAction && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              This action cannot be undone. All data associated with this team will be permanently removed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setTeamDeleteDialogOpen(false)} 
            disabled={loading}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={teamToDelete?._isFinishWorkAction 
              ? teamToDelete.confirmationDialog.onConfirm
              : handleDeleteTeam}
            color={teamToDelete?._isFinishWorkAction ? "success" : "error"}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: teamToDelete?._isFinishWorkAction ? successColor : errorColor,
              '&:hover': { 
                bgcolor: teamToDelete?._isFinishWorkAction ? '#0CA678' : '#D32F2F'
              },
              px: 3
            }}
          >
            {loading 
              ? <CircularProgress size={24} color="inherit" /> 
              : (teamToDelete?._isFinishWorkAction ? 'Finish Work' : 'Delete Team')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rack Delete Confirmation Dialog */}
      <Dialog
        open={rackDeleteDialogOpen}
        onClose={() => setRackDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Confirm Rack Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${errorColor}20`,
                color: errorColor,
                mr: 2
              }}
            >
              <DeleteIcon />
            </Avatar>
            <Typography variant="body1">
              Are you sure you want to delete rack "{rackToDelete?.rackNo}"?
            </Typography>
          </Box>
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            This action cannot be undone. All data associated with this rack will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => setRackDeleteDialogOpen(false)} 
            disabled={loading}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteRack}
            color="error"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: errorColor,
              '&:hover': { bgcolor: '#D32F2F' },
              px: 3
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete Rack'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rack Details Dialog */}
   {/* Rack Details/Edit Dialog */}
  {/* Rack Details/Edit Dialog */}
{/* Rack Details Dialog - Optimized for Performance */}
<Dialog
  open={rackDetailsOpen}
  onClose={() => {
    setRackDetailsOpen(false);
    setIsEditingRackDetails(false);
  }}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 2,
      overflow: 'hidden',
      maxHeight: '90vh'
    }
  }}
  TransitionComponent={Slide} // Use Slide transition for smoother opening
  TransitionProps={{
    direction: "up",
    timeout: { enter: 300, exit: 200 }
  }}
>
  {rackToView && (
    <>
      <DialogTitle 
        sx={{ 
          p: 0,
          position: 'relative',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: primaryColor,
          color: 'white',
          px: 3
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {isEditingRackDetails ? "Edit Rack" : "Rack Details"}: {rackToView.rackNo}
        </Typography>
        
        <Box>
          {!isEditingRackDetails && canEditDelete(rackToView) && (
           <IconButton
              size="small"
              onClick={() => {
                setEditRackData({
                  rackNo: rackToView.rackNo || '',
                  partNo: rackToView.partNo || '',
                  mrp: rackToView.mrp?.toString() || '',
                  nextQty: rackToView.nextQty?.toString() || '',
                  location: rackToView.location || '',
                  materialDescription: rackToView.materialDescription || '',
                  ndp: rackToView.ndp?.toString() || ''
                });
                setIsEditingRackDetails(true);
              }}
              sx={{ color: 'white', mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

          )}
          
          <IconButton
            size="small"
            onClick={() => setRackDetailsOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          p: 0, 
          "&::-webkit-scrollbar": {
            width: 8,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1",
            borderRadius: 4,
          }
        }}
      >
        {/* Lazy load content to improve performance */}
        {rackDetailsOpen && (
          <Box sx={{ p: 3, pb: 1 }}>
            {/* Key Details Section - Always visible first */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                mb: 2,
                border: `1px solid ${alpha(primaryColor, 0.1)}`
              }}
            >
              
<Grid container spacing={2}>
 <Grid item xs={12} sm={6}>
  {isEditingRackDetails ? (
    <TextField
      fullWidth
      required
      size="small"
      label="Rack Number"
      name="rackNo"
      value={editRackData.rackNo}
      onChange={ handleEditRackChange}
      error={!!editRackErrors.rackNo}
      helperText={editRackErrors.rackNo}
      sx={{ mb: 2 }}
    />
  ) : (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="textSecondary">
        Rack Number
      </Typography>
      <Typography variant="body1" fontWeight="bold">
        {rackToView.rackNo || 'N/A'}
      </Typography>
    </Box>
  )}
</Grid>
  
 <Grid item xs={12} sm={6}>
  {isEditingRackDetails ? (
    <TextField
      fullWidth
      required
      size="small"
      label="Part Number"
      name="partNo"
      value={editRackData.partNo}
      onChange={ handleEditRackChange}
      error={!!editRackErrors.partNo}
      helperText={editRackErrors.partNo}
      sx={{ mb: 2 }}
    />
  ) : (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="textSecondary">
        Part Number
      </Typography>
      <Typography variant="body1" fontWeight="bold">
        {rackToView.partNo || 'N/A'}
      </Typography>
    </Box>
  )}
</Grid>
  
 

                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Quantity
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={getQuantityStatusColor(getQuantityStatus(rackToView.nextQty))}
                    >
                      {rackToView.nextQty || 0}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Box>
                      {renderStatusChip(rackToView.nextQty)}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Tabs for organization - improves performance by showing only what's needed */}
            <Box sx={{ mb: 2 }}>
              <Tabs 
                value={detailsActiveTab || 'info'} 
                onChange={(e, newValue) => setDetailsActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 2,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    minWidth: 100,
                  }
                }}
              >
                <Tab label="Basic Info" value="info" />
                <Tab label="Pricing" value="pricing" />
                <Tab label="Description" value="description" />
                <Tab label="Activity" value="activity" />
              </Tabs>
              
              {/* Tab Content */}
              {detailsActiveTab === 'info' && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      {isEditingRackDetails ? (
                        <TextField
                          fullWidth
                          size="small"
                          label="Location"
                          value={editRackData.location}
                          name="location"
                          onChange={handleEditRackChange}
                          error={!!editRackErrors.location}
                          helperText={editRackErrors.location}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            Location
                          </Typography>
                          <Typography variant="body1">
                            {rackToView.location || 'N/A'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Site
                        </Typography>
                        <Typography variant="body1">
                          {rackToView.siteName || selectedTeam?.siteName || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {detailsActiveTab === 'pricing' && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      {isEditingRackDetails ? (
                        <TextField
                          fullWidth
                          size="small"
                          label="MRP"
                          type="number"
                          value={editRackData.mrp}
                          name="mrp"
                          onChange={ handleEditRackChange}
                          error={!!editRackErrors.mrp}
                          helperText={editRackErrors.mrp}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            MRP (₹)
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {rackToView.mrp ? `₹${rackToView.mrp.toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      {isEditingRackDetails ? (
                        <TextField
                          fullWidth
                          size="small"
                          label="NDP"
                          type="number"
                          name="ndp"
                          value={editRackData.ndp}
                          onChange={handleEditRackChange}
                          error={!!editRackErrors.ndp}
                          helperText={editRackErrors.ndp}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            NDP (₹)
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {rackToView.ndp ? `₹${rackToView.ndp.toFixed(2)}` : 'N/A'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    {isEditingRackDetails && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Quantity"
                          type="number"
                          value={editRackData.nextQty}
                          onChange={handleEditRackChange}
                          error={!!editRackErrors.nextQty}
                          helperText={editRackErrors.nextQty}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              
              {detailsActiveTab === 'description' && (
                <Box>
                  {isEditingRackDetails ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Material Description"
                      value={editRackData.materialDescription}
                      onChange={handleEditRackChange}
                      error={!!editRackErrors.materialDescription}
                      helperText={editRackErrors.materialDescription}
                      placeholder="Enter material description"
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        maxHeight: '200px', 
                        overflow: 'auto', 
                        p: 2, 
                        border: `1px solid ${alpha(primaryColor, 0.1)}`,
                        borderRadius: 1,
                        bgcolor: '#fafafa'
                      }}
                    >
                      <Typography variant="body2">
                        {rackToView.materialDescription || 'No description available'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {detailsActiveTab === 'activity' && !isEditingRackDetails && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Scanned By
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: `${primaryColor}15`,
                              color: primaryColor,
                              fontSize: '0.75rem',
                              mr: 1
                            }}
                          >
                            {rackToView.scannedBy?.name?.charAt(0).toUpperCase() || '?'}
                          </Avatar>
                          <Typography variant="body2">
                            {rackToView.scannedBy?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Created Date
                        </Typography>
                        <Typography variant="body2">
                          {rackToView.createdAt 
                            ? format(new Date(rackToView.createdAt), 'dd-MM-yyyy hh:mm a')
                            : 'Unknown date'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {rackToView.updatedAt && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(rackToView.updatedAt), 'dd-MM-yyyy hh:mm a')}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0, borderTop: '1px solid #eeeeee' }}>
        {isEditingRackDetails ? (
          <>
            <Button
              onClick={() => {
                setIsEditingRackDetails(true);
                // Reset edit form to original values
                setEditRackData({
                  rackNo: rackToView.rackNo || '',
                  partNo: rackToView.partNo || '',
                  mrp: rackToView.mrp?.toString() || '',
                  nextQty: rackToView.nextQty?.toString() || '',
                  location: rackToView.location || '',
                  materialDescription: rackToView.materialDescription || '',
                  ndp: rackToView.ndp?.toString() || ''
                });
                setEditRackErrors({});
              }}
              variant="outlined"
              sx={{
                color: 'text.secondary',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRackEdit}
              variant="contained"
              disabled={rackFormLoading}
              startIcon={rackFormLoading ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{
                bgcolor: primaryColor,
                '&:hover': { bgcolor: secondaryColor },
                px: 3
              }}
            >
              {rackFormLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setRackDetailsOpen(false)}
              variant="outlined"
              sx={{
                color: 'text.secondary',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Close
            </Button>
            {canEditDelete(rackToView) && (
             <Button
  onClick={() => {
    setEditRackData({
      rackNo: rackToView.rackNo || '',
      partNo: rackToView.partNo || '',
      mrp: rackToView.mrp?.toString() || '',
      nextQty: rackToView.nextQty?.toString() || '',
      location: rackToView.location || '',
      materialDescription: rackToView.materialDescription || '',
      ndp: rackToView.ndp?.toString() || ''
    });
    setIsEditingRackDetails(true);
  }}
  variant="contained"
  startIcon={<EditIcon />}
  sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: secondaryColor }, px: 3 }}
>
  Edit Rack
</Button>

            )}
          </>
        )}
      </DialogActions>
    </>
  )}
</Dialog>


      
      {/* Mobile-only FAB for adding */}
      <Box sx={{ display: { md: 'none' } }}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: primaryColor,
            '&:hover': { bgcolor: secondaryColor }
          }}
          onClick={activeTab === 'teams' ? openCreateTeamForm : null}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
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

export default TeamManagement;
