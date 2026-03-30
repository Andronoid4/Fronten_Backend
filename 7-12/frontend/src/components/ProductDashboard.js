import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
// ===== СТИЛИ =====
const styles = {
    dashboard: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
    },
    sidebar: {
        width: '260px',
        backgroundColor: '#2c3e50',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
    },
    sidebarHeader: {
        padding: '0 20px 30px',
        borderBottom: '1px solid #34495e',
    },
    navMenu: { flex: 1, padding: '20px 0' },
    navButton: {
        width: '100%',
        padding: '12px 20px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ecf0f1',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '15px',
    },
    navButtonActive: {
        width: '100%',
        padding: '12px 20px',
        backgroundColor: '#3498db',
        border: 'none',
        color: 'white',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '15px',
        borderRadius: '0 25px 25px 0',
    },
    sidebarFooter: {
        padding: '20px',
        borderTop: '1px solid #34495e',
    },
    logoutButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
    },
    mainContent: {
        flex: 1,
        marginLeft: '260px',
    },
    tabContent: { padding: '30px' },
    userPanel: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    avatar: { fontSize: '40px' },
    userName: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    userRole: {
        fontSize: '14px',
        color: '#9b59b6',
        fontWeight: 'bold',
    },
    userStatus: {
        fontSize: '14px',
        color: '#27ae60',
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    infoCard: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    bigNumber: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#3498db',
        margin: '10px 0',
    },
    userInfoText: {
        fontSize: '20px',
        color: '#2c3e50',
        marginTop: '10px',
    },
    activitySection: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    logContainer: {
        maxHeight: '200px',
        overflowY: 'auto',
        marginTop: '15px',
    },
    logItem: {
        display: 'flex',
        gap: '15px',
        padding: '8px 0',
        borderBottom: '1px solid #ecf0f1',
    },
    logTime: {
        color: '#7f8c8d',
        minWidth: '80px',
    },
    logMessage: {
        color: '#2c3e50',
    },
    form: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    formGroup: { marginBottom: '20px' },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '15px',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '15px',
        boxSizing: 'border-box',
        resize: 'vertical',
    },
    fileInput: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
    },
    fileName: {
        marginTop: '8px',
        color: '#3498db',
        fontSize: '14px',
    },
    submitButton: {
        width: '100%',
        padding: '15px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    generateButton: {
        padding: '15px 30px',
        backgroundColor: '#9b59b6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '20px',
    },
    searchContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    searchInput: {
        flex: 1,
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '15px',
    },
    searchButton: {
        padding: '12px 30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
    },
    productCard: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '20px',
    },
    productDetails: { marginTop: '15px' },
    productImage: {
        maxWidth: '300px',
        marginTop: '15px',
        borderRadius: '8px',
    },
    updateButton: {
        padding: '12px 30px',
        backgroundColor: '#f39c12',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
    },
    deleteButton: {
        padding: '12px 30px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
    },
    smallDeleteButton: {
        padding: '5px 10px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        color: '#856404',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
    },
    refreshButton: {
        padding: '10px 20px',
        backgroundColor: '#9b59b6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '20px',
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        backgroundColor: '#34495e',
        color: 'white',
        padding: '12px',
        textAlign: 'left',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #ecf0f1',
    },
    tdId: {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7f8c8d',
    },
    noAccess: {
        backgroundColor: '#ffe6e6',
        border: '1px solid #ff4444',
        color: '#cc0000',
        padding: '20px',
        borderRadius: '5px',
        fontSize: '16px',
    },
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====
const ProductDashboard = () => {
    const { user, logout, hasRole, isAdmin, isSeller } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [currentUser, setCurrentUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
    const [newImage, setNewImage] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [foundProduct, setFoundProduct] = useState(null);
    const [updateId, setUpdateId] = useState('');
    const [updateData, setUpdateData] = useState({ name: '', price: '', description: '' });
    const [updateImage, setUpdateImage] = useState(null);
    const [deleteId, setDeleteId] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadUserData();
        loadProducts();
        if (isAdmin) {
            loadUsers();
        }
    }, []);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setActivityLog(prev => [{ time: timestamp, message }, ...prev].slice(0, 10));
    };

    const loadUserData = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setCurrentUser(response.data);
            addLog('Пользователь авторизован');
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await api.get('/api/products');
            setProducts(response.data);
            addLog(`Загружено товаров: ${response.data.length}`);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    };

    const loadUsers = async () => {
        if (!isAdmin) return;
        try {
            const response = await api.get('/api/users');
            setUsers(response.data);
            addLog(`Загружено пользователей: ${response.data.length}`);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    };

    const handleGenerateTestProducts = async () => {
        if (!hasRole(['seller', 'admin'])) {
            alert('❌ Недостаточно прав!');
            return;
        }
        const count = prompt('Сколько товаров создать?', '10');
        if (!count || count < 1 || count > 100) {
            alert('Введите число от 1 до 100');
            return;
        }
        try {
            await api.post('/api/products/generate', { count: parseInt(count) });
            alert(`✅ Создано ${count} тестовых товаров!`);
            loadProducts();
            addLog(`Сгенерировано ${count} тестовых товаров`);
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!hasRole(['seller', 'admin'])) {
            alert('❌ Недостаточно прав для создания товара!');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('price', newProduct.price);
            formData.append('description', newProduct.description);
            if (newImage) formData.append('image', newImage);

            await api.post('/api/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            alert('✅ Товар успешно создан!');
            setNewProduct({ name: '', price: '', description: '' });
            setNewImage(null);
            loadProducts();
            addLog(`Создан товар: ${newProduct.name}`);
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSearch = async () => {
        if (!searchId.trim()) {
            alert('Введите ID товара');
            return;
        }
        try {
            const response = await api.get(`/api/products/${searchId.trim()}`);
            setFoundProduct(response.data);
            addLog(`Найден товар: ${response.data.name}`);
        } catch (error) {
            alert('❌ Товар не найден');
            setFoundProduct(null);
        }
    };

    const handleUpdate = async () => {
        if (!hasRole(['seller', 'admin'])) {
            alert('❌ Недостаточно прав для обновления!');
            return;
        }
        if (!updateId.trim()) {
            alert('Введите ID товара');
            return;
        }
        try {
            const formData = new FormData();
            if (updateData.name) formData.append('name', updateData.name);
            if (updateData.price) formData.append('price', updateData.price);
            if (updateData.description) formData.append('description', updateData.description);
            if (updateImage) formData.append('image', updateImage);

            await api.put(`/api/products/${updateId.trim()}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            alert('✅ Товар обновлен!');
            setUpdateId('');
            setUpdateData({ name: '', price: '', description: '' });
            setUpdateImage(null);
            loadProducts();
            addLog(`Обновлен товар ID: ${updateId}`);
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async () => {
        if (!isAdmin) {
            alert('❌ Только администратор может удалять товары!');
            return;
        }
        if (!deleteId.trim()) {
            alert('Введите ID товара');
            return;
        }
        if (!window.confirm(`Удалить товар с ID ${deleteId}?`)) return;
        
        try {
            await api.delete(`/api/products/${deleteId.trim()}`);
            alert('✅ Товар удален!');
            setDeleteId('');
            loadProducts();
            addLog(`Удален товар ID: ${deleteId}`);
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!isAdmin) {
            alert('❌ Только администратор может удалять пользователей!');
            return;
        }
        if (!window.confirm(`Удалить пользователя ${userId}?`)) return;
        
        try {
            await api.delete(`/api/users/${userId}`);
            alert('✅ Пользователь удален!');
            loadUsers();
            addLog(`Удален пользователь ID: ${userId}`);
        } catch (error) {
            alert('❌ Ошибка: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleLogout = () => {
        addLog('Пользователь вышел из системы');
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.dashboard}>
            {/* SIDEBAR */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2>🛒 Магазин</h2>
                </div>
                <nav style={styles.navMenu}>
                    <button 
                        onClick={() => setActiveTab('overview')}
                        style={activeTab === 'overview' ? styles.navButtonActive : styles.navButton}
                    >
                        📊 Обзор
                    </button>
                    {hasRole(['seller', 'admin']) && (
                        <button 
                            onClick={() => setActiveTab('create')}
                            style={activeTab === 'create' ? styles.navButtonActive : styles.navButton}
                        >
                            ➕ Создать товар
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('search')}
                        style={activeTab === 'search' ? styles.navButtonActive : styles.navButton}
                    >
                        🔍 Поиск
                    </button>
                    {hasRole(['seller', 'admin']) && (
                        <button 
                            onClick={() => setActiveTab('update')}
                            style={activeTab === 'update' ? styles.navButtonActive : styles.navButton}
                        >
                            ✏️ Обновить
                        </button>
                    )}
                    {isAdmin && (
                        <button 
                            onClick={() => setActiveTab('delete')}
                            style={activeTab === 'delete' ? styles.navButtonActive : styles.navButton}
                        >
                            🗑️ Удалить
                        </button>
                    )}
                    {isAdmin && (
                        <button 
                            onClick={() => setActiveTab('users')}
                            style={activeTab === 'users' ? styles.navButtonActive : styles.navButton}
                        >
                            👥 Пользователи
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('list')}
                        style={activeTab === 'list' ? styles.navButtonActive : styles.navButton}
                    >
                        📋 Все товары
                    </button>
                </nav>
                <div style={styles.sidebarFooter}>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        🚪 Выйти
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={styles.mainContent}>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={styles.tabContent}>
                        <h2>📊 Панель управления</h2>
                        
                        {hasRole(['seller', 'admin']) && (
                            <button onClick={handleGenerateTestProducts} style={styles.generateButton}>
                                🎲 Сгенерировать тестовые товары
                            </button>
                        )}
                        
                        <div style={styles.userPanel}>
                            <div style={styles.userInfo}>
                                <div style={styles.avatar}>👤</div>
                                <div>
                                    <div style={styles.userName}>{currentUser?.username || 'Пользователь'}</div>
                                    <div style={styles.userRole}>
                                        {currentUser?.role === 'admin' && '👑 Администратор'}
                                        {currentUser?.role === 'seller' && '🏪 Продавец'}
                                        {currentUser?.role === 'user' && '👤 Пользователь'}
                                    </div>
                                    <div style={styles.userStatus}>🟢 Онлайн</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={styles.cardsGrid}>
                            <div style={styles.infoCard}>
                                <h3>📦 Всего товаров</h3>
                                <p style={styles.bigNumber}>{products.length}</p>
                            </div>
                            <div style={styles.infoCard}>
                                <h3>👤 Пользователь</h3>
                                <p style={styles.userInfoText}>{currentUser?.username}</p>
                            </div>
                            {isAdmin && (
                                <div style={styles.infoCard}>
                                    <h3>👥 Пользователей</h3>
                                    <p style={styles.bigNumber}>{users.length}</p>
                                </div>
                            )}
                        </div>

                        <div style={styles.activitySection}>
                            <h3>📜 Журнал действий</h3>
                            <div style={styles.logContainer}>
                                {activityLog.map((log, index) => (
                                    <div key={index} style={styles.logItem}>
                                        <span style={styles.logTime}>{log.time}</span>
                                        <span style={styles.logMessage}>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CREATE TAB */}
                {activeTab === 'create' && (
                    <div style={styles.tabContent}>
                        <h2>➕ Создание нового товара</h2>
                        {!hasRole(['seller', 'admin']) ? (
                            <div style={styles.noAccess}>
                                ⛔ <strong>Доступ запрещён!</strong> Только продавец и администратор могут создавать товары.
                            </div>
                        ) : (
                            <form onSubmit={handleCreateProduct} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Название товара *</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        style={styles.input}
                                        required
                                        placeholder="Введите название"
                                    />
                                </div>
                                
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Цена *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        style={styles.input}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Описание</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        style={styles.textarea}
                                        rows="4"
                                        placeholder="Описание товара..."
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Изображение</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewImage(e.target.files[0])}
                                        style={styles.fileInput}
                                    />
                                    {newImage && <div style={styles.fileName}>📎 {newImage.name}</div>}
                                </div>

                                <button type="submit" style={styles.submitButton}>
                                    💾 Создать товар
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* SEARCH TAB */}
                {activeTab === 'search' && (
                    <div style={styles.tabContent}>
                        <h2>🔍 Поиск товара по ID</h2>
                        <div style={styles.searchContainer}>
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                style={styles.searchInput}
                                placeholder="Введите ID товара (например: PROD-ABC123)"
                            />
                            <button onClick={handleSearch} style={styles.searchButton}>
                                🔍 Найти
                            </button>
                        </div>

                        {foundProduct && (
                            <div style={styles.productCard}>
                                <h3>Найденный товар</h3>
                                <div style={styles.productDetails}>
                                    <p><strong>ID:</strong> {foundProduct.id}</p>
                                    <p><strong>Название:</strong> {foundProduct.name}</p>
                                    <p><strong>Цена:</strong> ${foundProduct.price}</p>
                                    <p><strong>Описание:</strong> {foundProduct.description}</p>
                                    {foundProduct.image && (
                                        <img 
                                            src={`http://localhost:3000${foundProduct.image}`} 
                                            alt={foundProduct.name}
                                            style={styles.productImage}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* UPDATE TAB */}
                {activeTab === 'update' && (
                    <div style={styles.tabContent}>
                        <h2>✏️ Обновление товара</h2>
                        {!hasRole(['seller', 'admin']) ? (
                            <div style={styles.noAccess}>
                                ⛔ <strong>Доступ запрещён!</strong> Только продавец и администратор могут обновлять товары.
                            </div>
                        ) : (
                            <div style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ID товара</label>
                                    <input
                                        type="text"
                                        value={updateId}
                                        onChange={(e) => setUpdateId(e.target.value)}
                                        style={styles.input}
                                        placeholder="Введите ID товара"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Новое название</label>
                                    <input
                                        type="text"
                                        value={updateData.name}
                                        onChange={(e) => setUpdateData({ ...updateData, name: e.target.value })}
                                        style={styles.input}
                                        placeholder="Новое название"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Новая цена</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={updateData.price}
                                        onChange={(e) => setUpdateData({ ...updateData, price: e.target.value })}
                                        style={styles.input}
                                        placeholder="Новая цена"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Новое описание</label>
                                    <textarea
                                        value={updateData.description}
                                        onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
                                        style={styles.textarea}
                                        rows="3"
                                        placeholder="Новое описание"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Новое изображение</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setUpdateImage(e.target.files[0])}
                                        style={styles.fileInput}
                                    />
                                    {updateImage && <div style={styles.fileName}>📎 {updateImage.name}</div>}
                                </div>

                                <button onClick={handleUpdate} style={styles.updateButton}>
                                    ✏️ Обновить товар
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* DELETE TAB */}
                {activeTab === 'delete' && (
                    <div style={styles.tabContent}>
                        <h2>🗑️ Удаление товара</h2>
                        {!isAdmin ? (
                            <div style={styles.noAccess}>
                                ⛔ <strong>Доступ запрещён!</strong> Только администратор может удалять товары.
                            </div>
                        ) : (
                            <>
                                <div style={styles.warningBox}>
                                    ⚠️ <strong>Внимание!</strong> Это действие нельзя отменить.
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ID товара для удаления</label>
                                    <input
                                        type="text"
                                        value={deleteId}
                                        onChange={(e) => setDeleteId(e.target.value)}
                                        style={styles.input}
                                        placeholder="Введите ID товара"
                                    />
                                </div>
                                <button onClick={handleDelete} style={styles.deleteButton}>
                                    🗑️ Удалить товар
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div style={styles.tabContent}>
                        <h2>👥 Управление пользователями</h2>
                        {!isAdmin ? (
                            <div style={styles.noAccess}>
                                ⛔ <strong>Доступ запрещён!</strong> Только администратор может управлять пользователями.
                            </div>
                        ) : (
                            <>
                                <button onClick={loadUsers} style={styles.refreshButton}>
                                    🔄 Обновить список
                                </button>
                                
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>ID</th>
                                                <th style={styles.th}>Username</th>
                                                <th style={styles.th}>Роль</th>
                                                <th style={styles.th}>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id}>
                                                    <td style={styles.tdId}>{u.id}</td>
                                                    <td style={styles.td}>{u.username}</td>
                                                    <td style={styles.td}>
                                                        {u.role === 'admin' && '👑 Админ'}
                                                        {u.role === 'seller' && '🏪 Продавец'}
                                                        {u.role === 'user' && '👤 Пользователь'}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <button 
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            style={styles.smallDeleteButton}
                                                        >
                                                            🗑️ Удалить
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* LIST TAB */}
                {activeTab === 'list' && (
                    <div style={styles.tabContent}>
                        <h2>📋 Список всех товаров</h2>
                        <button onClick={loadProducts} style={styles.refreshButton}>
                            🔄 Обновить список
                        </button>
                        
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Название</th>
                                        <th style={styles.th}>Цена</th>
                                        <th style={styles.th}>Описание</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td style={styles.tdId}>{product.id}</td>
                                            <td style={styles.td}>{product.name}</td>
                                            <td style={styles.td}>${product.price}</td>
                                            <td style={styles.td}>{product.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDashboard;