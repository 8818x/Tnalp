import { useContext } from 'react';
import { Store } from '../Store';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MessageBox from '../components/MessageBox';
import { Link, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import { Card } from 'react-bootstrap';

export default function CartScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { cartItems },
    } = state;

    const itemCount = cartItems.reduce((a, c) => a + c.quantity, 0);
    const subtotal = cartItems.reduce((a, c) => a + c.price * c.quantity, 0);

    const updateCartHandler = async (item, quantity) => {
        const { data } = await axios.get(`/api/products/${item._id}`);
        if (data.countInStock < quantity) {
            window.alert('Sorry, product is out of stock');
            return;
        }
        ctxDispatch(
            { type: 'CART_ADD_ITEM', payload: { ...item, quantity }, }
        );
    }

    const removeCartHandler = async (item) => {
        ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
    }

    const checkoutHandler = () => {
        navigate('/signin?redirect=/shipping');
    };

    return (
        <div className="cart-page">
            <Helmet>
                <title>Shopping Cart</title>
            </Helmet>
            <h1 className="page-title">Shopping Cart</h1>
            <p className="page-subtitle">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
            <Row className="g-4">
                <Col lg={8}>
                    {cartItems.length === 0 ? (
                        <MessageBox>
                            Cart is empty.{' '}
                            <Link to='/' className='continue-shopping' style={{ marginTop: 0 }}>
                                ← Go shopping
                            </Link>
                        </MessageBox>
                    ) : (
                        <div>
                            {cartItems.map((item) => (
                                <div className="cart-item" key={item._id}>
                                    <Link to={`/product/${item.slug}`} className="cart-item-img">
                                        <img src={item.image} alt={item.name} />
                                    </Link>
                                    <div className="cart-item-info">
                                        <Link to={`/product/${item.slug}`} className="cart-item-name">
                                            {item.name}
                                        </Link>
                                        <div className="cart-item-variant">{item.category}</div>
                                        <div className="cart-item-unit">฿{item.price} each</div>
                                    </div>
                                    <div className="qty-stepper cart-qty">
                                        <Button
                                            variant='light'
                                            onClick={() => updateCartHandler(item, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            aria-label="Decrease quantity">−</Button>
                                        <span className="qty-value">{item.quantity}</span>
                                        <Button
                                            variant='light'
                                            onClick={() => updateCartHandler(item, item.quantity + 1)}
                                            disabled={item.quantity >= item.countInStock}
                                            aria-label="Increase quantity">+</Button>
                                    </div>
                                    <div className="cart-item-total">฿{item.price * item.quantity}</div>
                                    <Button
                                        variant='light'
                                        className='cart-remove'
                                        onClick={() => removeCartHandler(item)}
                                        aria-label="Remove item">
                                        <i className="fas fa-trash"></i>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Col>
                <Col lg={4}>
                    <Card className="order-summary">
                        <Card.Body>
                            <h3 className="order-summary-title">Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                                <span>฿{subtotal}</span>
                            </div>
                            <div className="summary-row muted">
                                <span>Shipping</span>
                                <span>At checkout</span>
                            </div>
                            <hr className="soft-divider" />
                            <div className="summary-row summary-total">
                                <span>Total</span>
                                <span>฿{subtotal}</span>
                            </div>
                            <Button
                                type='button'
                                variant='primary'
                                className='btn-cta'
                                onClick={checkoutHandler}
                                disabled={cartItems.length === 0}>
                                Proceed to Checkout
                            </Button>
                            <div className="text-center">
                                <Link to="/" className="continue-shopping">Continue shopping</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
