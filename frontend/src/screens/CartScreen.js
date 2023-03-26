import { useContext } from 'react';
import { Store } from '../Store';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MessageBox from '../components/MessageBox';
import ListGroup from 'react-bootstrap/ListGroup';
import { Link, useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button'
import ListGroupItem from 'react-bootstrap/esm/ListGroupItem';
import axios from 'axios';
import { Form } from 'react-bootstrap';

export default function CartScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { cartItems },
    } = state;

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
        <div>
            <Helmet>
                <title>Shopping Cart</title>
            </Helmet>
            <h1>Shopping Cart</h1>
            <Row>
                <Col md={8}>
                    {cartItems.length === 0 ? (
                        <MessageBox>
                            Cart is empty. <Link to='/'>Go Shopping</Link>
                        </MessageBox>
                    ) : (
                        <ListGroup>
                            {cartItems.map((item) => (
                                <ListGroup.Item key={item._id}>
                                    <Row className="align-items-center">
                                        <Col md={4}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="img-fluid rounded img-thumbnail no-thumbnail-border">
                                            </img>{' '}
                                            <Link to={`/product/${item.slug}`}>{item.name}</Link>
                                        </Col>
                                        <Col md={3}>
                                            <div className="quantity-controls d-flex">
                                                <Button variant="light" onClick={() => updateCartHandler(item, item.quantity - 1)} disabled={item.quantity === 1}>
                                                    <i className='fas fa-minus-circle'></i>
                                                </Button>{' '}
                                                <div className="quantity-dropdown">
                                                    <Form.Select value={item.quantity} onChange={(e) => updateCartHandler(item, parseInt(e.target.value))}>
                                                        {[...Array(item.countInStock).keys()].map((x) => (
                                                            <option key={x + 1} value={x + 1}>
                                                                {x + 1}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </div>
                                                <Button variant="light" onClick={() => updateCartHandler(item, item.quantity + 1)} disabled={item.quantity === item.countInStock}>
                                                    <i className='fas fa-plus-circle'></i>
                                                </Button>
                                            </div>
                                        </Col>

                                        <Col md={3}>฿{item.price}</Col>
                                        <Col md={2}>
                                            <Button variant="light" onClick={() => removeCartHandler(item)}>
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Col>
                <Col md={4}>
                    <ListGroup varaint="flush">
                        <ListGroup.Item>
                            <h3>
                                Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)}{' '}
                                items) : ฿
                                {cartItems.reduce((a, c) => a + c.price * c.quantity, 0)}
                            </h3>
                        </ListGroup.Item>
                        <ListGroupItem>
                            <div className='d-grid'>
                                <Button
                                    type='button'
                                    variant='primary'
                                    onClick={checkoutHandler}
                                    disabled={cartItems.length === 0}>
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </ListGroupItem>
                    </ListGroup>
                </Col>
            </Row>
        </div>
    )
}

