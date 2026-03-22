import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Проверка авторизации при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const response = await api.get('/api/auth/me');
                    setUser(response.data);
                } catch (error) {
                    logout(); // Очищаем всё, если токен протух
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/api/auth/login', { username, password });
            const { accessToken, refreshToken, id, role, username: serverUsername } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            const userData = { id, username: serverUsername, role };
            setUser(userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (username, password, role = 'user') => {
        try {
            const response = await api.post('/api/auth/register', { username, password, role });
            const { accessToken, refreshToken, id, role: userRole, username: regName } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            const userData = { id, username: regName, role: userRole };
            setUser(userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    // Вычисляемые свойства для удобства
    const isAdmin = user?.role === 'admin';
    const isSeller = user?.role === 'seller';
    
    // Флаг: может ли юзер управлять контентом (создавать/менять товары)
    const canManage = isAdmin || isSeller;

    return (
        <AuthContext.Provider value={{ 
            user, login, register, logout, loading,
            isAdmin,
            isSeller,
            canManage // Используй это в кнопках!
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);