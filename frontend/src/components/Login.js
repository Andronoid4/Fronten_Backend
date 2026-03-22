import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation(); 
    }
    
    console.log("Вход успешный!");
    setError('');

    try {
        const result = await login(username.trim(), password.trim());
        console.log("Результат входа:", result);
        navigate('/products');
    } catch (err) {
        console.error("Ошибка при входе:", err);
        setError('Неверный логин или пароль');
    }
    return false;
};

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Вход в систему</h2>
                
                <div style={styles.adminBox}>
                    <div style={{fontSize: '12px', color: '#666'}}>Данные админа:</div>
                    <strong>admin</strong> / <strong>admin123</strong>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Логин</label>
                        <input
                            style={styles.input}
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Пароль</label>
                        <div style={styles.passWrapper}>
                            <input
                                style={{ ...styles.input, flex: 1 }}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.eyeBtn}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" style={styles.submitBtn}>Войти</button>
                </form>
                
                <p style={{marginTop: '15px', fontSize: '14px'}}>
                    Нет аккаунта? <Link to="/register" style={{color: '#007AFF'}}>Регистрация</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f4f7f6', // Светлый фон
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '360px',
        textAlign: 'center',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '24px',
    },
    formGroup: {
        marginBottom: '18px',
        textAlign: 'left',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#666',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1.5px solid #eee',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: '0.2s',
    },
    passWrapper: {
        display: 'flex',
        gap: '8px',
    },
    eyeBtn: {
        padding: '0 12px',
        fontSize: '20px',
        backgroundColor: '#fff',
        border: '1.5px solid #eee',
        borderRadius: '12px',
        cursor: 'pointer',
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#007AFF', // Фирменный синий Apple
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '10px',
        transition: '0.2s',
    },
    footerText: {
        marginTop: '20px',
        fontSize: '14px',
        color: '#888',
    },
    link: {
        color: '#007AFF',
        textDecoration: 'none',
        fontWeight: '600',
    },
    // Специально для входа (подсказка админа)
    adminBadge: {
        backgroundColor: '#eef6ff',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '20px',
        fontSize: '13px',
        border: '1px solid #ddecff',
        color: '#0056b3'
    }
};

export default Login;