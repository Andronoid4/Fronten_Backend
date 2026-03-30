import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ProductList = () => {
    const { isAdmin, isSeller } = useAuth();
    const [products, setProducts] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/api/products');
            setProducts(response.data);
        } catch (err) {
            setError('Ошибка загрузки товаров');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTestProducts = async () => {
        const count = prompt('Сколько товаров создать? (1-100)', '10');
        if (!count || count < 1 || count > 100) return;

        try {
            await api.post('/api/products/generate', { count: parseInt(count) });
            fetchProducts();
        } catch (err) {
            alert('Ошибка генерации');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchId.trim();
        if (!query) return;

        try {
            const response = await api.get(`/api/products/search/${encodeURIComponent(query)}`);
            setSearchResults(response.data);
            setError(null);
        } catch (err) {
            setSearchResults([]); 
            setError('Товары не найдены');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить этот товар?')) {
            try {
                await api.delete(`/api/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
            } catch (err) {
                alert('Ошибка удаления');
            }
        }
    };

    if (loading) return <div style={styles.loading}>Загрузка...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <h1 style={styles.mainTitle}>Каталог товаров</h1>
                
                <div style={styles.actionGroup}>
                    {(isSeller || isAdmin) && (
                        <>
                            <button onClick={handleGenerateTestProducts} style={styles.secondaryBtn}>
                                🎲 Сгенерировать
                            </button>
                            <Link to="/products/new" style={{ textDecoration: 'none' }}>
                                <button style={styles.primaryBtn}>➕ Создать товар</button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Панель поиска */}
            <div style={styles.searchCard}>
                <form onSubmit={handleSearch} style={styles.searchForm}>
                    <div style={styles.inputWrapper}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="Поиск по названию или ID..."
                            style={styles.searchInput}
                        />
                    </div>
                    <button type="submit" style={styles.searchSubmitBtn}>Найти</button>
                    {searchResults && (
                        <button 
                            type="button" 
                            onClick={() => { setSearchId(''); setSearchResults(null); }}
                            style={styles.clearBtn}
                        >
                            ✕
                        </button>
                    )}
                </form>
            </div>

            {/* Результаты поиска */}
            {searchResults && (
                <div style={styles.resultsSection}>
                    <h3 style={styles.sectionTitle}>Найдено: {searchResults.length}</h3>
                    <div style={styles.grid}>
                        {searchResults.map(p => <ProductCard key={p.id} product={p} isAdmin={isAdmin} isSeller={isSeller} onDelete={handleDelete} />)}
                    </div>
                    <div style={styles.divider} />
                </div>
            )}

            <h2 style={styles.sectionTitle}>Все товары ({products.length})</h2>
            <div style={styles.grid}>
                {products.map(p => <ProductCard key={p.id} product={p} isAdmin={isAdmin} isSeller={isSeller} onDelete={handleDelete} />)}
            </div>
        </div>
    );
};

// Вынес карточку в отдельный мини-компонент для чистоты
const ProductCard = ({ product, isAdmin, isSeller, onDelete }) => (
    <div style={styles.card}>
        <div style={styles.imageBox}>
            {product.image ? (
                <img src={`http://localhost:8000${product.image}`} alt={product.name} style={styles.img} />
            ) : (
                <div style={styles.noImg}>📦</div>
            )}
            <div style={styles.priceTag}>{product.price} ₽</div>
        </div>
        <div style={styles.cardInfo}>
            <h3 style={styles.name}>{product.name}</h3>
            <code style={styles.idText}>{product.id}</code>
            <div style={styles.actions}>
                <Link to={`/products/${product.id}`} style={styles.viewLink}>Детали</Link>
                {(isSeller || isAdmin) && (
                    <Link to={`/products/${product.id}/edit`} style={styles.editLink}>Изм.</Link>
                )}
                {isAdmin && (
                    <button onClick={() => onDelete(product.id)} style={styles.delBtn}>Удалить</button>
                )}
            </div>
        </div>
    </div>
);

const styles = {
    container: { padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
    mainTitle: { fontSize: '32px', fontWeight: '800', color: '#1a1a1a', margin: 0 },
    actionGroup: { display: 'flex', gap: '12px' },
    
    // Кнопки
    primaryBtn: { backgroundColor: '#007AFF', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,122,255,0.2)' },
    secondaryBtn: { backgroundColor: '#fff', color: '#555', border: '1.5px solid #eee', padding: '12px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
    
    // Поиск
    searchCard: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 2px 15px rgba(0,0,0,0.04)', marginBottom: '40px' },
    searchForm: { display: 'flex', gap: '10px', alignItems: 'center' },
    inputWrapper: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
    searchIcon: { position: 'absolute', left: '15px', color: '#aaa' },
    searchInput: { width: '100%', padding: '12px 12px 12px 45px', borderRadius: '14px', border: '1px solid #f0f0f0', backgroundColor: '#f9f9f9', fontSize: '16px', outline: 'none' },
    searchSubmitBtn: { backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
    clearBtn: { backgroundColor: '#eee', color: '#666', border: 'none', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },

    // Сетка и Карточки
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' },
    card: { backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
    imageBox: { height: '180px', position: 'relative', backgroundColor: '#f5f5f7', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    noImg: { fontSize: '40px' },
    priceTag: { position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', color: '#007AFF', backdropFilter: 'blur(4px)' },
    cardInfo: { padding: '20px' },
    name: { margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700' },
    idText: { fontSize: '11px', color: '#aaa', backgroundColor: '#f4f4f4', padding: '2px 6px', borderRadius: '4px' },
    actions: { display: 'flex', gap: '8px', marginTop: '15px' },
    
    // Ссылки в карточке
    viewLink: { flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '10px', textDecoration: 'none', color: '#333', fontSize: '13px', fontWeight: '600' },
    editLink: { padding: '8px 12px', backgroundColor: '#eef6ff', borderRadius: '10px', textDecoration: 'none', color: '#007AFF', fontSize: '13px', fontWeight: '600' },
    delBtn: { padding: '8px 12px', backgroundColor: '#fff0f0', border: 'none', borderRadius: '10px', color: '#ff4d4f', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

    sectionTitle: { fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#333' },
    divider: { height: '1px', backgroundColor: '#eee', margin: '40px 0' },
    loading: { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#888' }
};

export default ProductList;