import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: ''
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [deleteImage, setDeleteImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isEdit = !!id;

    useEffect(() => {
        if (isEdit) {
            const fetchProduct = async () => {
                try {
                    const response = await api.get(`/api/products/${id}`);
                    setFormData({
                        name: response.data.name,
                        price: response.data.price,
                        description: response.data.description || ''
                    });
                    if (response.data.image) {
                        setImagePreview(`http://localhost:8000${response.data.image}`);
                    }
                } catch (err) {
                    setError('Ошибка загрузки товара');
                }
            };
            fetchProduct();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setDeleteImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        setDeleteImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('price', formData.price);
            data.append('description', formData.description);
            
            if (image) {
                data.append('image', image);
            }
            
            if (deleteImage) {
                data.append('deleteImage', 'true');
            }

            if (isEdit) {
                await api.put(`/api/products/${id}`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await api.post('/api/products', data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            navigate('/products');
        } catch (err) {
            setError('Ошибка сохранения товара');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1>{isEdit ? 'Редактирование товара' : 'Создание товара'}</h1>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label>Название:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Цена:</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        step="0.01"
                        style={styles.input}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Описание:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        style={styles.input}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Изображение:</label>
                    
                    {imagePreview && (
                        <div style={styles.imagePreview}>
                            <img src={imagePreview} alt="Preview" style={styles.previewImage} />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                style={styles.removeButton}
                            >
                                ✕ Удалить
                            </button>
                        </div>
                    )}
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                        style={styles.fileInput}
                    />
                </div>

                <div style={styles.buttons}>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={styles.submitButton}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => navigate('/products')}
                        style={styles.cancelButton}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
    formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '10px', fontSize: '16px' },
    error: { color: 'red', marginBottom: '10px' },
    imagePreview: {
        position: 'relative',
        display: 'inline-block',
        marginBottom: '10px',
    },
    previewImage: {
        maxWidth: '200px',
        maxHeight: '200px',
        borderRadius: '8px',
        border: '1px solid #ddd',
    },
    removeButton: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    fileInput: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px' },
    buttons: { display: 'flex', gap: '10px', marginTop: '20px' },
    submitButton: {
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
};

export default ProductForm;