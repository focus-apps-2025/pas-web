import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
  AppBar,
  Toolbar,
  Snackbar,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Close,
  Dns,
  PrecisionManufacturing,
  LocationOn,
  Numbers,
  CurrencyRupee,
  LocalOffer,
  Description,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const EditRackScreen = () => {
  const { rackId } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [rack, setRack] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    rackNo: '',
    partNo: '',
    mrp: '',
    nextQty: '',
    location: '',
    materialDescription: '',
    ndp: ''
  });

  const [errors, setErrors] = useState({});

  const primaryColor = '#004f98';

  useEffect(() => {
    fetchRackDetails();
  }, [rackId]);

  const fetchRackDetails = async () => {
    try {
      setLoading(true);
      const rackData = await api.getRackById(rackId);
      setRack(rackData);
      setFormData({
        rackNo: rackData.rackNo || '',
        partNo: rackData.partNo || '',
        mrp: rackData.mrp?.toString() || '',
        nextQty: rackData.nextQty?.toString() || '',
        location: rackData.location || '',
        materialDescription: rackData.materialDescription || '',
        ndp: rackData.ndp?.toString() || ''
      });
    } catch (error) {
      showSnackbar(`Error loading rack details: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rackNo.trim()) newErrors.rackNo = 'Rack No. is required';
    if (!formData.partNo.trim()) newErrors.partNo = 'Part No. is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (!formData.nextQty.trim()) {
      newErrors.nextQty = 'Quantity is required';
    } else {
      const qty = parseInt(formData.nextQty);
      if (isNaN(qty) || qty <= 0) newErrors.nextQty = 'Enter a valid quantity';
    }

    if (formData.mrp.trim()) {
      const mrp = parseFloat(formData.mrp);
      if (isNaN(mrp) || mrp < 0) newErrors.mrp = 'Enter a valid MRP';
    }

    if (formData.ndp.trim()) {
      const ndp = parseFloat(formData.ndp);
      if (isNaN(ndp) || ndp < 0) newErrors.ndp = 'Enter a valid NDP';
    }

    if (!formData.materialDescription.trim()) {
      newErrors.materialDescription = 'Material Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updatedRack = {
        rackNo: formData.rackNo,
        partNo: formData.partNo,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        nextQty: parseInt(formData.nextQty) || 0,
        location: formData.location,
        materialDescription: formData.materialDescription,
        ndp: formData.ndp ? parseFloat(formData.ndp) : null
      };

      const result = await api.updateRack(rackId, updatedRack);
      
      if (result.success) {
        showSnackbar('Rack updated successfully!', 'success');
        setTimeout(() => {
          navigate(-1, { state: { refresh: true } });
        }, 1000);
      } else {
        showSnackbar(result.message || 'Update failed!', 'error');
      }
    } catch (error) {
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
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
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '8px',
            padding: '8px',
            mr: 1
          }}>
            <Edit sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Edit Rack {rack?.rackNo}
          </Typography>
          <Box sx={{ width: 40 }} /> {/* Spacer for symmetry */}
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ 
          padding: 3, 
          backgroundColor: 'white',
          borderRadius: 3,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <Box component="form" sx={{ width: '100%' }}>
            {/* Rack No */}
            <TextField
              fullWidth
              label="Rack No."
              value={formData.rackNo}
              onChange={(e) => handleInputChange('rackNo', e.target.value)}
              error={!!errors.rackNo}
              helperText={errors.rackNo}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Dns sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Part No */}
            <TextField
              fullWidth
              label="Part No."
              value={formData.partNo}
              onChange={(e) => handleInputChange('partNo', e.target.value)}
              error={!!errors.partNo}
              helperText={errors.partNo}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PrecisionManufacturing sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Location */}
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              error={!!errors.location}
              helperText={errors.location}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Next Quantity */}
            <TextField
              fullWidth
              label="Next Quantity"
              type="number"
              value={formData.nextQty}
              onChange={(e) => handleInputChange('nextQty', e.target.value)}
              error={!!errors.nextQty}
              helperText={errors.nextQty}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Numbers sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
                inputProps: { min: 0 }
              }}
              sx={{ mb: 3 }}
            />

            {/* MRP */}
            <TextField
              fullWidth
              label="MRP (₹)"
              type="number"
              value={formData.mrp}
              onChange={(e) => handleInputChange('mrp', e.target.value)}
              error={!!errors.mrp}
              helperText={errors.mrp}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
                inputProps: { 
                  min: 0,
                  step: 0.01
                }
              }}
              sx={{ mb: 3 }}
            />

            {/* NDP */}
            <TextField
              fullWidth
              label="NDP (₹)"
              type="number"
              value={formData.ndp}
              onChange={(e) => handleInputChange('ndp', e.target.value)}
              error={!!errors.ndp}
              helperText={errors.ndp}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOffer sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
                inputProps: { 
                  min: 0,
                  step: 0.01
                }
              }}
              sx={{ mb: 3 }}
            />

            {/* Material Description */}
            <TextField
              fullWidth
              label="Material Description"
              multiline
              rows={3}
              value={formData.materialDescription}
              onChange={(e) => handleInputChange('materialDescription', e.target.value)}
              error={!!errors.materialDescription}
              helperText={errors.materialDescription}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 4 }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={handleCancel}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'grey.300',
                  color: 'grey.600'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: primaryColor,
                  '&:hover': { backgroundColor: '#003d7a' }
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {snackbar.severity === 'success' ? (
              <CheckCircle sx={{ mr: 1 }} />
            ) : (
              <Error sx={{ mr: 1 }} />
            )}
            {snackbar.message}
          </Box>
        }
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336'
          }
        }}
      />
    </Box>
  );
};

export default EditRackScreen;