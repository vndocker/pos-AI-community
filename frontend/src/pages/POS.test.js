import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import POS from './POS';
import { searchProducts, createInvoice } from '../services/api';

// Mock the API functions
jest.mock('../services/api', () => ({
    searchProducts: jest.fn(),
    createInvoice: jest.fn()
}));

describe('POS Payment Handling', () => {
    const mockProduct = {
        id: 1,
        code: 'SP001',
        name: 'Test Product',
        price: 100000
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        searchProducts.mockResolvedValue({ items: [mockProduct] });
        createInvoice.mockResolvedValue({ id: 1 });
    });

    test('should handle payment amount input correctly', async () => {
        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Enter payment amount
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '150' } });

        // Check if amount is multiplied by 1000
        const changeAmount = screen.getByText(/Tiền trả lại: 50,000 đ/i);
        expect(changeAmount).toBeInTheDocument();
    });

    test('should format currency with thousand separator', async () => {
        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Check total formatting
        expect(screen.getByText(/100,000 đ/i)).toBeInTheDocument();

        // Enter payment and check change formatting
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '1000' } });
        
        expect(screen.getByText(/900,000 đ/i)).toBeInTheDocument();
    });

    test('should calculate change correctly for multiple products', async () => {
        render(<POS />);
        
        // Add product to cart twice
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Find quantity increase button and click it
        const increaseButton = screen.getAllByText('+')[0];
        fireEvent.click(increaseButton);

        // Enter payment for two items
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '250' } });

        // Check change amount (250,000 - 200,000 = 50,000)
        const changeAmount = screen.getByText(/Tiền trả lại: 50,000 đ/i);
        expect(changeAmount).toBeInTheDocument();
    });

    test('should handle zero payment amount', () => {
        render(<POS />);
        
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '0' } });

        // Verify checkout button is disabled
        const checkoutButton = screen.getByText(/Thanh toán & In hóa đơn/i);
        expect(checkoutButton).toBeDisabled();
    });

    test('should handle payment less than total', async () => {
        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Enter insufficient payment
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '50' } });

        // Verify checkout button is disabled
        const checkoutButton = screen.getByText(/Thanh toán & In hóa đơn/i);
        expect(checkoutButton).toBeDisabled();
    });

    test('should handle non-numeric input', () => {
        render(<POS />);
        
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: 'abc123' } });

        // Should only process numeric values
        const changeAmount = screen.getByText(/Tiền trả lại: 123,000 đ/i);
        expect(changeAmount).toBeInTheDocument();
    });

    test('should update change amount when cart total changes', async () => {
        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Enter payment
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '200' } });

        // Initial change amount
        expect(screen.getByText(/Tiền trả lại: 100,000 đ/i)).toBeInTheDocument();

        // Add another product
        const increaseButton = screen.getAllByText('+')[0];
        fireEvent.click(increaseButton);

        // Change amount should update
        expect(screen.getByText(/Tiền trả lại: 0 đ/i)).toBeInTheDocument();
    });

    test('should handle keyboard shortcuts correctly', () => {
        render(<POS />);
        
        // Test F1 shortcut
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.keyDown(window, { key: 'F1' });
        expect(document.activeElement).toBe(searchInput);

        // Test F2 shortcut
        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.keyDown(window, { key: 'F2' });
        expect(document.activeElement).toBe(paymentInput);
    });

    test('should clear payment amount after successful checkout', async () => {
        render(<POS />);
        
        // Add product and payment
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        const paymentInput = screen.getByLabelText(/F2 - Số tiền khách trả/i);
        fireEvent.change(paymentInput, { target: { value: '100' } });

        // Perform checkout
        const checkoutButton = screen.getByText(/Thanh toán & In hóa đơn/i);
        fireEvent.click(checkoutButton);

        await waitFor(() => {
            expect(createInvoice).toHaveBeenCalled();
        });

        // Check if payment input is cleared
        expect(paymentInput.value).toBe('');
    });
});
