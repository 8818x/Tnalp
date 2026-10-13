import axios from 'axios';
import React, { useContext, useEffect, useMemo, useReducer, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import { getError } from '../utils';
import { toast } from 'react-toastify';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, orders: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'DELETE_REQUEST':
            return { ...state, loadingDelete: true, successDelete: false };
        case 'DELETE_SUCCESS':
            return { ...state, loadingDelete: false, successDelete: true };
        case 'DELETE_FAIL':
            return { ...state, loadingDelete: false };
        case 'DELETE_RESET':
            return { ...state, loadingDelete: false, successDelete: false };
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const paymentOf = (o) =>
    o.isCanceled ? 'Canceled' : o.isPaid ? 'Paid' : o.isUploaded ? 'Slip uploaded' : 'Pending';

const fulfillmentOf = (o) => (o.isCanceled ? 'Canceled' : o.isDelivered ? 'Delivered' : 'Unfulfilled');

const paymentBadge = (o) => {
    const p = paymentOf(o);
    if (p === 'Paid') return <Badge bg="success">Paid</Badge>;
    if (p === 'Slip uploaded')
        return (
            <Badge bg="warning" text="dark">
                Slip uploaded
            </Badge>
        );
    if (p === 'Canceled') return <Badge bg="danger">Canceled</Badge>;
    return <Badge bg="secondary">Pending</Badge>;
};

const fulfillmentBadge = (o) => {
    const f = fulfillmentOf(o);
    if (f === 'Delivered') return <Badge bg="success">Delivered</Badge>;
    if (f === 'Canceled') return <Badge bg="danger">Canceled</Badge>;
    return <Badge bg="secondary">Unfulfilled</Badge>;
};

export default function OrderListScreen() {
    const navigate = useNavigate();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [{ loading, error, orders, loadingDelete, successDelete }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
        orders: [],
    });

    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [payment, setPayment] = useState('all');
    const [range, setRange] = useState('all');
    const [sort, setSort] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const { data } = await axios.get(`/api/orders`, {
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
    }, [userInfo, successDelete]);

    const deleteHandler = async (order) => {
        if (window.confirm(`Delete order #${order._id.slice(-6)}? This action cannot be undone.`)) {
            try {
                dispatch({ type: 'DELETE_REQUEST' });
                await axios.delete(`/api/orders/${order._id}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                toast.success('Order deleted successfully');
                dispatch({ type: 'DELETE_SUCCESS' });
            } catch (err) {
                toast.error(getError(err));
                dispatch({ type: 'DELETE_FAIL' });
            }
        }
    };

    const summary = useMemo(() => {
        const s = { total: orders.length, pending: 0, paid: 0, delivered: 0 };
        orders.forEach((o) => {
            if (paymentOf(o) === 'Pending') s.pending += 1;
            if (paymentOf(o) === 'Paid') s.paid += 1;
            if (fulfillmentOf(o) === 'Delivered') s.delivered += 1;
        });
        return s;
    }, [orders]);

    const visibleOrders = useMemo(() => {
        let list = [...orders];
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (o) => o._id.toLowerCase().includes(q) || (o.user?.name || '').toLowerCase().includes(q)
            );
        }
        if (status !== 'all') {
            list = list.filter((o) => {
                if (status === 'pending') return paymentOf(o) === 'Pending';
                if (status === 'uploaded') return paymentOf(o) === 'Slip uploaded';
                if (status === 'paid') return paymentOf(o) === 'Paid';
                return fulfillmentOf(o) === 'Delivered';
            });
        }
        if (payment !== 'all') {
            list = list.filter((o) => paymentOf(o) === payment);
        }
        if (range !== 'all') {
            const cutoff = Date.now() - Number(range) * 24 * 60 * 60 * 1000;
            list = list.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
        }
        switch (sort) {
            case 'oldest':
                list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'total-desc':
                list.sort((a, b) => b.totalPrice - a.totalPrice);
                break;
            case 'total-asc':
                list.sort((a, b) => a.totalPrice - b.totalPrice);
                break;
            default:
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return list;
    }, [orders, query, status, payment, range, sort]);

    return (
        <div className="products-page">
            <nav className="product-breadcrumb">
                <span>Management / Orders</span>
            </nav>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">Manage customer orders, payments and fulfillment.</p>

            {!loading && !error && orders.length > 0 && (
                <div className="admin-stats">
                    {summary.total} {summary.total === 1 ? 'order' : 'orders'} · {summary.pending} pending ·{' '}
                    {summary.paid} paid · {summary.delivered} delivered
                </div>
            )}

            <div className="admin-toolbar">
                <InputGroup className="admin-search">
                    <InputGroup.Text>
                        <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                        type="search"
                        placeholder="Search orders..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search orders"
                    />
                </InputGroup>
                <Form.Select className="admin-filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="uploaded">Slip uploaded</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                </Form.Select>
                <Form.Select className="admin-filter" value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Filter by payment">
                    <option value="all">All Payments</option>
                    <option value="Paid">Paid</option>
                    <option value="Slip uploaded">Slip uploaded</option>
                    <option value="Pending">Pending</option>
                    <option value="Canceled">Canceled</option>
                </Form.Select>
                <Form.Select className="admin-filter" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Filter by date range">
                    <option value="all">All Time</option>
                    <option value="1">Today</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                </Form.Select>
                <Form.Select className="admin-filter" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort orders">
                    <option value="newest">Sort: Newest first</option>
                    <option value="oldest">Sort: Oldest first</option>
                    <option value="total-desc">Sort: Total high to low</option>
                    <option value="total-asc">Sort: Total low to high</option>
                </Form.Select>
            </div>

            {loading ? (
                <div className="dashboard-card">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="d-flex gap-3 mb-3">
                            <div className="skeleton" style={{ width: 90, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton flex-grow-1" style={{ height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 110, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 80, height: 20, alignSelf: 'center' }} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="dashboard-card">
                    <div className="auth-error" role="alert">Unable to load orders. {error}</div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No orders yet</h2>
                    <p className="page-subtitle">Orders will appear here after customers complete checkout.</p>
                </div>
            ) : visibleOrders.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No orders found</h2>
                    <p className="page-subtitle">Try changing your search or filters.</p>
                    <Button
                        variant="outline-primary"
                        onClick={() => {
                            setQuery('');
                            setStatus('all');
                            setPayment('all');
                            setRange('all');
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
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th className="text-end">Total</th>
                                    <th>Payment</th>
                                    <th>Fulfillment</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            <Link to={`/order/${order._id}`} className="cart-item-name" title={order._id}>
                                                #{order._id.slice(-6)}
                                            </Link>
                                        </td>
                                        <td>
                                            {order.user ? (
                                                order.user.name
                                            ) : (
                                                <>
                                                    <span className="text-muted">Deleted account</span>
                                                    <div className="cart-item-variant">Order data retained</div>
                                                </>
                                            )}
                                        </td>
                                        <td>{fullDate(order.createdAt)}</td>
                                        <td className="text-end price-column">{money(order.totalPrice)}</td>
                                        <td>{paymentBadge(order)}</td>
                                        <td>{fulfillmentBadge(order)}</td>
                                        <td className="text-end">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                onClick={() => navigate(`/order/${order._id}`)}>
                                                View Details
                                            </Button>{' '}
                                            <Button
                                                type="button"
                                                variant="light"
                                                size="sm"
                                                className="row-delete"
                                                title={order._id}
                                                onClick={() => deleteHandler(order)}>
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3">
                        <span className="text-muted small">
                            Showing {visibleOrders.length} of {orders.length}{' '}
                            {orders.length === 1 ? 'order' : 'orders'}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
