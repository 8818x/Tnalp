import React, { useContext, useEffect, useReducer, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/esm/Button";
import Col from "react-bootstrap/esm/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/esm/Row";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import { Store } from "../Store";
import { getError } from "../utils";
import axios from "axios";

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, order: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'PAY_REQUEST':
            return { ...state, loadingPay: true };
        case 'PAY_SUCCESS':
            return { ...state, loadingPay: false, successPay: true };
        case 'PAY_FAIL':
            return { ...state, loadingPay: false };
        case 'PAY_RESET':
            return { ...state, loadingPay: false, successPay: false };
        case 'DELIVER_REQUEST':
            return { ...state, loadingDeliver: true };
        case 'DELIVER_SUCCESS':
            return { ...state, loadingDeliver: false, successDeliver: true };
        case 'DELIVER_FAIL':
            return { ...state, loadingDeliver: false };
        case 'DELIVER_RESET':
            return { ...state, loadingDeliver: false, successDeliver: false };
        case 'CANCEL_REQUEST':
            return { ...state, loadingCancel: true };
        case 'CANCEL_SUCCESS':
            return { ...state, loadingCancel: false, successCancel: true };
        case 'CANCEL_FAIL':
            return { ...state, loadingCancel: false };
        case 'CANCEL_RESET':
            return { ...state, loadingCancel: false, successCancel: false };
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
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrderScreen() {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const navigate = useNavigate();
    const params = useParams();
    const { id: orderId } = params;

    const [
        {
            loading,
            error,
            order,
            successPay,
            loadingPay,
            successDeliver,
            loadingDeliver,
            successCancel,
            loadingCancel,
            loadingUpdate,
            loadingUpload,
        },
        dispatch,
    ] = useReducer(reducer, {
        loading: true,
        order: {},
        error: '',
        successPay: false,
        loadingPay: false,
    });

    const [imageUploaded, setImage] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const { data } = await axios.get(`/api/orders/${orderId}`, {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                });
                setImage(data.imageUploaded);
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH__FAIL', payload: getError(err) });
            }
        };
        if (!userInfo) {
            return navigate('/signin');
        }
        if (!order._id || successPay || successDeliver || successCancel || loadingUpdate || (order._id && order._id !== orderId)) {
            fetchOrder();
        }
        if (successPay) {
            dispatch({ type: 'PAY_RESET' });
        }
        if (successDeliver) {
            dispatch({ type: 'DELIVER_RESET' });
        }
        if (successCancel) {
            dispatch({ type: 'CANCEL_RESET' });
        }
    }, [order, userInfo, orderId, navigate, successPay, successDeliver, successCancel, loadingUpdate]);

    async function paymentHandler() {
        try {
            dispatch({ type: 'PAY_REQUEST' });
            const { data } = await axios.put(
                `/api/orders/${order._id}/pay`,
                {},
                {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'PAY_SUCCESS', payload: data });
            toast.success('Paid Successfully');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'PAY_FAIL' });
        }
    }

    async function cancelHandler() {
        if (!window.confirm(`Cancel this order?\n\nOrder #${order._id.slice(-6)} will be cancelled.`)) return;
        try {
            dispatch({ type: 'CANCEL_REQUEST' });
            const { data } = await axios.put(
                `/api/orders/${order._id}/cancel`,
                {},
                {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'CANCEL_SUCCESS', payload: data });
            toast.success('Order cancelled');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'CANCEL_FAIL' });
        }
    }

    async function deliverOrderHandler() {
        try {
            dispatch({ type: 'DELIVER_REQUEST' });
            const { data } = await axios.put(
                `/api/orders/${order._id}/deliver`,
                {},
                {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'DELIVER_SUCCESS', payload: data });
            toast.success('Order is delivered');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'DELIVER_FAIL' });
        }
    }

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
            setImage(data.secure_url);
            toast.success('Slip uploaded. Press Submit Proof to send it.');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            dispatch({ type: 'UPDATE_REQUEST' });
            await axios.put(
                `/api/orders/${orderId}/upload`,
                {
                    _id: orderId,
                    imageUploaded,
                },
                {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'UPDATE_SUCCESS' });
            toast.success('Payment proof submitted. Waiting for verification.');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPDATE_FAIL' });
        }
    };

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error('Copy failed');
        }
    };

    const paymentLabel = order.isCanceled
        ? 'Cancelled'
        : order.isPaid
            ? 'Paid'
            : order.isUploaded
                ? 'Proof Submitted'
                : 'Payment Pending';

    const paymentBg = order.isCanceled ? 'danger' : order.isPaid ? 'success' : 'warning';

    const fulfillmentLabel = order.isCanceled
        ? 'Cancelled'
        : order.isDelivered
            ? 'Delivered'
            : 'Processing';

    const fulfillmentBg = order.isCanceled ? 'danger' : order.isDelivered ? 'success' : 'info';

    const cancellable = !order.isCanceled && !order.isPaid && !order.isDelivered;

    const timeline = [
        { date: order.createdAt, label: 'Order placed', done: true },
        !order.isCanceled && !order.isPaid && { date: null, label: 'Awaiting payment', done: false },
        order.isUploaded && { date: order.uploadedAt, label: 'Payment proof submitted', done: true },
        order.isPaid && { date: order.paidAt, label: 'Payment confirmed', done: true },
        order.isCanceled && { date: order.canceledAt, label: 'Order cancelled', done: true },
        !order.isCanceled && !order.isDelivered && { date: null, label: 'Not shipped yet', done: false },
        order.isDelivered && { date: order.deliveredAt, label: 'Delivered', done: true },
    ].filter(Boolean);

    return loading ? (
        <div className="order-page">
            <div className="dashboard-card">
                <div className="skeleton" style={{ height: 24, width: '30%' }} />
                <div className="skeleton mt-3" style={{ height: 120 }} />
                <div className="skeleton mt-3" style={{ height: 160 }} />
            </div>
        </div>
    ) : error ? (
        <div className="order-page">
            <div className="dashboard-card">
                <div className="auth-error" role="alert">Unable to load order details. {error}</div>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.location.reload()}>
                    Try again
                </button>
            </div>
        </div>
    ) : (
        <div className="order-page">
            <Helmet>
                <title>Order #{order._id?.slice(-6)}</title>
            </Helmet>
            <nav className="product-breadcrumb">
                <Link to="/orderhistory">Orders</Link>
                {' / '}
                <span>#{order._id.slice(-6)}</span>
            </nav>

            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                    <h1 className="page-title mb-0">Order #{order._id.slice(-6)}</h1>
                    <p className="page-subtitle mb-0">Placed on {fullDate(order.createdAt)}</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Badge bg={paymentBg}>{paymentLabel}</Badge>
                    <Badge bg={fulfillmentBg}>{fulfillmentLabel}</Badge>
                </div>
            </div>

            <Row className="g-4 mt-1">
                <Col lg={7}>
                    <div className="d-flex flex-column gap-3">
                        <div className="dashboard-card">
                            <h2 className="dashboard-card-title">Shipping Address</h2>
                            <div className="order-address">
                                <div>{order.shippingAddress.fullName}</div>
                                <div>{order.shippingAddress.address}</div>
                                <div>
                                    {order.shippingAddress.district}, {order.shippingAddress.province}{' '}
                                    {order.shippingAddress.postalCode}
                                </div>
                                <div className="text-muted small">{order.shippingAddress.phoneNumber}</div>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <h2 className="dashboard-card-title">Items</h2>
                            {order.orderItems.map((item) => (
                                <div className="recent-order-row" key={item._id}>
                                    <div className="d-flex align-items-center gap-3">
                                        <img src={item.image} alt={item.name} className="product-thumb" />
                                        <div>
                                            <Link to={`/product/${item.slug}`} className="cart-item-name">
                                                {item.name}
                                            </Link>
                                            <div className="cart-item-variant">
                                                Qty {item.quantity} · {money(item.price)} each
                                            </div>
                                        </div>
                                    </div>
                                    <span className="price-column">{money(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-card">
                            <h2 className="dashboard-card-title">Payment</h2>
                            <div className="summary-row">
                                <span className="text-muted">Method</span>
                                <span>{order.paymentMethod}</span>
                            </div>
                            <div className="summary-row">
                                <span className="text-muted">Status</span>
                                <span>{paymentLabel}</span>
                            </div>
                            <div className="summary-row">
                                <span className="text-muted">Amount</span>
                                <span className="price-column">{money(order.totalPrice)}</span>
                            </div>

                            {!order.isPaid && !order.isCanceled && (
                                <>
                                    <hr className="soft-divider" />
                                    <div className="text-center">
                                        <div className="text-muted small mb-1">Amount to pay</div>
                                        <div className="product-price-lg mb-2">{money(order.totalPrice)}</div>
                                        <div className="text-muted small mb-2">Scan with your banking app</div>
                                        <img
                                            src="/images/qrcode.png"
                                            alt="PromptPay QR code for this order"
                                            className="img-fluid center-image"
                                            style={{ maxWidth: 220 }}
                                        />
                                    </div>
                                    <hr className="soft-divider" />
                                    <div className="summary-row">
                                        <span className="text-muted">PromptPay number</span>
                                        <span>
                                            012-345-6789{' '}
                                            <Button
                                                variant="light"
                                                size="sm"
                                                type="button"
                                                onClick={() => copyText('0123456789', 'PromptPay number')}>
                                                Copy
                                            </Button>
                                        </span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="text-muted">Account name</span>
                                        <span>Example Example</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {userInfo.isAdmin && order.isUploaded && (
                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title">Payment Proof</h2>
                                <img src={order.imageUploaded} alt="Payment slip" className="img-fluid rounded" />
                                <div className="text-muted small mt-2">
                                    Uploaded {order.uploadedAt ? fullDate(order.uploadedAt) : ''}
                                </div>
                            </div>
                        )}

                        {!order.isCanceled && !order.isPaid && userInfo && (
                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title">Payment Proof</h2>
                                <p className="page-subtitle mb-2">Upload your transfer slip after payment.</p>
                                {order.isUploaded ? (
                                    <div className="profile-success" role="status">
                                        Payment proof submitted. Waiting for verification.
                                    </div>
                                ) : (
                                    <Form onSubmit={submitHandler}>
                                        <Form.Group controlId="slipFile" className="mb-2">
                                            <Form.Label>Transfer slip</Form.Label>
                                            <Form.Control type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadFileHandler} />
                                        </Form.Group>
                                        {loadingUpload && <LoadingBox></LoadingBox>}
                                        {imageUploaded && (
                                            <div className="mb-2">
                                                <img src={imageUploaded} alt="Uploaded slip" className="img-fluid rounded" style={{ maxHeight: 200 }} />
                                            </div>
                                        )}
                                        <div className="text-muted small mb-2">JPG, PNG or WebP. Max 5 MB.</div>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="btn-cta"
                                            disabled={!imageUploaded || loadingUpdate}>
                                            {loadingUpdate ? 'Submitting…' : 'Submit Proof'}
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        )}

                        <div className="dashboard-card">
                            <h2 className="dashboard-card-title">Order Timeline</h2>
                            {timeline.map((t, i) => (
                                <div className="recent-order-row" key={i}>
                                    <span>{t.label}</span>
                                    <span className={t.done ? 'review-date' : 'cart-item-variant'}>
                                        {t.date ? fullDate(t.date) : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Col>

                <Col lg={5}>
                    <div className="dashboard-card order-summary">
                        <h2 className="dashboard-card-title">Order Summary</h2>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{money(order.itemsPrice)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>{order.shippingPrice === 0 ? 'Free' : money(order.shippingPrice)}</span>
                        </div>
                        <hr className="soft-divider" />
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>{money(order.totalPrice)}</span>
                        </div>

                        {userInfo.isAdmin && order.isUploaded && !order.isPaid && !order.isDelivered && !order.isCanceled && (
                            <div className="d-grid mt-3">
                                {loadingPay && <LoadingBox></LoadingBox>}
                                <Button type="button" onClick={paymentHandler} className="btn-cta">
                                    Mark as Paid
                                </Button>
                            </div>
                        )}
                        {userInfo.isAdmin && order.isPaid && !order.isDelivered && !order.isCanceled && (
                            <div className="d-grid mt-3">
                                {loadingDeliver && <LoadingBox></LoadingBox>}
                                <Button type="button" variant="light" className="btn-cta" onClick={deliverOrderHandler}>
                                    Mark as Delivered
                                </Button>
                            </div>
                        )}
                        {cancellable && (
                            <div className="d-grid mt-3">
                                {loadingCancel && <LoadingBox></LoadingBox>}
                                <Button type="button" variant="light" className="btn-cta btn-cancel" onClick={cancelHandler}>
                                    Cancel Order
                                </Button>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
}
