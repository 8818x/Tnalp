import { BrowserRouter, Route, Routes, Link, NavLink } from 'react-router-dom';
import HomeScreen from "./screens/HomeScreen";
import ProductScreen from './screens/ProductScreen';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';
import Badge from 'react-bootstrap/esm/Badge';
import Nav from 'react-bootstrap/Nav'
import { useContext, useEffect, useState } from 'react';
import { Store } from './Store';
import CartScreen from './screens/CartScreen';
import SigninScreen from './screens/SigninScreen';
import { Button, NavDropdown } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import ShippingAddressScreen from './screens/ShippingAddressScreen';
import SignupScreen from './screens/SignupScreen';
import LegalScreen from './screens/LegalScreen';
import PaymentMethodScreen from './screens/PaymentMethodScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import { getError } from './utils';
import axios from 'axios';
import SearchBox from './components/SearchBox';
import SearchScreen from './screens/SearchScreen';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardScreen from './management_screens/DashboardScreen';
import ProductListScreen from './management_screens/ProductListScreen';
import ProductEditScreen from './management_screens/ProductEditScreen';
import OrderListScreen from './management_screens/OrderListScreen';
import UserListScreen from './management_screens/UserListScreen';
import UserEditScreen from './management_screens/UserEditScreen';

function App() {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;

    const signoutHandler = () => {
        ctxDispatch({ type: 'USER_SIGNOUT' });
        localStorage.removeItem('userInfo');
        localStorage.removeItem('shippingAddress');
        localStorage.removeItem('paymentMethod');
        window.location.href = '/signin';
    }
    const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`/api/products/categories`);
                setCategories(data);
            } catch (err) {
                toast.error(getError(err));
            }
        };
        fetchCategories();
    }, [])
    return (
        <BrowserRouter>
            <div className={sidebarIsOpen
                ? "d-flex flex-column site-container active-cont"
                : "d-flex flex-column site-container"}>
                <ToastContainer position='bottom-center' limit={1} />
                <header className="App-header">
                    <Navbar variant='dark' expand='lg'>
                        <Container>
                            <Button
                                variant='text'
                                className='nav-btn'
                                onClick={() => setSidebarIsOpen(!sidebarIsOpen)}>
                                <i className='fas fa-bars' style={{ color: 'white' }}></i>
                            </Button>
                            <LinkContainer to="/">
                                <Navbar.Brand>Tnalp</Navbar.Brand>
                            </LinkContainer>
                            <Navbar.Toggle aria-controls='basic-navbar-nav' aria-label='Toggle search and menu' />
                            <Navbar.Collapse id='basic-navbar-nav'>
                                <Container className="container-fluid">
                                    <SearchBox />
                                </Container>
                                <Nav className="me-auto w-100 justify-content-end">
                                    {userInfo && userInfo.isAdmin && (
                                        <NavDropdown title='Management' id='admin-nav-dropdown'>
                                            <LinkContainer to='/admin/dashboard'>
                                                <NavDropdown.Item>Dashboard</NavDropdown.Item>
                                            </LinkContainer>
                                            <LinkContainer to='/admin/products'>
                                                <NavDropdown.Item>Products</NavDropdown.Item>
                                            </LinkContainer>
                                            <LinkContainer to='/admin/orders'>
                                                <NavDropdown.Item>Orders</NavDropdown.Item>
                                            </LinkContainer>
                                            <LinkContainer to='/admin/users'>
                                                <NavDropdown.Item>Users</NavDropdown.Item>
                                            </LinkContainer>
                                        </NavDropdown>
                                    )
                                    }
                                </Nav>
                            </Navbar.Collapse>
                            <Nav className="nav-account flex-row align-items-center">
                                <Link to="/cart" className='nav-link'>
                                    <i className='fas fa-shopping-cart me-1'></i>
                                    Cart {cart.cartItems.length > 0 && (
                                        <Badge pill bg="danger">
                                            {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
                                        </Badge>
                                    )}
                                </Link>
                                {userInfo ? (
                                    <NavDropdown title={userInfo.name} id='basic-nav-dropdown' align="end">
                                        <LinkContainer to='/profile'>
                                            <NavDropdown.Item>User Profile</NavDropdown.Item>
                                        </LinkContainer>
                                        <LinkContainer to='/orderhistory'>
                                            <NavDropdown.Item>Order History</NavDropdown.Item>
                                        </LinkContainer>
                                        <NavDropdown.Divider />
                                        <Link
                                            className='dropdown-item'
                                            to='#signout'
                                            onClick={signoutHandler}>
                                            Sign Out
                                        </Link>
                                    </NavDropdown>
                                ) : (
                                    <NavLink
                                        className={({ isActive }) =>
                                            'nav-link' + (isActive ? ' active-signin' : '')}
                                        to='/signin'>
                                        Sign In
                                    </NavLink>
                                )}
                            </Nav>
                        </Container>
                    </Navbar>
                </header>
                <div className={
                    sidebarIsOpen
                        ? 'active-nav side-navbar d-flex justify-content-between flex-wrap flex-column'
                        : 'side-navbar d-flex justify-content-between flex-wrap flex-column'
                }>
                    <Nav className='flex-column text-white w-100 p-2'>
                        <Nav.Item>
                            <strong>Categories</strong>
                        </Nav.Item>
                        {categories.map((category) => (
                            <Nav.Item key={category}>
                                <LinkContainer
                                    to={{ pathname: '/search', search: `?category=${category}` }}
                                    onClick={() => setSidebarIsOpen(false)}
                                >
                                    <Nav.Link>{category}</Nav.Link>
                                </LinkContainer>
                            </Nav.Item>
                        ))}
                    </Nav>
                </div>
                <main>
                    <Container className="mt-3">
                        <Routes>
                            <Route path="/product/:slug" element={<ProductScreen />}></Route>
                            <Route path="/cart" element={<CartScreen />}></Route>
                            <Route path='/search' element={<SearchScreen />}></Route>
                            <Route path='/signin' element={<SigninScreen />}></Route>
                            <Route path='/signup' element={<SignupScreen />}></Route>
                            <Route path='/terms' element={<LegalScreen kind='terms' />}></Route>
                            <Route path='/privacy' element={<LegalScreen kind='privacy' />}></Route>
                            <Route
                                path='/profile'
                                element={
                                    <ProtectedRoute>
                                        <ProfileScreen />
                                    </ProtectedRoute>
                                }>
                            </Route>
                            <Route path='/shipping' element={<ShippingAddressScreen />}></Route>
                            <Route path='/payment' element={<PaymentMethodScreen />}></Route>

                            {/* Admin Route */}
                            <Route
                                path='/admin/dashboard'
                                element={
                                    <AdminRoute>
                                        <DashboardScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route path='/placeorder' element={<PlaceOrderScreen />}></Route>
                            <Route
                                path='/order/:id'
                                element={
                                    <ProtectedRoute>
                                        <OrderScreen />
                                    </ProtectedRoute>}>
                            </Route>
                            <Route
                                path='/orderhistory'
                                element={
                                    <ProtectedRoute>
                                        <OrderHistoryScreen />
                                    </ProtectedRoute>
                                }>
                            </Route>
                            <Route
                                path="/admin/orders"
                                element={
                                    <AdminRoute>
                                        <OrderListScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route
                                path="/admin/users"
                                element={
                                    <AdminRoute>
                                        <UserListScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route
                                path='/admin/products'
                                element={
                                    <AdminRoute>
                                        <ProductListScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route
                                path="/admin/product/:id"
                                element={
                                    <AdminRoute>
                                        <ProductEditScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route
                                path="/admin/user/:id"
                                element={
                                    <AdminRoute>
                                        <UserEditScreen />
                                    </AdminRoute>
                                }>
                            </Route>
                            <Route path="/" element={<HomeScreen />}></Route>
                        </Routes>
                    </Container>
                </main>
                <footer className='site-footer'>
                    <Container className='d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 py-3'>
                        <div><strong>Tnalp</strong>: plants, pots &amp; planters</div>
                        <Nav className='footer-nav'>
                            <LinkContainer to="/">
                                <Nav.Link>Products</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/cart">
                                <Nav.Link>Cart</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/orderhistory">
                                <Nav.Link>Orders</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/profile">
                                <Nav.Link>Account</Nav.Link>
                            </LinkContainer>
                        </Nav>
                        <div className='text-muted small'>© 2023 Tnalp. All rights reserved.</div>
                    </Container>
                </footer>
            </div>
        </BrowserRouter>
    );
}

export default App;
