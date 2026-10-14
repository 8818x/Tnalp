import React, { useContext, useEffect, useReducer } from 'react';
import CheckoutSteps from '../components/CheckoutSteps';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import { toast } from 'react-toastify';
import { getError } from '../utils';
import Axios from 'axios';

const reducer = (state, action) => {
    switch (action.type) {
        case 'CREATE_REQUEST':
            return { ...state, loading: true };
        case 'CREATE_SUCCESS':
            return { ...state, loading: false };
        case 'CREATE_FAIL':
            return { ...state, loading: false };
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const roundNum = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

export default function PlaceOrderScreen() {
    const navigate = useNavigate();

    const [{ loading }, dispatch] = useReducer(reducer, { loading: false });

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;

    const itemsPrice = roundNum(cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0));
    const shippingPrice = cart.shippingAddress.province === 'Bangkok' ? roundNum(0) : roundNum(100);
    const totalPrice = itemsPrice + shippingPrice;
    const itemCount = cart.cartItems.reduce((a, c) => a + c.quantity, 0);

    const placeOrderHandler = async () => {
        try {
            dispatch({ type: 'CREATE_REQUEST' });
            const { data } = await Axios.post(
                '/api/orders',
                {
                    orderItems: cart.cartItems,
                    shippingAddress: cart.shippingAddress,
                    paymentMethod: cart.paymentMethod,
                    itemsPrice,
                    shippingPrice,
                    totalPrice,
                },
                {
                    headers: {
                        authorization: `Bearer ${userInfo.token}`,
                    },
                }
            );
            ctxDispatch({ type: 'CART_CLEAR' });
            dispatch({ type: 'CREATE_SUCCESS' });
            localStorage.removeItem('cartItems');
            navigate(`/order/${data.order._id}`);
        } catch (err) {
            dispatch({ type: 'CREATE_FAIL' });
            toast.error(getError(err));
        }
    };

    useEffect(() => {
        if (!cart.paymentMethod || cart.cartItems.length === 0) {
            navigate('/cart');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, navigate]);

    return (
        <div className="checkout-content">
            <Helmet>
                <title>Review Order</title>
            </Helmet>
            <CheckoutSteps step1 step2 step3 step4></CheckoutSteps>
            <h1 className="page-title">Review Order</h1>
            <p className="page-subtitle">Check your details before placing the order.</p>

            <Row className="g-4">
                <Col lg={8}>
                    <div className="d-flex flex-column gap-3">
                        <div className="dashboard-card">
                            <div className="d-flex justify-content-between align-items-start">
                                <h2 className="dashboard-card-title mb-0">Shipping Address</h2>
                                <Link to="/shipping" className="continue-shopping" style={{ marginTop: 0 }}>
                                    Change
                                </Link>
                            </div>
                            <div className="order-address">
                                <div>{cart.shippingAddress.fullName}</div>
                                <div>{cart.shippingAddress.phoneNumber}</div>
                                <div>{cart.shippingAddress.address}</div>
                                <div>
                                    {cart.shippingAddress.district}, {cart.shippingAddress.province}{' '}
                                    {cart.shippingAddress.postalCode}
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="d-flex justify-content-between align-items-start">
                                <h2 className="dashboard-card-title mb-0">Payment</h2>
                                <Link to="/payment" className="continue-shopping" style={{ marginTop: 0 }}>
                                    Change
                                </Link>
                            </div>
                            <div className="order-address">
                                <div>{cart.paymentMethod}</div>
                                <div className="cart-item-variant">
                                    Scan a PromptPay QR code after placing the order.
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h2 className="dashboard-card-title mb-0">
                                    Items ({itemCount})
                                </h2>
                                <Link to="/cart" className="continue-shopping" style={{ marginTop: 0 }}>
                                    Change
                                </Link>
                            </div>
                            {cart.cartItems.map((item) => (
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
                    </div>
                </Col>

                <Col lg={4}>
                    <div className="dashboard-card order-summary">
                        <h2 className="dashboard-card-title">Order Summary</h2>
                        <div className="text-muted small mb-2">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{money(itemsPrice)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>
                                {shippingPrice === 0 ? (
                                    <>
                                        Free
                                        <div className="cart-item-variant">Orders in Bangkok ship free</div>
                                    </>
                                ) : (
                                    <>
                                        {money(shippingPrice)}
                                        <div className="cart-item-variant">Flat rate outside Bangkok</div>
                                    </>
                                )}
                            </span>
                        </div>
                        <hr className="soft-divider" />
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>{money(totalPrice)}</span>
                        </div>
                        <Button
                            variant="primary"
                            type="button"
                            className="btn-cta mt-2"
                            onClick={placeOrderHandler}
                            disabled={loading || cart.cartItems.length === 0}>
                            {loading ? 'Placing order…' : `Place Order · ${money(totalPrice)}`}
                        </Button>
                        <div className="text-muted small mt-2 text-center">
                            After placing the order you will get a PromptPay QR to pay.
                        </div>
                        <div className="text-center">
                            <Link to="/payment" className="continue-shopping">← Back to Payment</Link>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}
