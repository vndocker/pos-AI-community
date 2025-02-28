import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import POS from './POS';
import { searchProducts, createInvoice } from '../services/api';
import { getLocalProducts, saveLocalCart, getLocalCart } from '../services/localStorageService';

// Mock the API functions
jest.mock('../services/api', () => ({
    searchProducts: jest.fn(),
    createInvoice: jest.fn()
}));

// Mock the local storage service
jest.mock('../services/localStorageService', () => ({
    getLocalProducts: jest.fn(),
    saveLocalCart: jest.fn(),
    getLocalCart: jest.fn(),
    saveLocalTransaction: jest.fn(),
    getPendingTransactions: jest.fn()
}));

describe('POS Offline Functionality', () => {
    const mockProduct = {
        id: 1,
        code: 'SP001',
        name: 'Test Product',
        price: 100000
    };

    const mockLocalProducts = [
        mockProduct,
        {
            id: 2,
            code: 'SP002',
            name: 'Another Product',
            price: 50000
        }
    ];

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Default mock implementations
        searchProducts.mockRejectedValue(new Error('Network error'));
        createInvoice.mockRejectedValue(new Error('Network error'));
        getLocalProducts.mockResolvedValue(mockLocalProducts);
        getLocalCart.mockResolvedValue([]);
    });

    test('should load products from local storage when offline', async () => {
        render(<POS />);
        
        // Wait for local products to be loaded
        await waitFor(() => {
            expect(getLocalProducts).toHaveBeenCalled();
        });
        
        // Check if products from local storage are displayed
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
    });

    test('should show offline indicator when network is unavailable', async () => {
        render(<POS />);
        
        // Wait for network status check
        await waitFor(() => {
            expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
        });
        
        // Check offline indicator text
        expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
    });

    test('should save cart to local storage when items are added', async () => {
        render(<POS />);
        
        // Wait for local products to be loaded
        await waitFor(() => {
            expect(getLocalProducts).toHaveBeenCalled();
        });
        
        // Add product to cart
        const productElement = screen.getByText('Test Product').closest('[data-testid="product-item"]');
        fireEvent.click(productElement);
        
        // Check if cart was saved to local storage
        expect(saveLocalCart).toHaveBeenCalledWith([
            expect.objectContaining({
                product_id: 1,
                product_name: 'Test Product',
                quantity: 1
            })
        ]);
    });

    test('should load cart from local storage on initial render', async () => {
        // Mock a saved cart
        const savedCart = [
            {
                product_id: 2,
                product_name: 'Another Product',
                product_code: 'SP002',
                quantity: 2,
                unit_price: 50000,
                total_price: 100000
            }
        ];
        
        getLocalCart.mockResolvedValue(savedCart);
        
        render(<POS />);
        
        // Wait for local cart to be loaded
        await waitFor(() => {
            expect(getLocalCart).toHaveBeenCalled();
        });
        
        // Check if cart items from local storage are displayed
        expect(screen.getByText('Another Product')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
        expect(screen.getByText('100,000 đ')).toBeInTheDocument(); // Total price
    });

    test('should queue transaction for later sync when offline', async () => {
        render(<POS />);
        
        // Wait for local products to be loaded
        await waitFor(() => {
            expect(getLocalProducts).toHaveBeenCalled();
        });
        
        // Add product to cart
        const productElement = screen.getByText('Test Product').closest('[data-testid="product-item"]');
        fireEvent.click(productElement);
        
        // Enter payment amount
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '100' } });
        
        // Perform checkout
        const checkoutButton = screen.getByText(/Thanh toán & In hóa đơn/i);
        fireEvent.click(checkoutButton);
        
        // Wait for offline transaction handling
        await waitFor(() => {
            expect(screen.getByTestId('offline-transaction-success')).toBeInTheDocument();
        });
        
        // Check if transaction was queued
        expect(screen.getByText(/Transaction saved for later sync/i)).toBeInTheDocument();
    });

    test('should show pending transactions count when offline', async () => {
        // Mock pending transactions
        const pendingTransactions = [
            { id: 'local-1', items: [] },
            { id: 'local-2', items: [] }
        ];
        
        getPendingTransactions.mockResolvedValue(pendingTransactions);
        
        render(<POS />);
        
        // Wait for pending transactions to be loaded
        await waitFor(() => {
            expect(getPendingTransactions).toHaveBeenCalled();
        });
        
        // Check if pending transactions count is displayed
        expect(screen.getByText(/2 pending transactions/i)).toBeInTheDocument();
    });
});
