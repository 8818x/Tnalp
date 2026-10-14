import React, { useContext, useEffect, useReducer } from "react";
import { Helmet } from 'react-helmet-async';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getError } from "../utils";

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, orders: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const paymentBadge = (o) => {
    if (o.isPaid) return <Badge bg="success">Paid</Badge>;
    if (o.isUploaded) return (
        <Badge bg="warning" text="dark">
            Slip uploaded
        </Badge>
    );
    return <Badge bg="secondary">Pending</Badge>;
};

const statusBadge = (o) => {
    if (o.isCanceled) return <Badge bg="danger">Cancelled</Badge>;
    if (o.isDelivered) return <Badge bg="success">Delivered</Badge>;
    return <Badge bg="info">Processing</Badge>;
};

export default function OrderHistoryScreen() {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const navigate = useNavigate();

    const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
        orders: [],
    });
    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const { data } = await axios.get(
                    `/api/orders/myorders`,
                    { headers: { Authorization: `Bearer ${userInfo.token}` } }
                );
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
    }, [userInfo]);

    return (
        <div className="order-history-page">
            <Helmet>
                <title>Order History</title>
            </Helmet>
            <h1 className="page-title">Order History</h1>
            <p className="page-subtitle">View your past purchases and delivery status.</p>

            {loading ? (
                <div className="dashboard-card">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="d-flex gap-3 mb-3">
                            <div className="skeleton" style={{ width: 90, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton flex-grow-1" style={{ height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 90, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 100, height: 20, alignSelf: 'center' }} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="dashboard-card">
                    <div className="auth-error" role="alert">Unable to load your orders. {error}</div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No orders yet</h2>
                    <p className="page-subtitle">
                        Your purchases will appear here after you place your first order.
                    </p>
                    <Button variant="primary" as={Link} to="/">
                        Continue Shopping
                    </Button>
                </div>
            ) : (
                <div className="dashboard-card p-0 table-responsive">
                    <table className="table product-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th className="text-end">Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th className="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <Link to={`/order/${order._id}`} className="cart-item-name" title={order._id}>
                                            #{order._id.slice(-6)}
                                        </Link>
                                    </td>
                                    <td>{fullDate(order.createdAt)}</td>
                                    <td>
                                        {order.orderItems.reduce((a, c) => a + c.quantity, 0)}{' '}
                                        item{order.orderItems.reduce((a, c) => a + c.quantity, 0) === 1 ? '' : 's'}
                                    </td>
                                    <td className="text-end price-column">{money(order.totalPrice)}</td>
                                    <td>{paymentBadge(order)}</td>
                                    <td>{statusBadge(order)}</td>
                                    <td className="text-end">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => navigate(`/order/${order._id}`)}>
                                            View Order
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
