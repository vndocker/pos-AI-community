import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Menu as MenuIcon, ShoppingCart, Inventory, Receipt } from '@mui/icons-material';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import ProfileModal from './ProfileModal';


const menuItems = [
    { text: 'Bán hàng', icon: <ShoppingCart />, path: '/' },
    { text: 'Sản phẩm', icon: <Inventory />, path: '/products' },
    { text: 'Hóa đơn', icon: <Receipt />, path: '/invoices' },
];

export default function Layout() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const drawer = (
        <Box sx={{ width: 250 }} role="presentation">
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        onClick={toggleDrawer}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', flexGrow: 1 }}>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={toggleDrawer}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Simple POS
                    </Typography>
                    <Box>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                             <UserAvatar onProfileClick={() => setProfileOpen(true)} />
                            <Typography variant="body1" sx={{ mr: 2 }}>
                                {user.username || user.email}
                            </Typography>
                        </Box>
                )}
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer}
            >
                {drawer}
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8,
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh'
                }}
            >
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
                
            </Box>
  
            <ProfileModal
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
            />
        </Box>
    );
}
