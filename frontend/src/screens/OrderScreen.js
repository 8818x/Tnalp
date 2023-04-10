import axios from "axios";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { Button, Card, Col, Form, ListGroup, Row } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingBox from "../components/LoadingBox";
import MessageBox from '../components/MessageBox';
import { Store } from "../Store";
import { getError } from "../utils";
import { toast } from 'react-toastify';

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true, error: '' };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, order: action.payload, error: '' };
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
            return {
                ...state,
                loadingDeliver: false,
                successDeliver: false,
            };
        case 'UPDATE_REQUEST':
            return { ...state, loadingUpdate: true };
        case 'UPDATE_SUCCESS':
            return { ...state, loadingUpdate: false };
        case 'UPDATE_FAIL':
            return { ...state, loadingUpdate: false };
        case 'UPLOAD_REQUEST':
            return { ...state, loadingUpload: true, errorUpload: '' };
        case 'UPLOAD_SUCCESS':
            return {
                ...state,
                loadingUpload: false,
                errorUpload: '',
            };
        case 'UPLOAD_FAIL':
            return { ...state, loadingUpload: false, errorUpload: action.payload };
        case 'CANCEL_REQUEST':
            return { ...state, loadingCancel: true };
        case 'CANCEL_SUCCESS':
            return { ...state, loadingCancel: false, successCancel: true };
        case 'CANCEL_FAIL':
            return { ...state, loadingCancel: false };
        case 'CANCEL_RESET':
            return {
                ...state,
                loadingCancel: false,
                successCancel: false,
            };
        default:
            return state;
    }
}

export default function OrderScreen() {
    const navigate = useNavigate();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const params = useParams();
    const { id: orderId } = params;
    const [{ loading,
        error,
        order,
        successPay,
        loadingPay,
        loadingDeliver,
        successDeliver,
        loadingUpdate,
        loadingUpload,
        loadingCancel,
        successCancel,

    }, dispatch
    ] = useReducer(reducer, {
        loading: true,
        order: {},
        error: '',
        successPay: false,
        loadingPay: false,
    });

    const [imageUploaded, setImage] = useState('');
    const [already, setAlready] = useState(false);

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
        }
        if (!userInfo) {
            return navigate('/signin')
        }
        if (!order._id || successPay || successDeliver || successCancel || loadingUpdate || (order._id && order._id !== orderId)) {
            fetchOrder();
        }
        if (successPay) {
            dispatch({ type: 'PAY_RESET' })
        }
        if (successDeliver) {
            dispatch({ type: 'DELIVER_RESET' });
        }
        if (successCancel) {
            dispatch({ type: 'CANCEL_RESET' });
        }

    }, [order, userInfo, orderId, navigate, successPay, successDeliver, successCancel, loadingUpdate])

    async function paymentHandler() {
        try {
            dispatch({ type: 'PAY_REQUEST' })
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
            dispatch({ type: 'PAY_FAIL' })
        }
    }

    async function cancelHandler() {
        try {
            dispatch({ type: 'CANCEL_REQUEST' })
            const { data } = await axios.put(
                `/api/orders/${order._id}/cancel`,
                {},
                {
                    headers: { authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'CANCEL_SUCCESS', payload: data });
            toast.success('Cancel Successfully');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'CANCEL_FAIL' })
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

            toast.success('Image Uploaded Successfully');
            setImage(data.secure_url);

        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
        }
        setAlready(true)
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
            dispatch({
                type: 'UPDATE_SUCCESS',
            });
            toast.success('Wait for confirmation from the seller');
        } catch (err) {
            toast.error(getError(err));
            dispatch({ type: 'UPDATE_FAIL' });
        }

    };

    return (
        loading ? (
            <LoadingBox></LoadingBox>
        ) : error ? (
            <MessageBox variant='danger'>{error}</MessageBox>
        ) : (
            <div>
                <Helmet>
                    <title>Order {orderId}</title>
                </Helmet>
                <h1 className="my-3">Order {orderId}</h1>
                <Row>
                    <Col md={8}>
                        <Card className='mb-3'>
                            <Card.Body>
                                <Card.Title>Shipping</Card.Title>
                                <Card.Text>
                                    <strong>Name:</strong> {order.shippingAddress.fullName} <br />
                                    <strong>Address: </strong> {order.shippingAddress.address}, {order.shippingAddress.phoneNumber}, {order.shippingAddress.district}, {order.shippingAddress.province}, {order.shippingAddress.postalCode}
                                </Card.Text>
                                {order.isDelivered && !order.isCanceled ? (
                                    <MessageBox variant='success'>
                                        Delivered at {order.deliveredAt}
                                    </MessageBox>
                                ) : !order.isDelivered && order.isCanceled ? (
                                    <MessageBox variant='primary'>
                                        Order is canceled at {order.canceledAt}
                                    </MessageBox>
                                ) : (
                                    <MessageBox variant='danger'>
                                        Not Delivered
                                    </MessageBox>
                                )}
                            </Card.Body>
                        </Card>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>
                                    <strong>Method:</strong> {order.paymentMethod}
                                </Card.Title>
                                {!order.isUploaded && !order.isPaid && !order.isCanceled ? (
                                    <MessageBox variant='danger'>Not Paid</MessageBox>
                                ) : order.isUploaded && !order.isPaid && !order.isCanceled ? (
                                    <MessageBox variant='warning'>Wait for Confirmation</MessageBox>
                                ) : !order.isPaid && order.isCanceled ? (
                                    <MessageBox variant='primary'>Order is Canceled at {order.canceledAt} </MessageBox>
                                ) : (
                                    <MessageBox variant='success'>Paid at {order.paidAt}</MessageBox>
                                )}
                                <img
                                    src='https://res.cloudinary.com/datnrdn28/image/upload/v1681071570/qrcode_j3d3tu.png'
                                    alt='promptpay'
                                    className='img-fluid center-image'>
                                </img>
                                <p className="centered-text">
                                    <strong>KBank</strong><br />
                                    <strong>Name: </strong>Example Example<br />
                                    <strong>Bank account no.: </strong>xxx-x-xxxxx-x<br />
                                    <strong>Mobile Number: </strong>0123456789
                                </p>
                                <Form onSubmit={submitHandler}>
                                    <Form.Group className="mb-3" controlId="image">
                                        <Form.Label>Image File</Form.Label>
                                        <Form.Control
                                            value={imageUploaded}
                                            onChange={(e) => setImage(e.target.value)}
                                            required
                                            disabled
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="imageFile">
                                        <Form.Label>Upload File</Form.Label>
                                        <Form.Control type="file" onChange={uploadFileHandler} disabled={order.isUploaded} />
                                        {loadingUpload && <LoadingBox></LoadingBox>}
                                    </Form.Group>
                                    {!order.isUploaded && (
                                        <div className="mb-3">
                                            <Button disabled={!already} type="submit">
                                                Upload
                                            </Button>
                                            {loadingUpdate && <LoadingBox></LoadingBox>}
                                        </div>
                                    )}
                                </Form>
                            </Card.Body>
                        </Card>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Items</Card.Title>
                                <ListGroup variant="flush">
                                    {order.orderItems.map((item) => (
                                        <ListGroup.Item key={item._id}>
                                            <Row className='align-items-center'>
                                                <Col md={6}>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className='img-fluid rounded no-thumbnail-border img-thumbnail'
                                                    ></img>{' '}
                                                    <Link to={`/product/${item.slug}`}>{item.name}</Link>
                                                </Col>
                                                <Col md={3}>
                                                    <span>⨯{item.quantity}</span>
                                                </Col>
                                                <Col md={3}>฿{item.price}</Col>
                                            </Row>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Order Summary</Card.Title>
                                <ListGroup variant="flush">
                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Items</Col>
                                            <Col>฿{order.itemsPrice.toFixed(2)}</Col>
                                        </Row>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Shipping</Col>
                                            <Col>฿{order.shippingPrice.toFixed(2)}</Col>
                                        </Row>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <Row>
                                            <Col>Order Total</Col>
                                            <Col>฿{order.totalPrice.toFixed(2)}</Col>
                                        </Row>
                                    </ListGroup.Item>
                                    {userInfo.isAdmin && order.isUploaded && !order.isPaid && !order.isDelivered && (
                                        <ListGroup.Item>
                                            {loadingUpdate && <LoadingBox></LoadingBox>}
                                            <img
                                                src={order.imageUploaded}
                                                alt={order.uploadedAt}
                                                className='img-fluid center-image'>
                                            </img>
                                        </ListGroup.Item>
                                    )}

                                    {userInfo.isAdmin && !order.isPaid && !order.isDelivered && !order.isCanceled && (
                                        <ListGroup.Item>
                                            {loadingUpdate && <LoadingBox></LoadingBox>}
                                            <div className="d-grid order-lg" >
                                                {loadingPay && <LoadingBox></LoadingBox>}
                                                <Button type="button" onClick={paymentHandler}>
                                                    Confirm Payment
                                                </Button>
                                            </div>
                            
                                            <div className="d-grid">
                                                {loadingCancel && <LoadingBox></LoadingBox>}
                                                <Button type="button" onClick={cancelHandler}>
                                                    Cancel Order
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    )}

                                    {userInfo.isAdmin && order.isUploaded && order.isPaid && !order.isDelivered && !order.isCanceled && (
                                        <ListGroup.Item>
                                            {loadingDeliver && <LoadingBox></LoadingBox>}
                                            <div className="d-grid">
                                                <Button type="button" onClick={deliverOrderHandler}>
                                                    Deliver Order
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    )
}