// src/component/adminloginmodel.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Email,
  Lock,
  Close,
  Security
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../services/api';

// Professional styled components with your primary color
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    padding: 0,
    background: '#ffffff',
    boxShadow: '0 24px 48px rgba(0, 79, 152, 0.15), 0 12px 24px rgba(0, 79, 152, 0.1)',
    border: '1px solid rgba(0, 79, 152, 0.08)',
    overflow: 'hidden',
    minHeight: '500px',
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #004F98 0%, #003875 50%, #002952 100%)',
  color: 'white',
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #0066CC 0%, #004F98 100%)',
  }
}));

const LoginButton = styled(Button)(({ theme }) => ({
  background: '#004F98' ,
  borderRadius: 12,
  padding: theme.spacing(1.5, 4),
  fontWeight: '600',
  textTransform: 'none',
  fontSize: '16px',
  letterSpacing: '0.5px',
  color: 'white',
  minHeight: '48px',
  boxShadow: '0 4px 12px rgba(0, 79, 152, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #003875 0%, #002952 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 79, 152, 0.4)',
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderColor: '#004F98',
  color: '#004F98',
  borderRadius: 12,
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: '600',
  minHeight: '48px',
  alignItems: 'center',
  '&:hover': {
    borderColor: '#003875',
    backgroundColor: 'rgba(0, 79, 152, 0.04)',
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.3s ease'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f5f7fa',
      '& fieldset': {
        borderColor: '#004F98',
        borderWidth: '2px',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      '& fieldset': {
        borderColor: '#004F98',
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: '#666',
    fontWeight: '500',
    '&.Mui-focused': {
      color: '#004F98',
      fontWeight: '600',
    },
  },
}));

const HeaderIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
}));

const AdminLoginModal = ({ open, onClose, onLoginSuccess, adminOnly = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.login(email, password);
      
      if (result.success) {
        if (adminOnly && result.user.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          await api.logout();
          return;
        }
        onLoginSuccess();
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <StyledDialog open={open} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <HeaderIcon>
          <Security sx={{ fontSize: 28, color: 'white' }} />
        </HeaderIcon>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" sx={{ 
            fontWeight: '700', 
            fontSize: '28px',
            letterSpacing: '-0.5px'
          }}>
            {adminOnly ? 'Admin Portal' : 'Admin Dashboard'}
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.9, 
            fontSize: '14px',
            fontWeight: '400',
            marginTop: '4px'
          }}>
            Secure access to administrative controls
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'rotate(90deg)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <Close />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ padding: 4, backgroundColor: '#fafbfc' }}>
        {adminOnly && (
          <Paper
            elevation={0}
            sx={{ 
              mb: 3, 
              mt: 2,
              p: 2.5,
              borderRadius: 3,
              backgroundColor: 'rgba(0, 79, 152, 0.05)',
              border: '1px solid rgba(0, 79, 152, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography sx={{ 
              color: '#004F98', 
              fontWeight: '600',
              fontSize: '20px',
              justifyContent: 'center',
              width:'100%',
              textAlign:'center',
            }}>
              <Lock sx={{ color: '#004F98', 
                fontSize: 22, 
                marginTop: '4px', 
                textAlign: 'center' 
              }} /> LOGIN PAGE 
            </Typography>
          </Paper>
        )}

        

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <StyledTextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#004F98', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#004F98', fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ 
                      color: '#004F98',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 79, 152, 0.08)'
                      }
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            
          />
          
        </Box>

       
      </DialogContent>
      {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              '& .MuiAlert-icon': { 
                fontSize: 24,
                color: '#dc2626'
              },
              '& .MuiAlert-message': {
                fontWeight: '500'
              }
            }}
          >
            {error}
          </Alert>
        )}

      <Divider sx={{ borderColor: 'rgba(0, 79, 152, 0.1)' }} />

      <DialogActions sx={{ 
        padding: 1, 
        gap: 2, 
        backgroundColor: '#ffffff',
        justifyContent: 'center' // Changed from 'space-between' to 'center'
      }}>
        <CancelButton 
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </CancelButton>
        
        <LoginButton
          onClick={handleLogin}
          variant="contained"
          disabled={loading || !email || !password}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AdminPanelSettings />
            )
          }
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </LoginButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default AdminLoginModal;
