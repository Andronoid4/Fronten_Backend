import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Формируем список ссылок динамически
    const navLinks = [
        { name: 'Главная', path: '/products' },
    ];

    // Добавляем админскую страницу, если роль соответствует
    if (user?.role === 'admin') {
        navLinks.push({ name: 'Пользователи', path: '/users' });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <Link to="/products" style={styles.logo}>🛒 Магазин</Link>
                
                <div style={styles.menu}>
                    {/* Основные ссылки из объекта */}
                    <div style={styles.navGroup}>
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                style={{
                                    ...styles.link,
                                    color: location.pathname === link.path ? '#007AFF' : '#666'
                                }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div style={styles.divider}></div>

                    {user ? (
                        <div style={styles.userInfo}>
                            <div style={styles.userText}>
                                <span style={styles.username}>{user.username}</span>
                                <span style={styles.roleLabel}>{user.role}</span>
                            </div>
                            <button onClick={handleLogout} style={styles.logoutBtn}>Выйти</button>
                        </div>
                    ) : (
                        <div style={styles.authGroup}>
                            <Link to="/login" style={styles.loginLink}>Войти</Link>
                            <Link to="/register" style={styles.registerBtn}>Регистрация</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        backgroundColor: '#fff',
        padding: '12px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
    },
    logo: { fontSize: '20px', fontWeight: '800', color: '#1a1a1a', textDecoration: 'none' },
    menu: { display: 'flex', alignItems: 'center', gap: '20px' },
    navGroup: { display: 'flex', gap: '25px' },
    link: { 
        textDecoration: 'none', 
        fontSize: '15px', 
        fontWeight: '600', 
        transition: '0.2s' 
    },
    divider: { width: '1px', height: '24px', backgroundColor: '#f0f0f0' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
    userText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    username: { fontSize: '14px', fontWeight: '700', color: '#1a1a1a' },
    roleLabel: { fontSize: '10px', color: '#007AFF', fontWeight: '800', textTransform: 'uppercase', marginTop: '-2px' },
    logoutBtn: {
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1.5px solid #eee',
        backgroundColor: '#fff',
        color: '#ff4d4f',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
    },
    loginLink: { textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px' },
    registerBtn: {
        textDecoration: 'none',
        backgroundColor: '#007AFF',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '700',
    },
    authGroup: { display: 'flex', alignItems: 'center', gap: '15px' }
};

export default Navbar;