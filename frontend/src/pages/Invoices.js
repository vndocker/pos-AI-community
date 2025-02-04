import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon, Print as PrintIcon } from '@mui/icons-material';
import { listInvoices, getInvoice } from '../services/api';

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const response = await listInvoices(page + 1, pageSize);
            setInvoices(response.items);
            setTotalInvoices(response.total);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, [page, pageSize]);

    const handleViewInvoice = async (invoiceId) => {
        try {
            const invoice = await getInvoice(invoiceId);
            setSelectedInvoice(invoice);
            setOpenDialog(true);
        } catch (error) {
            console.error('Error loading invoice details:', error);
        }
    };

    const handlePrintInvoice = (invoiceId) => {
        window.open(`/invoices/print/${invoiceId}`, '_blank');
    };

    const columns = [
        { field: 'invoice_number', headerName: 'Số hóa đơn', width: 180 },
        {
            field: 'created_at',
            headerName: 'Ngày tạo',
            width: 200,
            valueFormatter: (params) =>
                new Date(params.value).toLocaleString('vi-VN')
        },
        {
            field: 'total_amount',
            headerName: 'Tổng tiền',
            width: 150,
            valueFormatter: (params) =>
                `${params.value.toLocaleString('vi-VN')} đ`
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 120,
            renderCell: (params) => (
                <Box>
                    <IconButton
                        color="primary"
                        onClick={() => handleViewInvoice(params.row.id)}
                    >
                        <VisibilityIcon />
                    </IconButton>
                    <IconButton
                        color="primary"
                        onClick={() => handlePrintInvoice(params.row.id)}
                    >
                        <PrintIcon />
                    </IconButton>
                </Box>
            )
        }
    ];

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Lịch sử hóa đơn
            </Typography>

            <Paper sx={{ height: 'calc(100vh - 200px)' }}>
                <DataGrid
                    rows={invoices}
                    columns={columns}
                    pagination
                    rowCount={totalInvoices}
                    loading={loading}
                    paginationMode="server"
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    disableSelectionOnClick
                />
            </Paper>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Chi tiết hóa đơn #{selectedInvoice?.invoice_number}
                </DialogTitle>
                <DialogContent>
                    {selectedInvoice && (
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                Ngày tạo: {new Date(selectedInvoice.created_at).toLocaleString('vi-VN')}
                            </Typography>
                            <TableContainer component={Paper} sx={{ mt: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Sản phẩm</TableCell>
                                            <TableCell align="right">SL</TableCell>
                                            <TableCell align="right">Đơn giá</TableCell>
                                            <TableCell align="right">Thành tiền</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedInvoice.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Typography variant="subtitle2">
                                                        {item.product.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.product.code}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {item.unit_price.toLocaleString('vi-VN')} đ
                                                </TableCell>
                                                <TableCell align="right">
                                                    {item.total_price.toLocaleString('vi-VN')} đ
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={3} align="right">
                                                <Typography variant="subtitle1">
                                                    Tổng cộng:
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="subtitle1">
                                                    {selectedInvoice.total_amount.toLocaleString('vi-VN')} đ
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
