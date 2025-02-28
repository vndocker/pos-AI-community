import React from 'react';
import { Fab, Badge, useMediaQuery, useTheme } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

/**
 * Button to toggle cart visibility on mobile devices
 */
export default function CartToggleButton({ count, onClick, isCartVisible }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <Fab
      color={isCartVisible ? 'secondary' : 'primary'}
      aria-label="toggle cart"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 1000,
      }}
      data-testid="cart-toggle-button"
    >
      <Badge badgeContent={count} color="error" max={99}>
        <ShoppingCart />
      </Badge>
    </Fab>
  );
}
