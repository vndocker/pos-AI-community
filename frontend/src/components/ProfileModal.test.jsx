import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModal from './ProfileModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock API module
vi.mock('../services/api', () => {
  const api = {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn()
  };
  return { default: api };
});

// Mock file data
const createMockFile = (size = 100 * 1024, type = 'image/jpeg') => {
  const file = new File(['x'.repeat(size)], 'test.jpg', { type });
  return file;
};

describe('ProfileModal', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    avatar_url: null
  };

  const mockUpdateUser = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default auth context
    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser
    });

    // Setup default API responses
    api.post.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ data: {} });
  });

  // Rendering Tests
  describe('Rendering', () => {
    it('renders all form elements correctly', () => {
      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Change Avatar')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('displays user data correctly', () => {
      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText('Email')).toHaveValue(mockUser.email);
      expect(screen.getByLabelText('Username')).toHaveAttribute('placeholder', mockUser.username);
    });

    it('disables save button when no changes are made', () => {
      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });
  });

  // Username Update Tests
  describe('Username Update', () => {
    it('enables save button when username is changed', () => {
      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    });

    it('successfully updates username', async () => {
      const updatedProfile = { ...mockUser, username: 'newusername' };
      api.put.mockResolvedValueOnce({ data: updatedProfile });

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/auth/profile', { username: 'newusername' });
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedProfile);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles username update error', async () => {
      api.put.mockRejectedValueOnce(new Error('Update failed'));

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update profile/)).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  // File Upload Tests
  describe('Avatar Upload', () => {
    it('validates file size', () => {
      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const input = screen.getByLabelText(/Change Avatar/);
      const largeFile = createMockFile(600 * 1024); // 600KB
      
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      expect(screen.getByText(/File size must be less than 500KB/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });

    it('successfully uploads avatar', async () => {
      const presignedUrls = {
        upload_url: 'https://example.com/upload',
        object_key: 'avatars/123/test.jpg'
      };
      const updatedProfile = {
        ...mockUser,
        avatar_url: 'https://example.com/avatars/123/test.jpg'
      };

      // Mock successful presigned URL request
      api.post.mockResolvedValueOnce({ data: presignedUrls });
      
      // Mock successful avatar confirmation
      api.post.mockResolvedValueOnce({ data: updatedProfile });

      // Mock successful fetch for R2 upload
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const input = screen.getByLabelText(/Change Avatar/);
      const file = createMockFile();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      expect(screen.getByText(/test.jpg/)).toBeInTheDocument();
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/avatar/presigned');
        expect(global.fetch).toHaveBeenCalledWith(
          presignedUrls.upload_url,
          expect.objectContaining({
            method: 'PUT',
            body: file
          })
        );
        expect(api.post).toHaveBeenCalledWith('/auth/avatar/confirm', {
          object_key: presignedUrls.object_key
        });
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedProfile);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles presigned URL request error', async () => {
      api.post.mockRejectedValueOnce(new Error('Failed to get presigned URL'));

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const input = screen.getByLabelText(/Change Avatar/);
      const file = createMockFile();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update profile/)).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('handles R2 upload error', async () => {
      const presignedUrls = {
        upload_url: 'https://example.com/upload',
        object_key: 'avatars/123/test.jpg'
      };

      api.post.mockResolvedValueOnce({ data: presignedUrls });
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Upload failed'));

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      const input = screen.getByLabelText(/Change Avatar/);
      const file = createMockFile();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update profile: Failed to upload avatar/)).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  // Combined Update Tests
  describe('Combined Updates', () => {
    it('successfully updates both username and avatar', async () => {
      const presignedUrls = {
        upload_url: 'https://example.com/upload',
        object_key: 'avatars/123/test.jpg'
      };
      const updatedProfile = {
        ...mockUser,
        username: 'newusername',
        avatar_url: 'https://example.com/avatars/123/test.jpg'
      };

      api.post.mockResolvedValueOnce({ data: presignedUrls });
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });
      api.post.mockResolvedValueOnce({ data: updatedProfile });
      api.put.mockResolvedValueOnce({ data: updatedProfile });

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      // Change username
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      // Upload avatar
      const input = screen.getByLabelText(/Change Avatar/);
      const file = createMockFile();
      fireEvent.change(input, { target: { files: [file] } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/avatar/presigned');
        expect(global.fetch).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/auth/avatar/confirm', {
          object_key: presignedUrls.object_key
        });
        expect(api.put).toHaveBeenCalledWith('/auth/profile', {
          username: 'newusername'
        });
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedProfile);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles partial success (avatar fails, username succeeds)', async () => {
      const updatedProfile = {
        ...mockUser,
        username: 'newusername'
      };

      // Avatar upload fails
      api.post.mockRejectedValueOnce(new Error('Failed to get presigned URL'));
      
      // Username update succeeds
      api.put.mockResolvedValueOnce({ data: updatedProfile });

      render(<ProfileModal open={true} onClose={mockOnClose} />);
      
      // Change username
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      // Upload avatar
      const input = screen.getByLabelText(/Change Avatar/);
      const file = createMockFile();
      fireEvent.change(input, { target: { files: [file] } });
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update profile: Failed to get presigned URL/)).toBeInTheDocument();
        expect(api.put).toHaveBeenCalledWith('/auth/profile', {
          username: 'newusername'
        });
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedProfile);
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });
});
