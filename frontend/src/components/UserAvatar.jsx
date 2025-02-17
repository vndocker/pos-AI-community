import React, { useState } from 'react';
import { Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserAvatar = ({ onProfileClick }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleProfile = () => {
        handleClose();
        onProfileClick();
    };
    
    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/signin');
    };
    
    return (
        <>
            <IconButton onClick={handleClick} size="small" sx={{ ml: 2 }}>
                <Avatar
                    src={user?.avatar_url}
                    sx={{
                        width: 40,
                        height: 40,
                        fontWeight: '600',
                        // bgcolor: 'primary.main',
                        cursor: 'pointer'
                    }}
                >
                    {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                </Avatar>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleProfile}>Profile Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    );
};

export default UserAvatar;
