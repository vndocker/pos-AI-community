import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });
    const [user, setUser] = useState({ username: 'bang' });

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserProfile();
        }
    }, [isAuthenticated]);

    const fetchUserProfile = async () => {
        try {
            // const { data } = await api.get('/auth/profile');
            // setUser(data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If profile fetch fails, assume authentication is invalid
            logout();
        }
    };

    const login = () => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('isAuthenticated');
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            login, 
            logout,
            user,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
