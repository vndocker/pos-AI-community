import React, { useState } from 'react';
import { Box, Container, TextField, Button, Typography, Alert } from '@mui/material';
import { Turnstile } from '@marsidev/react-turnstile';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SignIn = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        
        if (!turnstileToken) {
            setError('Hệ thống đang ghi nhận tiến trình Robot, vui lòng thử lại!');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/auth/signin/email', {
                email,
                turnstile_token: turnstileToken
            });

            if (response.data.message === "OTP sent successfully") {
                setSuccess('OTP sent to your email');
                setShowOtpInput(true);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:8000/auth/verify/otp', {
                email,
                otp
            });

            if (response.data.status === 'verified') {
                setSuccess('Sign in successful!');
                login();
                navigate('/pos');
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to verify OTP');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Sign In
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
                        {success}
                    </Alert>
                )}

                {!showOtpInput ? (
                    <Box component="form" onSubmit={handleEmailSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        
                        <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
                            <Turnstile
                                siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY}
                                onSuccess={(token) => {
                                    setTurnstileToken(token);
                                }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Get OTP
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleOtpSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="otp"
                            label="Enter OTP"
                            name="otp"
                            autoComplete="off"
                            autoFocus
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Verify OTP
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => {
                                setShowOtpInput(false);
                                setOtp('');
                                setSuccess('');
                            }}
                        >
                            Back to Email
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default SignIn;
