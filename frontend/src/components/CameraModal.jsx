import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function CameraModal({ open, onClose, onScan }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const codeReaderRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const startCamera = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                codeReaderRef.current = new BrowserMultiFormatReader();
                const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
                
                if (videoInputDevices.length === 0) {
                    throw new Error('No camera found on this device');
                }

                // Use the first available camera
                const selectedDeviceId = videoInputDevices[0].deviceId;
                
                await codeReaderRef.current.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            onScan(result.getText());
                            onClose();
                        }
                        // Ignore errors during scanning as they're usually just frames without barcodes
                    }
                );

                setIsLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to access camera');
                setIsLoading(false);
            }
        };

        startCamera();

        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, [open, onClose, onScan]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { position: 'relative' }
            }}
        >
            <DialogTitle>
                Quét mã vạch
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ position: 'relative' }}>
                        <video
                            ref={videoRef}
                            style={{ width: '100%', maxHeight: '70vh' }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                border: '2px solid #00ff00',
                                opacity: 0.5,
                                pointerEvents: 'none'
                            }}
                        />
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
