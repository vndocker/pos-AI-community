import React, { useState, useEffect } from 'react';
import { Box, Alert, Snackbar, Badge, IconButton, Tooltip } from '@mui/material';
import { WifiOff, Sync } from '@mui/icons-material';
import { isOnline, getPendingTransactions } from '../services/localStorageService';

/**
 * Component to display offline status and pending transactions
 */
export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Check online status and pending transactions
  useEffect(() => {
    // Initial check
    setOffline(!navigator.onLine);
    loadPendingTransactions();

    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setOffline(false);
      setShowSnackbar(true);
    };

    const handleOffline = () => {
      setOffline(true);
      setShowSnackbar(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up interval to check pending transactions
    const interval = setInterval(loadPendingTransactions, 30000);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Load pending transactions from IndexedDB
  const loadPendingTransactions = async () => {
    try {
      const transactions = await getPendingTransactions();
      setPendingCount(transactions.length);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  // Trigger manual sync
  const handleSync = () => {
    if (navigator.onLine && 'serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.sync.register('sync-transactions')
            .then(() => {
              console.log('Sync registered');
            })
            .catch(err => {
              console.error('Sync registration failed:', err);
            });
        });
    } else {
      console.log('Background sync not supported');
      // Fallback for browsers that don't support background sync
      // Implement manual sync here
    }
  };

  // If online and no pending transactions, don't show anything
  if (!offline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Persistent indicator for offline mode or pending transactions */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        data-testid="offline-indicator"
      >
        <Tooltip
          title={
            offline
              ? 'You are currently offline'
              : `${pendingCount} pending transactions to sync`
          }
        >
          <IconButton
            color={offline ? 'error' : 'warning'}
            sx={{
              backgroundColor: theme => 
                offline 
                  ? theme.palette.error.light 
                  : theme.palette.warning.light,
              '&:hover': {
                backgroundColor: theme => 
                  offline 
                    ? theme.palette.error.main 
                    : theme.palette.warning.main,
              },
            }}
            onClick={handleSync}
            disabled={offline}
          >
            {offline ? (
              <WifiOff />
            ) : (
              <Badge badgeContent={pendingCount} color="error">
                <Sync />
              </Badge>
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Snackbar for status changes */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={offline ? 'error' : 'success'}
          variant="filled"
          onClose={() => setShowSnackbar(false)}
        >
          {offline
            ? 'You are offline. Changes will be saved locally.'
            : 'You are back online. Syncing data...'}
        </Alert>
      </Snackbar>
    </>
  );
}
