import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Product APIs
export const searchProducts = async (query, page = 1, limit = 10) => {
    const response = await api.get(`/products/search?query=${query}&page=${page}&limit=${limit}`);
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/products/', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

export const importProducts = async (products) => {
    const response = await api.post('/products/bulk', products);
    return response.data;
};

// Inventory APIs
export const createInventoryRecord = async (recordData) => {
    const response = await api.post('/inventory/record', recordData);
    return response.data;
};

export const getInventoryHistory = async (productId, page = 1, limit = 10) => {
    const response = await api.get(`/inventory/history/${productId}?page=${page}&limit=${limit}`);
    return response.data;
};

export const getLowStockProducts = async (threshold = 10) => {
    const response = await api.get(`/inventory/low-stock?threshold=${threshold}`);
    return response.data;
};

// Invoice APIs
export const createInvoice = async (invoiceData) => {
    const response = await api.post('/invoices/', invoiceData);
    return response.data;
};

export const getInvoice = async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
};

export const listInvoices = async (page = 1, limit = 10) => {
    const response = await api.get(`/invoices/?page=${page}&limit=${limit}`);
    return response.data;
};

export const printInvoice = async (id) => {
    const response = await api.get(`/invoices/print/${id}`);
    return response.data;
};
