import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Rating from './Rating';
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';

function Product(props) {
    const { product } = props;

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { cartItems },
    } = state;

    const addToCartHandler = async (item) => {
        const exisItem = cartItems.find((x) => x._id === product._id);
        const quantity = exisItem ? exisItem.quantity + 1 : 1;
        const { data } = await axios.get(`/api/products/${item._id}`);
        if (data.countInStock < quantity) {
            window.alert('Sorry, product is out of stock');
            return;
        }
        ctxDispatch(
            { type: 'CART_ADD_ITEM', payload: { ...item, quantity }, }
        );
    }

    return (
        <Card className='product-card h-100'>
            <Link to={`/product/${product.slug}`} className='product-img-link'>
                <img src={product.image} className='card-img-top product-img' alt={product.name} />
            </Link>
            <Card.Body className='d-flex flex-column p-3'>
                <Link
                    to={`/product/${product.slug}`}
                    className='product-title-link'>
                    <Card.Title className='product-title'>{product.name}</Card.Title>
                </Link>
                <div className='product-category'>{product.category}</div>
                <Rating rating={product.rating} numReviews={product.numReviews} />
                <Card.Text className='product-price'>฿{product.price}</Card.Text>
                <div className='mt-auto'>
                    {product.countInStock === 0 ? (
                        <>
                            <div className='product-stock out'>Out of stock</div>
                            <Button variant='light' disabled className='btn-product'>Out of Stock</Button>
                        </>
                    ) : (
                        <>
                            {product.countInStock <= 5 && (
                                <div className='product-stock low'>Low stock — only {product.countInStock} left</div>
                            )}
                            <Button
                                onClick={() => addToCartHandler(product)}
                                variant='primary'
                                className='btn-product'>
                                Add to cart
                            </Button>
                        </>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default Product;
