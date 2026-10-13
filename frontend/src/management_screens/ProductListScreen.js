import React, { useContext, useEffect, useMemo, useReducer, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import { getError } from '../utils';
import { toast } from 'react-toastify';
import { Badge, Button, Form, InputGroup } from 'react-bootstrap';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                products: action.payload.products,
                page: action.payload.page,
                pages: action.payload.pages,
                loading: false,
            };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'CREATE_REQUEST':
            return { ...state, loadingCreate: true };
        case 'CREATE_SUCCESS':
            return { ...state, loadingCreate: false };
        case 'CREATE_FAIL':
            return { ...state, loadingCreate: false };
        case 'DELETE_REQUEST':
            return { ...state, loadingDelete: true, successDelete: false };
        case 'DELETE_SUCCESS':
            return { ...state, loadingDelete: false, successDelete: true };
        case 'DELETE_FAIL':
            return { ...state, loadingDelete: false, successDelete: false };
        case 'DELETE_RESET':
            return { ...state, loadingDelete: false, successDelete: false };
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');

export default function ProductListScreen() {
    const [{ loading, error, products, page: pageNum, pages, loadingCreate, loadingDelete, successDelete }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
        products: [],
        page: 1,
        pages: 1,
    });

    const navigate = useNavigate();
    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const page = sp.get('page') || 1;

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('name');

    const { state } = useContext(Store);
    const { userInfo } = state;

    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const { data } = await axios.get(`/api/products/admin?page=${page}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        if (successDelete) {
            dispatch({ type: 'DELETE_RESET' });
        } else {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, userInfo, successDelete]);

    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category))].sort(),
        [products]
    );

    const visibleProducts = useMemo(() => {
        let list = [...products];
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.brand || '').toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q)
            );
        }
        if (category !== 'all') {
            list = list.filter((p) => p.category === category);
        }
        switch (sort) {
            case 'price-asc':
                list.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                list.sort((a, b) => b.price - a.price);
                break;
            case 'stock-asc':
                list.sort((a, b) => a.countInStock - b.countInStock);
                break;
            default:
                list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [products, query, category, sort]);

    const lowStockCount = products.filter((p) => p.countInStock <= 5).length;

    const createHandler = async () => {
        try {
            dispatch({ type: 'CREATE_REQUEST' });
            const { data } = await axios.post(
                '/api/products',
                {},
                {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                }
            );
            toast.success('Product created successfully');
            dispatch({ type: 'CREATE_SUCCESS' });
            navigate(`/admin/product/${data.product._id}`);
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'CREATE_FAIL' });
        }
    };

    const deleteHandler = async (product) => {
        if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
            try {
                await axios.delete(`/api/products/${product._id}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                toast.success('Product deleted successfully');
                dispatch({ type: 'DELETE_SUCCESS' });
            } catch (err) {
                toast.error(getError(err));
                dispatch({ type: 'DELETE_FAIL' });
            }
        }
    };

    const stockCell = (p) => {
        if (p.countInStock === 0) return <span className="product-stock out">Out of stock</span>;
        if (p.countInStock <= 5)
            return (
                <span>
                    <span className="product-stock low">Low</span> · {p.countInStock}
                </span>
            );
        return <span>{p.countInStock}</span>;
    };

    return (
        <div className="products-page">
            <nav className="product-breadcrumb">
                <span>Management / Products</span>
            </nav>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle mb-0">
                        Manage your store catalog, pricing and inventory.
                    </p>
                </div>
                <Button type="button" variant="primary" className="create-product-button" onClick={createHandler} disabled={loadingCreate}>
                    <i className="fas fa-plus me-1"></i> Create Product
                </Button>
            </div>

            {!loading && !error && products.length > 0 && (
                <div className="admin-stats">
                    {products.length} products on this page · {categories.length} categories ·{' '}
                    {lowStockCount} low stock
                </div>
            )}

            <div className="admin-toolbar">
                <InputGroup className="admin-search">
                    <InputGroup.Text>
                        <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                        type="search"
                        placeholder="Search products..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search products"
                    />
                </InputGroup>
                <Form.Select
                    className="admin-filter"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter by category">
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </Form.Select>
                <Form.Select
                    className="admin-filter"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort products">
                    <option value="name">Sort: Name A-Z</option>
                    <option value="price-asc">Sort: Price low to high</option>
                    <option value="price-desc">Sort: Price high to low</option>
                    <option value="stock-asc">Sort: Stock low to high</option>
                </Form.Select>
            </div>

            {loading ? (
                <div className="dashboard-card">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="d-flex gap-3 mb-3">
                            <div className="skeleton" style={{ width: 48, height: 48 }} />
                            <div className="skeleton flex-grow-1" style={{ height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 70, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 90, height: 20, alignSelf: 'center' }} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="dashboard-card">
                    <div className="auth-error" role="alert">Unable to load products. {error}</div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            ) : products.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No products yet</h2>
                    <p className="page-subtitle">Create your first product to start building your catalog.</p>
                    <Button variant="primary" onClick={createHandler}>
                        <i className="fas fa-plus me-1"></i> Create Product
                    </Button>
                </div>
            ) : visibleProducts.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No products found</h2>
                    <p className="page-subtitle">Try changing your search or filters.</p>
                    <Button
                        variant="outline-primary"
                        onClick={() => {
                            setQuery('');
                            setCategory('all');
                        }}>
                        Clear filters
                    </Button>
                </div>
            ) : (
                <>
                    <div className="dashboard-card p-0 table-responsive">
                        <table className="table product-table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th className="text-end">Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleProducts.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="product-thumb"
                                                />
                                                <div>
                                                    <Link
                                                        to={`/admin/product/${product._id}`}
                                                        className="cart-item-name">
                                                        {product.name}
                                                    </Link>
                                                    <div className="cart-item-variant">
                                                        {product.category} · {product.brand}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-end price-column">{money(product.price)}</td>
                                        <td>{stockCell(product)}</td>
                                        <td>
                                            {product.countInStock === 0 ? (
                                                <Badge bg="secondary">Out of stock</Badge>
                                            ) : (
                                                <Badge bg="success">Active</Badge>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            <Button
                                                type="button"
                                                variant="light"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => navigate(`/admin/product/${product._id}`)}>
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="light"
                                                size="sm"
                                                className="row-delete"
                                                title={product._id}
                                                onClick={() => deleteHandler(product)}>
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
                        <span className="text-muted small">
                            {pages <= 1
                                ? `Showing ${visibleProducts.length} of ${products.length} products`
                                : `Page ${pageNum} of ${pages} · ${visibleProducts.length} products on this page`}
                        </span>
                        {pages > 1 && (
                            <div>
                                {[...Array(pages).keys()].map((x) => (
                                    <Link
                                        className={x + 1 === Number(page) ? 'btn text-bold' : 'btn'}
                                        key={x + 1}
                                        to={`/admin/products?page=${x + 1}`}>
                                        {x + 1}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
