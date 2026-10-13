import axios from "axios";
import { useContext, useEffect, useReducer, useRef, useState } from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { Link, useNavigate, useParams } from "react-router-dom";
import Rating from "../components/Rating";
import Badge from 'react-bootstrap/Badge'
import Button from "react-bootstrap/esm/Button";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { getError } from "../utils";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { Card, FloatingLabel, Form } from "react-bootstrap";

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, product: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'REFRESH_PRODUCT':
            return { ...state, product: action.payload };
        case 'CREATE_REQUEST':
            return { ...state, loadingCreateReview: true };
        case 'CREATE_SUCCESS':
            return { ...state, loadingCreateReview: false };
        case 'CREATE_FAIL':
            return { ...state, loadingCreateReview: false };
        default:
            return state;
    }
};

function ProductScreen() {
    const navigate = useNavigate();
    const params = useParams();
    const { slug } = params;
    const [{ loading, error, product, loadingCreateReview }, dispatch] = useReducer(reducer, {
        product: { reviews: [], rating: 0, numReviews: 0, countInStock: 0 },
        loading: true,
        error: '',
    });

    let reviewsRef = useRef();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [qty, setQty] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const result = await axios.get(`/api/products/slug/${slug}`);
                dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
    }, [slug]);

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const changeQty = (delta) =>
        setQty((q) => Math.min(Math.max(1, q + delta), product.countInStock || 1));

    const addItem = async () => {
        const exisItem = cart.cartItems.find((x) => x._id === product._id);
        const inCart = exisItem ? exisItem.quantity : 0;
        const { data } = await axios.get(`/api/products/${product._id}`);
        if (data.countInStock < inCart + qty) {
            window.alert('Sorry, product is out of stock');
            return false;
        }
        ctxDispatch({
            type: 'CART_ADD_ITEM',
            payload: { ...product, quantity: inCart + qty },
        });
        return true;
    };

    const buynowHandler = async () => {
        if (await addItem()) navigate('/cart');
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!comment || !rating) {
            toast.error('Please enter comment and rating');
            return;
        }
        try {
            const { data } = await axios.post(
                `/api/products/${product._id}/reviews`,
                { rating, comment, name: userInfo.name },
                {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                }
            );

            dispatch({
                type: 'CREATE_SUCCESS',
            });
            toast.success('Review submitted successfully');
            product.reviews.unshift(data.review);
            product.numReviews = data.numReviews;
            product.rating = data.rating;
            dispatch({ type: 'REFRESH_PRODUCT', payload: product });
            window.scrollTo({
                behavior: 'smooth',
                top: reviewsRef.current.offsetTop,
            });
        } catch (error) {
            toast.error(getError(error));
            dispatch({ type: 'CREATE_FAIL' });
        }
    };

    const scrollToReviews = () =>
        reviewsRef.current && window.scrollTo({ behavior: 'smooth', top: reviewsRef.current.offsetTop });

    return loading ? (
        <LoadingBox />
    ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
    ) : (
        <div className="product-page">
            <Helmet>
                <title>{product.name}</title>
            </Helmet>
            <nav className="product-breadcrumb" aria-label="breadcrumb">
                <Link to="/">Products</Link>
                {' / '}
                <Link to={`/search?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
                {' / '}
                <span>{product.name}</span>
            </nav>
            <Row className="g-4 align-items-start">
                <Col md={6} lg={7}>
                    <img className="img-large product-hero-img" src={product.image} alt={product.name}></img>
                </Col>
                <Col md={6} lg={5}>
                    <Card className="product-info-card">
                        <Card.Body>
                            <h1 className="product-title-lg">{product.name}</h1>
                            <div className="rating-row">
                                <Rating
                                    rating={product.rating}
                                    caption={
                                        <>
                                            {product.rating ? product.rating.toFixed(1) : '0.0'}{' '}
                                            <a
                                                href="#reviews"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    scrollToReviews();
                                                }}>
                                                ({product.numReviews} reviews)
                                            </a>
                                        </>
                                    }>
                                </Rating>
                            </div>
                            <hr className="soft-divider" />
                            <div className="product-price-lg">฿{product.price}</div>
                            <p className="product-desc">{product.description}</p>
                            {product.countInStock > 0 ? (
                                <>
                                    <div className="product-availability">
                                        <Badge bg="success">In stock · {product.countInStock} available</Badge>
                                    </div>
                                    <div className="qty-label">Quantity</div>
                                    <div className="qty-stepper">
                                        <Button variant='light' onClick={() => changeQty(-1)} disabled={qty <= 1} aria-label="Decrease quantity">−</Button>
                                        <span className="qty-value">{qty}</span>
                                        <Button variant='light' onClick={() => changeQty(1)} disabled={qty >= product.countInStock} aria-label="Increase quantity">+</Button>
                                    </div>
                                    <Button className="btn-cta" variant="primary" onClick={addItem}>
                                        Add to cart
                                    </Button>
                                    <Button className="btn-cta" variant="outline-light" onClick={buynowHandler}>
                                        Buy now
                                    </Button>
                                </>
                            ) : (
                                <div className="product-availability">
                                    <Badge bg="danger">Out of stock</Badge>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <section className="reviews-section" ref={reviewsRef}>
                <h2>Reviews</h2>
                {product.numReviews > 0 && (
                    <div className="review-summary">
                        <div className="review-score">
                            {product.rating.toFixed(1)} <span>/ 5</span>
                        </div>
                        <div>
                            <Rating rating={product.rating} caption=" " />
                            <div className="review-count">Based on {product.numReviews} reviews</div>
                        </div>
                    </div>
                )}
                <div className="mb-3">
                    {product.reviews.length === 0 && <MessageBox>There is no review yet.</MessageBox>}
                </div>
                {product.reviews.map((review) => (
                    <div className="review-item" key={review._id}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>{review.name}</strong>
                                <Rating rating={review.rating} caption=" " />
                            </div>
                            <span className="review-date">{formatDate(review.createdAt)}</span>
                        </div>
                        <p className="review-comment mb-0">{review.comment}</p>
                    </div>
                ))}
                <div className="my-3">
                    {userInfo ? (
                        <form onSubmit={submitHandler}>
                            <h2 className="h4 mt-4">Write a customer review</h2>
                            <Form.Group className="mb-3" controlId="rating">
                                <Form.Label>Rating</Form.Label>
                                <Form.Select
                                    aria-label="Rating"
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}>
                                    <option value="">Select...</option>
                                    <option value="1">1- Poor</option>
                                    <option value="2">2- Fair</option>
                                    <option value="3">3- Good</option>
                                    <option value="4">4- Very good</option>
                                    <option value="5">5- Excelent</option>
                                </Form.Select>
                            </Form.Group>
                            <FloatingLabel
                                controlId="floatingTextarea"
                                label="Comments"
                                className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    placeholder="Leave a comment here"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)} />
                            </FloatingLabel>
                            <div className="mb-3">
                                <Button disabled={loadingCreateReview} type="submit">
                                    Submit
                                </Button>
                                {loadingCreateReview && <LoadingBox></LoadingBox>}
                            </div>
                        </form>
                    ) : (
                        <div className="signin-hint">
                            Sign in to write a review:{' '}
                            <Link to={`/signin?redirect=/product/${product.slug}`}>Sign In</Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default ProductScreen;
