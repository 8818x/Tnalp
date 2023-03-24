import axios from "axios";
import { useContext, useEffect, useReducer } from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { useParams } from "react-router-dom";
import ListGroup from 'react-bootstrap/ListGroup'
import Rating from "../components/Rating";
import Badge from 'react-bootstrap/Badge'
import Button from "react-bootstrap/esm/Button";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { getError } from "../utils";
import { Store } from "./Store";

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, product: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};


function ProductScreen() {
    const params = useParams();
    const { slug } = params;
    const [{ loading, error, product }, dispatch] = useReducer(reducer, {
        product: [],
        loading: true,
        error: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const result = await axios.get(`/api/products/slug/${slug}`);
                dispatch({ type: 'FETCH_SUCCESS', payload: result.data })
            }
            catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
    }, [slug]);

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart } = state;
    const addToCartHandler = async() => {
        const exisItem = cart.cartItems.find((x) => x._id === product._id);
        const quantity = exisItem ? exisItem.quantity + 1 : 1;
        const { data } = await axios.get(`/api/products/${product._id}`);
        if(data.countInStock < quantity) {
            window.alert('Sorry, product is out of stock');
            return;
        }
        ctxDispatch(
            { type: 'CART_ADD_ITEM', payload: { ...product, quantity} }
        )
    }

    return loading ? (
        <LoadingBox />
    ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
    ) : (
        <div>
            <Row>
                <Col md={6}>
                    <img className="img-large"
                        src={product.image}
                        alt={product.name}
                    ></img>
                </Col>
                <Col md={3}>
                    <ListGroup varaint="flush">
                        <ListGroup.Item>
                            <Helmet>
                                <title>{product.name}</title>
                            </Helmet>
                            <h1>{product.name}</h1>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <Rating
                                rating={product.rating}
                                numReviews={product.numReviews}>
                            </Rating>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            Price: ฿{product.price}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            Description:
                            <p>{product.description}</p>
                        </ListGroup.Item>
                    </ListGroup>
                    <ListGroup className='product-lg' varaint="flush">
                        <ListGroup.Item>
                            <Row>
                                <Col>Status:</Col>
                                <Col>{product.countInStock > 0 ?
                                    <Badge bg="success">In stock</Badge>
                                    :
                                    <Badge bg="danger">Out of stock</Badge>}
                                </Col>
                            </Row>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <Row>

                                <Col>Quantity:</Col>
                                <Col>{product.countInStock} Pcs. Available</Col>
                            </Row>
                        </ListGroup.Item>
                    </ListGroup>
                    {product.countInStock > 0 && (
                        <ListGroup className='product-lg'>
                            <div className="d-grid">
                                <Button onClick={addToCartHandler} varaint="primary">
                                    Add to cart
                                </Button>
                            </div>
                        </ListGroup>
                    )}
                </Col>
            </Row>
        </div>
    );

}

export default ProductScreen;
