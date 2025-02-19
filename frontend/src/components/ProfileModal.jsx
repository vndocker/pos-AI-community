import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Avatar,
    Typography,
    Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ProfileModal = ({ open, onClose }) => {
    const [username, setUsername] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, updateUser } = useAuth();

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 500 * 1024) { // 500KB limit
                setError('File size must be less than 500KB');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const uploadFile = async (file, uploadUrl) => {
        try {
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            return response;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    const handleUpload = async () => {
        // Get presigned URL
        const { data: { upload_url, object_key } } = await api.post('/auth/avatar/presigned');
        
        // Upload to R2
        const response = await uploadFile(file, upload_url);
        
        // Confirm upload
        const { data: profile } = await api.post('/auth/avatar/confirm', {
            object_key
        });
        
        // Update user context
        updateUser(profile);
        setFile(null);
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        
        try {
            let success = true;
            
            // Upload file if selected
            if (file) {
                try {
                    await handleUpload();
                } catch (err) {
                    success = false;
                    throw err;
                }
            }
            
            // Update profile if username changed
            if (username && username !== user?.username) {
                const { data: profile } = await api.put('/auth/profile', {
                    username
                });
                updateUser(profile);
            }
            
            if (success) {
                onClose();
            }
        } catch (err) {
            setError('Failed to update profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={user?.avatar_url}
                            sx={{ width: 80, height: 80 }}
                        >
                            {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                        </Avatar>
                        <Box>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="avatar-upload"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="avatar-upload">
                                <Button variant="outlined" component="span">
                                    Change Avatar
                                </Button>
                            </label>
                            {file && (
                                <Typography variant="caption" display="block">
                                    Selected: {file.name}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        placeholder={user?.username || 'Set a username'}
                    />

                    <TextField
                        label="Email"
                        value={user?.email || ''}
                        fullWidth
                        disabled
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || (!username && !file)}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileModal;
