// components/LoadingOverlay.js
import { Backdrop, CircularProgress, Typography } from '@mui/material';

export default function LoadingOverlay({ open, message }) {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999 }}
      open={open}
    >
      <CircularProgress color="inherit" />
      {message && (
        <Typography variant="h6" sx={{ ml: 2 }}>
          {message}
        </Typography>
      )}
    </Backdrop>
  );
}
