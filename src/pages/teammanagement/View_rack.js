import React, { useState, useEffect,useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Grid,
  AppBar,
  Toolbar,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  CalendarToday,
  Close,
  Download,
  CheckCircle,
  Person,
  Edit,
  Delete,
  Warning
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../services/api';
import authManager from '../../services/authsession.js';

const ViewRackDetails = () => {
  /* ─────────────────────────────  STATE  ───────────────────────────── */
  const isInitialRender = useRef(true);
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isWorkSubmitted, setIsWorkSubmitted] = useState(false);
  const [serverUserStats, setServerUserStats] = useState({});
  const [racks, setRacks] = useState([]);
  const [totalRacks, setTotalRacks] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  /* ───────────────────────  LIFECYCLE / FETCHING  ─────────────────────── */
 useEffect(() => {
    loadUserDataAndFetchRacks();
    if (teamId) checkWorkStatus();
  }, [teamId]);

  // The corrected useEffect for filtering
  useEffect(() => {
    // We check the ref's value here, but we DON'T declare it here.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      fetchRacks(0);
      fetchUserStats();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, selectedDate, rowsPerPage]); // Dependencies remain the same
 // Dependency array: this effect re-runs if any of these values change.
  const loadUserDataAndFetchRacks = async () => {
    try {
      const user = await authManager.getCurrentUser();
      setCurrentUser(user);
      if (!user) throw new Error('User not logged in.');

      await Promise.all([
        fetchUserStats(),
        fetchRacks(0)
      ]);
    } catch (error) {
      handleError(`Failed to load user data: ${error.message}`);
    }
  };
const fetchUserStats = async () => {
  if (!teamId) return;

  try {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const stats = await api.getFirstScanByUser(teamId, formattedDate);

      const formattedStats = {};
      Object.entries(stats).forEach(([user, data]) => {
        formattedStats[user] = {
          totalCount: data.count || 0,
          // If data.firstScan exists, create a new Date object from it.
          // This works whether it's a string or already a date-like object.
          firstScanTime: data.firstScan ? new Date(data.firstScan) : null // <<< FIX HERE
        };
      });
      setServerUserStats(formattedStats);
    } else {
      const counts = await api.getTotalScanCounts(teamId);
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
    console.error("ERROR in fetchUserStats:", error);
    setServerUserStats({}); 
  }
};
  const fetchRacks = async (page) => {
  setIsLoading(true);
  setErrorMessage(null);

  try {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedDate && { date: format(selectedDate, 'yyyy-MM-dd') }),
      ...(teamId && { teamId })
    };

    const response = await api.getRacks(params);
    setRacks(response.racks);
    setTotalRacks(response.totalCount);
    setCurrentPage(page);
    
    // Set site name from the first rack if available
    if (response.racks.length > 0 && response.racks[0].siteName) {
      setSiteName(response.racks[0].siteName);
    }
    } catch (error) {
      console.error('Racks fetch error:', error);
      if (error.message.includes('JSON') || error.message.includes('format')) {
        handleError('Invalid response from server. Please try again.');
      } else {
        handleError(`Failed to load rack details: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setIsLoading(false);
    setRacks([]);
    setTotalRacks(0);
  };

  const handleSearchChange = (event) => {
  setSearchQuery(event.target.value);
};

  const handleDateChange = (date) => {
  // We reset the page to 0 whenever a filter changes
  setCurrentPage(0);
  setSelectedDate(date);
};

  const clearSelectedDate = () => {
  setCurrentPage(0);
  setSelectedDate(null);
};

  const checkWorkStatus = async () => {
    if (!teamId) return;
    // You'll need to implement getTeamWorkStatus in your API service
    const status = await api.getTeamWorkStatus(teamId);
    setIsWorkSubmitted(status);
  };

  const handleFinishWork = async () => {
  if (totalRacks === 0) {
    showSnackbar('No racks to finish work for.', 'warning');
    return;
  }

  setConfirmDialog({
    open: true,
    title: 'Confirm Finish Work',
    message: `Are you sure you want to finish work for site "${siteName}"? This action will save a snapshot of all current rack data and clear team members and leader from the team.`,
    onConfirm: async () => {
      setIsLoading(true);
      try {
        // Step 1: Fetch all records needed for the submission
        showSnackbar('Fetching all records for submission...', 'info');
        const allRacksForSubmission = await api.exportAllRacks({
          teamId: teamId,
          search: searchQuery || undefined,
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
          siteName: rack.siteName || ''
        }));

        // Step 3: Save exported racks snapshot
        const snapshotResponse = await api.saveExportedRacksSnapshot(
          exportRows,
          teamId,
          siteName
        );

        if (snapshotResponse.success !== true) {
          throw new Error(snapshotResponse.message || 'Failed to save rack snapshot.');
        }

        showSnackbar(snapshotResponse.message || 'Rack snapshot saved!', 'success');

        // Step 4: Complete team work
        const teamCompletionResponse = await api.completeTeamWork(teamId);
        if (teamCompletionResponse.success !== true) {
          throw new Error(teamCompletionResponse.message || 'Failed to complete team work.');
        }

        showSnackbar(
          teamCompletionResponse.message || 'Team work completed successfully!',
          'success'
        );

        // Refresh data
        await fetchRacks(0);
        await checkWorkStatus();
        
      } catch (error) {
        handleError(`Error finishing work: ${error.message}`);
      } finally {
        setIsLoading(false);
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
      }
    }
  });
};

  // Function to compare rack numbers for sorting
  const compareRackNo = (a, b) => {
    const na = (a.rackNo || '').trim().toUpperCase();
    const nb = (b.rackNo || '').trim().toUpperCase();
    
    if (na === '' && nb === '') return 0;
    if (na === '') return 1; // push empties last
    if (nb === '') return -1;

    // Regular expression to split alphanumeric strings
    const reg = /(\d+|[A-Z]+)/g;
    const ita = na.match(reg) || [];
    const itb = nb.match(reg) || [];

    const len = Math.min(ita.length, itb.length);
    for (let i = 0; i < len; i++) {
      const sa = ita[i];
      const sb = itb[i];
      const da = parseInt(sa, 10);
      const db = parseInt(sb, 10);
      
      if (!isNaN(da) && !isNaN(db)) {
        if (da !== db) return da - db;
      } else {
        if (sa < sb) return -1;
        if (sa > sb) return 1;
      }
    }
    
    return ita.length - itb.length;
  };

  const exportRacksToExcel = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...(teamId && { teamId }),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedDate && { date: format(selectedDate, 'yyyy-MM-dd') })
      };

      const allRacks = await api.exportAllRacks(params);
      if (allRacks.length === 0) {
        showSnackbar('No data available to export with current filters.', 'warning');
        return;
      }

      // Sort racks by rack number
      const sortedRacks = [...allRacks].sort(compareRackNo);

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
      
      if (sortedRacks.length > 0 && sortedRacks[0].siteName) {
        const siteName = sortedRacks[0].siteName.replace(/[\\/:*?"<>|]/g, '_');
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
      if (selectedDate || searchQuery) {
        message += ' with current filters';
      }
      
      showSnackbar(message, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar(`Failed to export Excel: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    fetchRacks(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
    fetchRacks(0);
  };

  const canEditDelete = (rack) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'team_leader') {
      // Implement team leader permission logic
      return true;
    }
    return false;
  };

  const handleEditRack = (rack) => {
    // Navigate to edit rack screen
  navigate(`/racks/${rack.id || rack._id}/edit`);
  };

  const handleDeleteRack = (rack) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete Rack No: ${rack.rackNo}?`,
      onConfirm: async () => {
        try {
          await api.deleteRack(rack._id);
          showSnackbar(`Rack ${rack.rackNo} deleted successfully`, 'success');
          fetchRacks(currentPage); // Refresh the current page
        } catch (error) {
          showSnackbar(`Failed to delete rack: ${error.message}`, 'error');
        } finally {
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  /* ───────────────────────────────  UI  ─────────────────────────────── */
  const primaryColor = '#004f98';

  if (isLoading && racks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <AppBar position="static" sx={{ 
        background: `linear-gradient(135deg, ${primaryColor}, #0066CC)`,
        borderRadius: '0 0 25px 25px',
        mb: 3
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            View Rack Details
          </Typography>
          <IconButton color="inherit" onClick={() => Promise.all([fetchUserStats(), fetchRacks(currentPage)])}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Top Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">
                  Showing {totalRacks} records
                  {selectedDate && ` for ${format(selectedDate, 'dd-MM-yyyy')}`}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                {isWorkSubmitted ? (
                  <Chip
                    icon={<CheckCircle />}
                    label="Work Submitted"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download />}
                      onClick={exportRacksToExcel}
                      disabled={isLoading}
                      sx={{ mr: 1 }}
                    >
                      Export
                    </Button>
                    {currentUser?.role === 'admin' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={handleFinishWork}
                        disabled={isLoading}
                      >
                        Submit
                      </Button>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Search and Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder={selectedDate ? 
                    `Search for ${format(selectedDate, 'dd-MM-yyyy')}...` : 
                    'Search by rack no, part no, location...'}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <Search sx={{ color: primaryColor, mr: 1 }} />,
                    endAdornment: (
                      <>
                        {searchQuery && (
                          <IconButton onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(0);
                            fetchRacks(0);
                          }}>
                            <Close />
                          </IconButton>
                        )}
                        <TextField
                          type="date"
                          size="small"
                          value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => handleDateChange(e.target.value ? new Date(e.target.value) : null)}
                          InputProps={{
                            startAdornment: <CalendarToday sx={{ color: primaryColor, mr: 1 }} />
                          }}
                          sx={{ width: 150, ml: 1 }}
                        />
                        {selectedDate && (
                          <IconButton onClick={clearSelectedDate}>
                            <Close color="error" />
                          </IconButton>
                        )}
                      </>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* User Stats Chips */}
        {Object.keys(serverUserStats).length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(serverUserStats).map(([userName, stats]) => (
                <Chip
                  key={userName}
                  icon={<Person />}
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
          </Grid>
        )}

        {/* Racks Table */}
        <Grid item xs={12}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Rack No.</TableCell>
                    <TableCell>Part No.</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">MRP</TableCell>
                    <TableCell align="right">NDP</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Scanned By</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {racks.length > 0 ? (
                    racks.map((rack, index) => (
                      <TableRow key={rack.id || index}>
                        <TableCell>{format(new Date(rack.createdAt), 'dd-MM-yyyy')}</TableCell>
                        <TableCell>{rack.siteName}</TableCell>
                        <TableCell>
                          <Chip
                            label={rack.location}
                            size="small"
                            color={rack.location === 'Accessories' ? 'success' : 'warning'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell><strong>{rack.rackNo}</strong></TableCell>
                        <TableCell>{rack.partNo}</TableCell>
                        <TableCell align="right">
                          <Chip label={rack.nextQty} size="small" color="secondary" />
                        </TableCell>
                        <TableCell align="right">
                          {rack.mrp ? `₹${rack.mrp.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {rack.ndp ? `₹${rack.ndp.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell>{rack.materialDescription || 'N/A'}</TableCell>
                        <TableCell>{rack.scannedBy?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          {canEditDelete(rack) ? (
                            <Box>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleEditRack(rack)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteRack(rack)}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          No racks found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={totalRacks}
              rowsPerPage={rowsPerPage}
              page={currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default ViewRackDetails;