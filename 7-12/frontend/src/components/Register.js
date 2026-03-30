import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await register(username.trim(), password.trim(), role);
            navigate('/products');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка регистрации. Этот логин может быть занят.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Регистрация</h2>
                
                <p style={styles.subtitle}>Создайте аккаунт, чтобы начать покупки</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Имя пользователя</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Например, dranik"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Пароль</label>
                        <div style={styles.passWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Минимум 6 символов"
                                style={{ ...styles.input, flex: 1 }}
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

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Ваша роль</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            style={styles.select}
                        >
                            <option value="user">👤 Покупатель</option>
                            <option value="seller">🏪 Продавец</option>
                            <option value="admin">👑 Администратор</option>
                        </select>
                    </div>

                    <button type="submit" style={styles.submitBtn}>Создать аккаунт</button>
                </form>

                <div style={styles.footerText}>
                    Уже есть профиль? <Link to="/login" style={styles.link}>Войти</Link>
                </div>
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
        backgroundColor: '#f4f7f6',
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#888',
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
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1.5px solid #eee',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1.5px solid #eee',
        fontSize: '16px',
        backgroundColor: '#fff',
        cursor: 'pointer',
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
        backgroundColor: '#007AFF',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        color: '#e74c3c',
        backgroundColor: '#fdeaea',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '20px',
        fontSize: '13px',
    },
    footerText: {
        marginTop: '25px',
        fontSize: '14px',
        color: '#666',
    },
    link: {
        color: '#007AFF',
        textDecoration: 'none',
        fontWeight: '600',
    }
};

export default Register;