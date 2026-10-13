import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Store } from '../Store';
import { getError } from '../utils';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'UPDATE_REQUEST':
            return { ...state, loadingUpdate: true };
        case 'UPDATE_SUCCESS':
            return { ...state, loadingUpdate: false };
        case 'UPDATE_FAIL':
            return { ...state, loadingUpdate: false };
        case 'UPLOAD_REQUEST':
            return { ...state, loadingUpload: true, errorUpload: '' };
        case 'UPLOAD_SUCCESS':
            return { ...state, loadingUpload: false, errorUpload: '' };
        case 'UPLOAD_FAIL':
            return { ...state, loadingUpload: false, errorUpload: action.payload };
        case 'DELETE_REQUEST':
            return { ...state, loadingDelete: true };
        case 'DELETE_SUCCESS':
        case 'DELETE_FAIL':
            return { ...state, loadingDelete: false };
        default:
            return state;
    }
};

const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

export default function ProductEditScreen() {
    const navigate = useNavigate();
    const params = useParams();
    const { id: productId } = params;
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [{ loading, error, loadingUpdate, loadingUpload, loadingDelete }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
    });

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [countInStock, setCountInStock] = useState('');
    const [brand, setBrand] = useState('');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});

    const initialRef = useRef('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const [{ data: product }, { data: cats }] = await Promise.all([
                    axios.get(`/api/products/${productId}`),
                    axios.get('/api/products/categories'),
                ]);
                setName(product.name);
                setSlug(product.slug);
                setPrice(product.price);
                setImage(product.image);
                setCategory(product.category);
                setCountInStock(product.countInStock);
                setBrand(product.brand);
                setDescription(product.description);
                setCategories([...new Set([...cats, product.category])].sort());
                initialRef.current = JSON.stringify({
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    countInStock: product.countInStock,
                    brand: product.brand,
                    description: product.description,
                });
                dispatch({ type: 'FETCH_SUCCESS' });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
    }, [productId]);

    const current = { name, slug, price, image, category, countInStock, brand, description };
    const isDirty = !loading && initialRef.current !== '' && initialRef.current !== JSON.stringify(current);

    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const leaveWithoutSaving = (target) => {
        if (!isDirty || window.confirm('You have unsaved changes. Leave without saving?')) {
            navigate(target);
        }
    };

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Product name is required.';
        if (price === '' || Number(price) <= 0) errs.price = 'Price must be greater than 0.';
        if (countInStock === '' || Number(countInStock) < 0 || !Number.isInteger(Number(countInStock)))
            errs.stock = 'Stock must be a whole number, 0 or greater.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            dispatch({ type: 'UPDATE_REQUEST' });
            await axios.put(
                `/api/products/${productId}`,
                {
                    _id: productId,
                    name,
                    slug,
                    price,
                    image,
                    category,
                    brand,
                    countInStock,
                    description,
                },
                {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'UPDATE_SUCCESS' });
            toast.success('Changes saved');
            navigate('/admin/products');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPDATE_FAIL' });
        }
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!okTypes.includes(file.type)) {
            toast.error('File must be JPG, PNG or WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Maximum file size is 5 MB.');
            return;
        }
        const bodyFormData = new FormData();
        bodyFormData.append('file', file);
        try {
            dispatch({ type: 'UPLOAD_REQUEST' });
            const { data } = await axios.post('/api/upload', bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    authorization: `Bearer ${userInfo.token}`,
                },
            });
            dispatch({ type: 'UPLOAD_SUCCESS' });
            toast.success('Image uploaded successfully');
            setImage(data.secure_url);
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
        }
    };

    const deleteHandler = async () => {
        if (window.confirm('Delete this product permanently? This cannot be undone.')) {
            try {
                dispatch({ type: 'DELETE_REQUEST' });
                await axios.delete(`/api/products/${productId}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                toast.success('Product deleted successfully');
                navigate('/admin/products');
            } catch (err) {
                toast.error(getError(err));
                dispatch({ type: 'DELETE_FAIL' });
            }
        }
    };

    return (
        <div className="edit-product-page">
            <Helmet>
                <title>Edit Product</title>
            </Helmet>
            <nav className="product-breadcrumb">
                <Link to="/admin/products">Products</Link>
                {' / '}
                <span>Edit Product</span>
            </nav>

            {loading ? (
                <LoadingBox></LoadingBox>
            ) : error ? (
                <MessageBox variant="danger">{error}</MessageBox>
            ) : (
                <>
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                        <div>
                            <h1 className="page-title mb-0">Edit Product</h1>
                            <p className="page-subtitle mb-0">{name}</p>
                        </div>
                        <Link className="btn btn-outline-primary" to={`/product/${slug}`}>
                            <i className="fas fa-eye me-1"></i> Preview Product
                        </Link>
                    </div>

                    <Form onSubmit={submitHandler} noValidate>
                        <div className="product-form-layout">
                            <div className="d-flex flex-column gap-3">
                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title">Basic Information</h2>
                                    <Form.Group className="mb-3" controlId="name">
                                        <Form.Label>Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            isInvalid={!!fieldErrors.name}
                                            required
                                        />
                                        {fieldErrors.name && (
                                            <div className="pw-mismatch" role="alert">{fieldErrors.name}</div>
                                        )}
                                    </Form.Group>
                                    <Form.Group className="mb-2" controlId="slug">
                                        <Form.Label>Slug</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                            />
                                            <Button
                                                variant="light"
                                                type="button"
                                                title="Regenerate from name"
                                                onClick={() => setSlug(slugify(name))}>
                                                <i className="fas fa-magic"></i>
                                            </Button>
                                        </InputGroup>
                                        <div className="text-muted small mt-1">Used in the product URL.</div>
                                    </Form.Group>
                                    <Form.Group controlId="description">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                        <div className="text-muted small mt-1">Shown on the product detail page.</div>
                                    </Form.Group>
                                </div>

                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title">Pricing &amp; Inventory</h2>
                                    <Form.Group className="mb-3" controlId="price">
                                        <Form.Label>Price *</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>฿</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                isInvalid={!!fieldErrors.price}
                                                required
                                            />
                                        </InputGroup>
                                        {fieldErrors.price && (
                                            <div className="pw-mismatch" role="alert">{fieldErrors.price}</div>
                                        )}
                                    </Form.Group>
                                    <Form.Group controlId="countInStock">
                                        <Form.Label>Stock Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={countInStock}
                                            onChange={(e) => setCountInStock(e.target.value)}
                                            isInvalid={!!fieldErrors.stock}
                                            required
                                        />
                                        {fieldErrors.stock && (
                                            <div className="pw-mismatch" role="alert">{fieldErrors.stock}</div>
                                        )}
                                        <div className="text-muted small mt-1">
                                            Number of units currently available.
                                        </div>
                                    </Form.Group>
                                </div>

                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title">Organization</h2>
                                    <Form.Group className="mb-3" controlId="category">
                                        <Form.Label>Category *</Form.Label>
                                        <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                                            {categories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group controlId="brand">
                                        <Form.Label>Brand</Form.Label>
                                        <Form.Select value={brand} onChange={(e) => setBrand(e.target.value)}>
                                            {[...new Set([brand, 'Tnalp'])].filter(Boolean).map((b) => (
                                                <option key={b} value={b}>
                                                    {b}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </div>

                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title text-danger">Danger Zone</h2>
                                    <p className="page-subtitle mb-2">
                                        Permanently remove this product from the catalog.
                                    </p>
                                    <Button variant="outline-danger" onClick={deleteHandler} disabled={loadingDelete}>
                                        Delete Product
                                    </Button>
                                </div>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title">Product Image</h2>
                                    <div className="text-center mb-3">
                                        <img
                                            src={image}
                                            alt="Current product"
                                            className="img-fluid rounded"
                                            style={{ maxHeight: 220 }}
                                        />
                                    </div>
                                    <Form.Group controlId="imageFile">
                                        <Form.Control type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadFileHandler} />
                                    </Form.Group>
                                    {loadingUpload && <LoadingBox></LoadingBox>}
                                    <div className="text-muted small mt-2">
                                        PNG, JPG or WebP. Max 5 MB. Saved instantly after upload.
                                    </div>
                                </div>

                                <div className="dashboard-card">
                                    <div className="d-grid gap-2">
                                        <Button variant="light" type="button" onClick={() => leaveWithoutSaving('/admin/products')}>
                                            Cancel
                                        </Button>
                                        <Button variant="primary" type="submit" className="btn-cta" disabled={loadingUpdate}>
                                            {loadingUpdate ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                    </div>
                                    <div className="text-muted small mt-2 text-center">
                                        {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-muted small mt-2">* Required fields</div>
                    </Form>
                </>
            )}
        </div>
    );
}
