import React, { useContext, useEffect, useState } from "react";
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Helmet } from "react-helmet-async";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";
import { Link, useNavigate } from "react-router-dom";

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const roundNum = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

export default function PaymentMethodScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { shippingAddress, paymentMethod, cartItems },
    } = state;
    const [paymentMethodName, setPaymentMethod] = useState(paymentMethod || 'PromptPay');

    useEffect(() => {
        if (!shippingAddress.address) {
            navigate('/shipping');
        }
    }, [shippingAddress, navigate]);

    const itemsPrice = roundNum(cartItems.reduce((a, c) => a + c.quantity * c.price, 0));
    const shippingPrice = shippingAddress.province === 'Bangkok' ? roundNum(0) : roundNum(100);
    const totalPrice = itemsPrice + shippingPrice;
    const itemCount = cartItems.reduce((a, c) => a + c.quantity, 0);

    const submitHandler = (e) => {
        e.preventDefault();
        ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: paymentMethodName });
        localStorage.setItem('paymentMethod', paymentMethodName);
        navigate('/placeorder');
    };

    return (
        <div className="checkout-content">
            <Helmet>
                <title>Payment Method</title>
            </Helmet>
            <CheckoutSteps step1 step2 step3></CheckoutSteps>
            <h1 className="page-title">Payment Method</h1>
            <p className="page-subtitle">Choose how you want to pay for your order.</p>

            <div className="checkout-layout">
                <div>
                    <Form onSubmit={submitHandler}>
                        <div className="dashboard-card mb-3">
                            <h2 className="dashboard-card-title">Payment Method</h2>
                            <label className="payment-option selected d-flex align-items-start gap-3">
                                <Form.Check
                                    type="radio"
                                    id="PromptPay"
                                    name="paymentMethod"
                                    value="PromptPay"
                                    checked={paymentMethodName === 'PromptPay'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <span>
                                    <strong>PromptPay</strong>
                                    <div className="cart-item-variant">
                                        Scan a QR code with your banking app after placing the order.
                                    </div>
                                </span>
                            </label>
                            <div className="text-muted small mt-3">
                                Payment instructions will be shown on the next step. You will review your
                                order before it is placed.
                            </div>
                        </div>
                        <Button variant="primary" type="submit" className="btn-cta">
                            Continue to Place Order
                        </Button>
                        <div className="text-center mt-3">
                            <Link to="/shipping" className="continue-shopping">← Back to Shipping</Link>
                        </div>
                    </Form>
                </div>

                <div>
                    <div className="dashboard-card order-summary">
                        <h2 className="dashboard-card-title">Order Summary</h2>
                        <div className="text-muted small mb-2">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{money(itemsPrice)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>{shippingPrice === 0 ? 'Free' : money(shippingPrice)}</span>
                        </div>
                        <hr className="soft-divider" />
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>{money(totalPrice)}</span>
                        </div>
                        <Link to="/cart" className="continue-shopping">Edit items</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
