import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * Enriches a plain user object from the API with role-helper methods.
 */
const enrichUser = (userData) => {
    if (!userData) return null;
    return {
        ...userData,
        isAdmin: () => ['Admin', 'SuperAdmin'].includes(userData.role),
        isSuperAdmin: () => userData.role === 'SuperAdmin',
        isPic: () => userData.role === 'PIC',
        isUser: () => userData.role === 'User',
        // Convenience: can access admin-level features
        hasAdminAccess: () => ['Admin', 'SuperAdmin'].includes(userData.role),
    };
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data?.status === 'success') {
                setUser(enrichUser(res.data.data.user));
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username, password) => {
        // Fetch fresh CSRF cookie before login
        await api.get('/sanctum/csrf-cookie', { baseURL: '/' });
        const res = await api.post('/auth/login', { username, password });
        if (res.data?.status === 'success') {
            setUser(enrichUser(res.data.data.user));
            return res.data;
        }
        throw new Error(res.data?.message || 'Login gagal.');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore
        } finally {
            localStorage.removeItem('sapt_active_tab');
            setUser(null);
        }
    };

    const quickSwitch = async (username) => {
        return await login(username, 'password');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, quickSwitch, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
