import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box 
} from '@mui/material';
import { CheckCircle, WifiOff } from '@mui/icons-material';

/**
 * Component to display a success message for offline transactions
 */
export default function OfflineTransactionSuccess({ open, onClose, transactionId }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="offline-transaction-success"
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        Transaction Saved
      </DialogTitle>
      <DialogContent>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            py: 2
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2 
            }}
          >
            <CheckCircle 
              color="success" 
              sx={{ fontSize: 48, mr: 1 }} 
            />
            <WifiOff 
              color="error" 
              sx={{ fontSize: 32 }} 
            />
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Transaction saved for later sync
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center">
            You are currently offline. Your transaction has been saved locally and will be
            synchronized with the server when you're back online.
          </Typography>
          
          {transactionId && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 2, 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                fontFamily: 'monospace'
              }}
            >
              Local Reference: {transactionId}
            </Typography>
          )}
          
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'info.light', 
              borderRadius: 1,
              width: '100%'
            }}
          >
            <Typography variant="body2" color="info.contrastText">
              <strong>Note:</strong> You can continue using the app normally. All changes will be
              synchronized automatically when your connection is restored.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="contained"
          fullWidth
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
