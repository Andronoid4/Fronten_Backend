import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/api/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('Ошибка загрузки товара');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Удалить этот товар?')) {
            try {
                await api.delete(`/api/products/${id}`);
                navigate('/products');
            } catch (err) {
                alert('Ошибка удаления товара');
            }
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;
    if (!product) return <div>Товар не найден</div>;

    return (
        <div style={styles.container}>
            <h1>{product.name}</h1>
            
            {product.image ? (
                <img 
                    src={`http://localhost:8000${product.image}`} 
                    alt={product.name} 
                />
            ) : (
                <div style={styles.noImage}>Нет изображения</div>
            )}
            
            <p><strong>ID:</strong> {product.id}</p>
            <p><strong>Цена:</strong> ${product.price}</p>
            <p><strong>Описание:</strong> {product.description}</p>
            
            <div style={styles.buttons}>
                <Link to={`/products/${id}/edit`}>
                    <button style={styles.button}>Редактировать</button>
                </Link>
                <button onClick={handleDelete} style={{ ...styles.button, backgroundColor: '#ff4444' }}>
                    Удалить
                </button>
                <Link to="/products">
                    <button style={{ ...styles.button, backgroundColor: '#f5f5f5', color: '#333' }}>
                        Назад к списку
                    </button>
                </Link>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    image: {
        maxWidth: '100%',
        maxHeight: '400px',
        borderRadius: '8px',
        margin: '20px 0',
    },
    noImage: {
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#999',
        borderRadius: '8px',
        margin: '20px 0',
    },
    buttons: { display: 'flex', gap: '10px', marginTop: '20px' },
    button: {
        padding: '10px 20px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
};

export default ProductDetail;