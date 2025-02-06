import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    IconButton,
    Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { searchProducts, createProduct, updateProduct } from '../services/api';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        price: '',
        quantity: ''
    });

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await searchProducts('', page + 1, pageSize);
            setProducts(response.items);
            setTotalProducts(response.total);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [page, pageSize]);

    const handleOpenDialog = (product = null) => {
        if (product) {
            setEditProduct(product);
            setFormData({
                code: product.code,
                name: product.name,
                price: product.price,
                quantity: product.quantity
            });
        } else {
            setEditProduct(null);
            setFormData({
                code: '',
                name: '',
                price: '',
                quantity: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditProduct(null);
        setFormData({
            code: '',
            name: '',
            price: '',
            quantity: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity)
            };

            if (editProduct) {
                await updateProduct(editProduct.id, productData);
            } else {
                await createProduct(productData);
            }

            handleCloseDialog();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const columns = [
        { field: 'code', headerName: 'Mã SP', width: 130 },
        { field: 'name', headerName: 'Tên sản phẩm', width: 300 },
        {
            field: 'price',
            headerName: 'Giá',
            width: 130,
            valueFormatter: (params) => 
                `${String(params).toLocaleString('vi-VN')} đ`
        },
        { field: 'quantity', headerName: 'Tồn kho', width: 130 },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 100,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(params.row)}
                >
                    <EditIcon />
                </IconButton>
            )
        }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Quản lý sản phẩm</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Thêm sản phẩm
                </Button>
            </Box>

            <Paper sx={{ height: 'calc(100vh - 200px)' }}>
                <DataGrid
                    rows={products}
                    columns={columns}
                    pagination
                    rowCount={totalProducts}
                    loading={loading}
                    paginationMode="server"
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    disableSelectionOnClick
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Mã sản phẩm"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Tên sản phẩm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Giá"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Số lượng"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            margin="normal"
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button type="submit" variant="contained">
                            {editProduct ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
