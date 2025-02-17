import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import ProfileModal from './ProfileModal';

const ProtectedLayout = () => {
    const { isAuthenticated, user } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    console.log('user', user)
    if (!isAuthenticated) {
        return <Navigate to="/signin" />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        POS System
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ mr: 2 }}>
                                {user.username || user.email}
                            </Typography>
                            <UserAvatar onProfileClick={() => setProfileOpen(true)} />
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            <ProfileModal
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
            />
        </Box>
    );
};

export default ProtectedLayout;
