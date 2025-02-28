import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMatchMedia } from '../test-utils';
import POS from './POS';
import { searchProducts, createInvoice } from '../services/api';

// Mock the API functions
jest.mock('../services/api', () => ({
    searchProducts: jest.fn(),
    createInvoice: jest.fn()
}));

describe('POS Responsive Design', () => {
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

    test('should render product grid with correct column count on mobile', async () => {
        // Mock window.matchMedia for mobile viewport
        window.matchMedia = createMatchMedia(400); // Mobile width

        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Check if product grid items use correct column width for mobile
        const productItems = document.querySelectorAll('[data-testid="product-item"]');
        expect(productItems.length).toBeGreaterThan(0);
        
        // Check the computed style of the product items
        const productItem = productItems[0];
        expect(productItem.parentElement.className).toContain('xs-12'); // Full width on mobile
    });

    test('should render product grid with correct column count on tablet', async () => {
        // Mock window.matchMedia for tablet viewport
        window.matchMedia = createMatchMedia(768); // Tablet width

        render(<POS />);
        
        // Add product to cart
        const searchInput = screen.getByLabelText(/F1 - Tìm kiếm sản phẩm/i);
        fireEvent.change(searchInput, { target: { value: 'SP001' } });
        
        await waitFor(() => {
            expect(searchProducts).toHaveBeenCalledWith('SP001');
        });

        // Check if product grid items use correct column width for tablet
        const productItems = document.querySelectorAll('[data-testid="product-item"]');
        expect(productItems.length).toBeGreaterThan(0);
        
        // Check the computed style of the product items
        const productItem = productItems[0];
        expect(productItem.parentElement.className).toContain('sm-6'); // Half width on tablet
    });

    test('should stack product search and cart sections vertically on mobile', () => {
        // Mock window.matchMedia for mobile viewport
        window.matchMedia = createMatchMedia(400); // Mobile width

        render(<POS />);
        
        // Check if the main grid container has the correct layout
        const gridItems = document.querySelectorAll('.MuiGrid-item');
        expect(gridItems.length).toBe(2); // Two main sections
        
        // Both sections should be full width on mobile
        expect(gridItems[0].className).toContain('xs-12');
        expect(gridItems[1].className).toContain('xs-12');
    });

    test('should show cart toggle button on mobile', () => {
        // Mock window.matchMedia for mobile viewport
        window.matchMedia = createMatchMedia(400); // Mobile width

        render(<POS />);
        
        // Check if cart toggle button is visible on mobile
        const cartToggleButton = screen.getByTestId('cart-toggle-button');
        expect(cartToggleButton).toBeInTheDocument();
    });

    test('should hide cart toggle button on desktop', () => {
        // Mock window.matchMedia for desktop viewport
        window.matchMedia = createMatchMedia(1200); // Desktop width

        render(<POS />);
        
        // Cart toggle button should not be visible on desktop
        const cartToggleButton = screen.queryByTestId('cart-toggle-button');
        expect(cartToggleButton).not.toBeInTheDocument();
    });

    test('should toggle cart visibility on mobile when button is clicked', () => {
        // Mock window.matchMedia for mobile viewport
        window.matchMedia = createMatchMedia(400); // Mobile width

        render(<POS />);
        
        // Get cart section and toggle button
        const cartSection = screen.getByTestId('cart-section');
        const cartToggleButton = screen.getByTestId('cart-toggle-button');
        
        // Initially cart should be hidden on mobile
        expect(cartSection).toHaveStyle({ display: 'none' });
        
        // Click toggle button to show cart
        fireEvent.click(cartToggleButton);
        expect(cartSection).not.toHaveStyle({ display: 'none' });
        
        // Click again to hide
        fireEvent.click(cartToggleButton);
        expect(cartSection).toHaveStyle({ display: 'none' });
    });
});
