import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const UsersList = () => {
    const { user } = useAuth(); // Берем юзера для проверки роли
    const isAdmin = user?.role === 'admin';
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки пользователей:', err);
            setError('Не удалось загрузить список. Проверь бэкенд.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (username === 'admin') {
            alert('Нельзя удалить главного администратора!');
            return;
        }
        if (!window.confirm(`Вы действительно хотите удалить "${username}"?`)) return;

        try {
            await api.delete(`/api/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Ошибка при удалении');
        }
    };

    if (!isAdmin) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>⛔ Доступ только для администраторов</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Управление доступом</h2>
                <button onClick={fetchUsers} style={styles.refreshBtn}>🔄 Обновить</button>
            </header>

            {loading ? (
                <div style={styles.loading}>Загрузка...</div>
            ) : error ? (
                <div style={styles.errorCard}>{error}</div>
            ) : (
                <div style={styles.card}>
                    {users.map((u) => (
                        <div key={u.id} style={styles.userRow}>
                            <div style={styles.userInfo}>
                                <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
                                <div>
                                    <div style={styles.userName}>{u.username}</div>
                                    <div style={styles.userRole}>{u.role}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                style={styles.deleteBtn}
                                disabled={u.username === 'admin'}
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#1a1a1a' },
    refreshBtn: { padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #eee', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' },
    userRow: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px', 
        borderBottom: '1.5px solid #f9f9f9',
        transition: '0.2s'
    },
    userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
    avatar: { width: '40px', height: '40px', backgroundColor: '#007AFF', color: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
    userName: { fontWeight: '700', color: '#333' },
    userRole: { fontSize: '12px', color: '#007AFF', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' },
    deleteBtn: { 
        padding: '8px 16px', 
        borderRadius: '10px', 
        border: 'none', 
        backgroundColor: '#fff5f5', 
        color: '#ff4d4f', 
        fontWeight: '700', 
        cursor: 'pointer',
        fontSize: '13px'
    },
    errorCard: { backgroundColor: '#fff0f0', color: '#ff4d4f', padding: '20px', borderRadius: '15px', textAlign: 'center', fontWeight: '600' },
    loading: { textAlign: 'center', color: '#888', marginTop: '40px' }
};

export default UsersList;