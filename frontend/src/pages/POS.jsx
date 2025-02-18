import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    TextField,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Print as PrintIcon,
    PhotoCamera as PhotoCameraIcon 
} from '@mui/icons-material';
import { searchProducts, createInvoice } from '../services/api';
import CameraModal from '../components/CameraModal';

export default function POS() {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const searchInputRef = useRef(null);
    const paymentInputRef = useRef(null);
    const [paymentAmount, setPaymentAmount] = useState(0);

    // Auto-focus search field on mount and handle F1/F2 key presses
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F2') {
                e.preventDefault();
                paymentInputRef.current?.focus();
            }
        };

        // Focus on mount
        searchInputRef.current?.focus();
        searchProducts('').then(r =>  setProducts(r.items));

        // Add key listeners
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handlePaymentChange = (value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setPaymentAmount(numericValue * 1000);
    };

    const calculateChange = useMemo(() => {
        const total = cart.reduce((sum, item) => sum + item.total_price, 0);
        return Math.max(0, paymentAmount - total);
    }, [cart, paymentAmount]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 0) {
            try {
                setLoading(true);
                const response = await searchProducts(query);
                setProducts(response.items);
                
                // // If only one product is found, add it to cart automatically
                // if (response.items.length === 1) {
                //     addToCart(response.items[0]);
                //     setSearchQuery(''); // Clear search after adding
                //     searchInputRef.current?.focus(); // Refocus for next scan
                // }
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoading(false);
            }
        } else {
            setProducts([]);
        }
    };

    const handleBarcodeScanned = (barcode) => {
        setSearchQuery(barcode);
        handleSearch(barcode);
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product_id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                product_name: product.name,
                product_code: product.code,
                quantity: 1,
                unit_price: product.price,
                total_price: product.price
            }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity > 0) {
            setCart(cart.map(item =>
                item.product_id === productId
                    ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
                    : item
            ));
        }
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.total_price, 0);
    };

    const handleCheckout = async () => {
        try {
            const invoiceData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };
            const response = await createInvoice(invoiceData);
            // Open invoice in new window for printing
            const printWindow = window.open(`${import.meta.env.VITE_API_URL}/invoices/print/${response.id}`, '_blank');
            // Clear cart and payment after successful checkout
            setCart([]);
            setPaymentAmount(0);
        } catch (error) {
            console.error('Error creating invoice:', error);
        }
    };

    return (
        <Grid container spacing={2}>
            {/* Product Search Section */}
            <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        inputRef={searchInputRef}
                        label="F1 - Tìm kiếm sản phẩm (mã hoặc tên)"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setIsCameraOpen(true)}
                                        edge="end"
                                    >
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <CameraModal
                        open={isCameraOpen}
                        onClose={() => setIsCameraOpen(false)}
                        onScan={handleBarcodeScanned}
                    />
                </Paper>
                <Paper sx={{ p: 2, minHeight: '70vh' }}>
                    <Grid container spacing={2}>
                        {products.map((product) => (
                            <Grid item xs={6} sm={4} key={product.id}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                    }}
                                    onClick={() => addToCart(product)}
                                >
                                    <Typography variant="subtitle1">{product.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {product.code}
                                    </Typography>
                                    <Typography variant="h6">
                                        {product.price.toLocaleString('vi-VN')} đ
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Grid>

            {/* Cart Section */}
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>
                        Giỏ hàng
                    </Typography>
                    <TableContainer sx={{ flexGrow: 1 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sản phẩm</TableCell>
                                    <TableCell align="right">SL</TableCell>
                                    <TableCell align="right">Đơn giá</TableCell>
                                    <TableCell align="right">Tổng</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cart.map((item) => (
                                    <TableRow key={item.product_id}>
                                        <TableCell>
                                            <Typography variant="subtitle2">{item.product_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.product_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                >
                                                    -
                                                </IconButton>
                                                <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                >
                                                    +
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.unit_price.toLocaleString('vi-VN')} đ
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.total_price.toLocaleString('vi-VN')} đ
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFromCart(item.product_id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                        <Typography variant="h5" align="right">
                            Tổng cộng: {calculateTotal().toLocaleString('vi-VN')} đ
                        </Typography>
                        <TextField
                            fullWidth
                            inputRef={paymentInputRef}
                            required
                            label="F2 - Số tiền khách trả"
                            onChange={(e) => handlePaymentChange(e.target.value)}
                            sx={{ my: 2 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                            }}
                        />
                        <Typography 
                            variant="h5" 
                            align="right"
                            sx={{ 
                                color: 'success.main',
                                mb: 2
                            }}
                        >
                            Tiền trả lại: {calculateChange.toLocaleString('vi-VN')} đ
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || calculateChange < 0}
                            startIcon={<PrintIcon />}
                        >
                            Thanh toán & In hóa đơn
                        </Button>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
}
