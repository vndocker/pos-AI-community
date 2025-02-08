import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function ImportProductsModal({ open, onClose, onImport }) {
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.type !== 'text/csv') {
            setError('Chỉ chấp nhận file CSV');
            return;
        }
        setFile(selectedFile);
        setError('');
    };

    const downloadTemplate = () => {
        const template = 'code,name,price,quantity\nSP001,Sản phẩm mẫu,10000,100';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        if (!file) {
            setError('Vui lòng chọn file CSV');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n');
                const headers = lines[0].toLowerCase().trim().split(',');
                
                if (!headers.includes('code') || !headers.includes('name') || 
                    !headers.includes('price') || !headers.includes('quantity')) {
                    setError('File CSV không đúng định dạng. Vui lòng tải template mẫu.');
                    return;
                }

                const products = lines.slice(1)
                    .filter(line => line.trim())
                    .map(line => {
                        const values = line.split(',');
                        return {
                            code: values[0].trim(),
                            name: values[1].trim(),
                            price: parseFloat(values[2].trim()),
                            quantity: parseInt(values[3].trim())
                        };
                    });

                if (products.some(p => isNaN(p.price) || isNaN(p.quantity))) {
                    setError('Giá hoặc số lượng không hợp lệ');
                    return;
                }

                onImport(products);
                onClose();
            } catch (err) {
                setError('Lỗi xử lý file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Import Sản phẩm từ CSV</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Button variant="outlined" onClick={downloadTemplate}>
                        Tải template mẫu
                    </Button>
                </Box>
                
                <Box 
                    sx={{ 
                        border: '2px dashed #ccc',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        mb: 2
                    }}
                >
                    <input
                        accept=".csv"
                        style={{ display: 'none' }}
                        id="csv-file"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="csv-file">
                        <Button
                            component="span"
                            variant="contained"
                            startIcon={<CloudUpload />}
                        >
                            Chọn file CSV
                        </Button>
                    </label>
                    {file && (
                        <Typography sx={{ mt: 1 }}>
                            File đã chọn: {file.name}
                        </Typography>
                    )}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={handleImport}>
                    Import
                </Button>
            </DialogActions>
        </Dialog>
    );
}
