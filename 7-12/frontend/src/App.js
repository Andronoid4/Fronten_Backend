import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Импортируем CSS, чтобы стили подтянулись
import './App.css';

// ВСЕ ИМПОРТЫ ТЕПЕРЬ ИЗ ОДНОЙ ПАПКИ (согласно твоей структуре на диске)
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ProductDashboard from './components/ProductDashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ProductDetail from './components/ProductDetail';
import UsersList from './components/UsersList';

// ===== Protected Route (Защита для авторизованных) =====
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="container"><h2>Загрузка...</h2></div>;
    if (!user) return <Navigate to="/login" />;

    return children;
};

// ===== Admin Route (Защита только для админа) =====
const AdminRoute = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) return <div className="container"><h2>Загрузка...</h2></div>;
    if (!user) return <Navigate to="/login" />;

    if (!isAdmin) {
        return (
            <div className="container" style={{ textAlign: 'center' }}>
                <h2>⛔ Доступ запрещён!</h2>
                <p>Только администратор может просматривать эту страницу.</p>
                <button className="btn btn-primary" onClick={() => window.history.back()}>
                    ← Назад
                </button>
            </div>
        );
    }

    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar />
                <div className="main-content">
                    <Routes>
                        {/* Публичные маршруты */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Защищённые маршруты */}
                        <Route path="/" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
                        <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><ProductDashboard /></ProtectedRoute>} />
                        
                        <Route path="/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                        <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                        <Route path="/products/:id/edit" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />

                        {/* Админские маршруты */}
                        <Route 
                            path="/users" 
                            element={
                                <AdminRoute>
                                    <UsersList />
                                </AdminRoute>
                            } 
                        />

                        {/* Перенаправление на главную */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;