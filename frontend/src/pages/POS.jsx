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
    useMediaQuery,
    useTheme,
    Collapse,
    Divider,
    Alert,
    CircularProgress,
    Slide,
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Print as PrintIcon,
    PhotoCamera as PhotoCameraIcon,
    ShoppingCart as ShoppingCartIcon,
    Sync as SyncIcon,
} from '@mui/icons-material';
import { searchProducts, createInvoice } from '../services/api';
import CameraModal from '../components/CameraModal';
import OfflineIndicator from '../components/OfflineIndicator';
import OfflineTransactionSuccess from '../components/OfflineTransactionSuccess';
import CartToggleButton from '../components/CartToggleButton';
import { 
    isOnline, 
    getLocalProducts, 
    saveLocalProducts, 
    getLocalCart, 
    saveLocalCart,
    saveLocalTransaction,
} from '../services/localStorageService';

export default function POS() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isCartVisible, setIsCartVisible] = useState(!isMobile);
    const [isOffline, setIsOffline] = useState(!isOnline());
    const [offlineTransactionSuccess, setOfflineTransactionSuccess] = useState(false);
    const [offlineTransactionId, setOfflineTransactionId] = useState(null);
    
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
        
        // Load products
        loadProducts();
        
        // Load cart from local storage
        loadLocalCart();

        // Add key listeners
        window.addEventListener('keydown', handleKeyPress);
        
        // Set up online/offline listeners
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    // Save cart to local storage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            saveLocalCart(cart).catch(err => 
                console.error('Error saving cart to local storage:', err)
            );
        }
    }, [cart]);

    // Load products from API or local storage
    const loadProducts = async () => {
        try {
            setLoading(true);
            
            // Try to load from API first
            try {
                const response = await searchProducts('');
                setProducts(response.items);
                
                // Save to local storage for offline use
                saveLocalProducts(response.items).catch(err => 
                    console.error('Error saving products to local storage:', err)
                );
            } catch (error) {
                console.error('Error loading products from API:', error);
                
                // If API fails, try to load from local storage
                const localProducts = await getLocalProducts();
                if (localProducts.length > 0) {
                    setProducts(localProducts);
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Load cart from local storage
    const loadLocalCart = async () => {
        try {
            const localCart = await getLocalCart();
            if (localCart.length > 0) {
                setCart(localCart);
            }
        } catch (error) {
            console.error('Error loading cart from local storage:', error);
        }
    };

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
                
                // Try to search from API first
                try {
                    const response = await searchProducts(query);
                    setProducts(response.items);
                } catch (error) {
                    console.error('Error searching products from API:', error);
                    
                    // If API fails, search in local storage
                    const localProducts = await getLocalProducts();
                    const filteredProducts = localProducts.filter(product => 
                        product.name.toLowerCase().includes(query.toLowerCase()) || 
                        product.code.toLowerCase().includes(query.toLowerCase())
                    );
                    setProducts(filteredProducts);
                }
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // If query is empty, load all products
            loadProducts();
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
        
        // On mobile, show cart after adding item
        if (isMobile && !isCartVisible) {
            setIsCartVisible(true);
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
            
            if (isOffline) {
                // Save transaction locally for later sync
                const transactionId = await saveLocalTransaction(invoiceData);
                setOfflineTransactionId(transactionId);
                setOfflineTransactionSuccess(true);
                
                // Clear cart and payment after successful local save
                setCart([]);
                setPaymentAmount(0);
                
                // Clear local cart
                saveLocalCart([]);
            } else {
                // Process normally when online
                const response = await createInvoice(invoiceData);
                
                // Open invoice in new window for printing
                window.open(`${import.meta.env.VITE_API_URL}/invoices/print/${response.id}`, '_blank');
                
                // Clear cart and payment after successful checkout
                setCart([]);
                setPaymentAmount(0);
                
                // Clear local cart
                saveLocalCart([]);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
        }
    };

    const toggleCartVisibility = () => {
        setIsCartVisible(!isCartVisible);
    };

    return (
        <>
            <Grid container spacing={2}>
                {/* Product Search Section */}
                <Grid item xs={12} md={isCartVisible ? 7 : 12}>
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
                    
                    {isOffline && (
                        <Alert 
                            severity="warning" 
                            sx={{ mb: 2 }}
                            icon={<SyncIcon />}
                        >
                            You are currently offline. Products shown are from local storage.
                        </Alert>
                    )}
                    
                    <Paper sx={{ p: 2, minHeight: isMobile ? '50vh' : '70vh' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : products.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <Typography color="text.secondary">
                                    No products found. Try a different search term.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {products.map((product) => (
                                    <Grid 
                                        item 
                                        xs={12} 
                                        sm={6} 
                                        md={4} 
                                        key={product.id}
                                    >
                                        <Paper
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: '#f5f5f5' },
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}
                                            onClick={() => addToCart(product)}
                                            data-testid="product-item"
                                        >
                                            <Box>
                                                <Typography variant="subtitle1" noWrap>{product.name}</Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {product.code}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ mt: 1 }}>
                                                {product.price.toLocaleString('vi-VN')} đ
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                </Grid>

                {/* Cart Section */}
                <Grid 
                    item 
                    xs={12} 
                    md={5}
                    sx={{ 
                        display: { 
                            xs: isCartVisible ? 'block' : 'none',
                            md: 'block'
                        }
                    }}
                    data-testid="cart-section"
                >
                    <Slide direction="up" in={isCartVisible} mountOnEnter unmountOnExit>
                        <Paper sx={{ 
                            p: 2, 
                            minHeight: isMobile ? '60vh' : '80vh', 
                            display: 'flex', 
                            flexDirection: 'column',
                            position: 'relative'
                        }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <Typography variant="h6">
                                    Giỏ hàng {cart.length > 0 && `(${cart.length})`}
                                </Typography>
                                {isMobile && (
                                    <IconButton 
                                        onClick={toggleCartVisibility}
                                        edge="end"
                                        color="primary"
                                    >
                                        <ShoppingCartIcon />
                                    </IconButton>
                                )}
                            </Box>
                            
                            <Divider sx={{ mb: 2 }} />
                            
                            {cart.length === 0 ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    flexGrow: 1
                                }}>
                                    <Typography color="text.secondary">
                                        Your cart is empty
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ flexGrow: 1 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Sản phẩm</TableCell>
                                                <TableCell align="right">SL</TableCell>
                                                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Đơn giá</TableCell>
                                                <TableCell align="right">Tổng</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>
                                                        <Typography variant="subtitle2" noWrap>{item.product_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {item.product_code}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'flex-end',
                                                            flexWrap: 'nowrap'
                                                        }}>
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
                                                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
                            )}
                            
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
                                    startIcon={isOffline ? <SyncIcon /> : <PrintIcon />}
                                >
                                    {isOffline ? 'Save for later sync' : 'Thanh toán & In hóa đơn'}
                                </Button>
                            </Box>
                        </Paper>
                    </Slide>
                </Grid>
            </Grid>
            
            {/* Cart toggle button for mobile */}
            <CartToggleButton 
                count={cart.length} 
                onClick={toggleCartVisibility}
                isCartVisible={isCartVisible}
            />
            
            {/* Offline indicator */}
            <OfflineIndicator />
            
            {/* Offline transaction success dialog */}
            <OfflineTransactionSuccess
                open={offlineTransactionSuccess}
                onClose={() => setOfflineTransactionSuccess(false)}
                transactionId={offlineTransactionId}
            />
        </>
    );
}
