import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import { useContext, useEffect, useState } from "react";
import Axios from 'axios';
import { Store } from '../Store'
import { toast } from 'react-toastify'
import { getError } from "../utils";

export default function SigninScreen(){
    const navigate = useNavigate();
    const { search }= useLocation();
    const redirectInUrl = new URLSearchParams(search).get('redirect');
    const redirect = redirectInUrl ? redirectInUrl : '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await Axios.post('/api/users/signin', {
                email,
                password,
            });
            ctxDispatch({ type: 'USER_SIGNIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate(redirect || '/');
        } catch (err) {
            setError(getError(err));
            toast.error(getError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    return (
        <div className="auth-page">
            <Helmet>
                <title>Sign In</title>
            </Helmet>
            <Card className="auth-card">
                <Card.Body>
                    <h1 className="auth-title">Sign In</h1>
                    <p className="auth-subtitle">Welcome back to Tnalp</p>
                    {error && (
                        <div className="auth-error" role="alert">{error}</div>
                    )}
                    <Form onSubmit={submitHandler} noValidate>
                        <Form.Group className='mb-3' controlId='email'>
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type='email'
                                required
                                autoComplete='email'
                                placeholder='you@example.com'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className='mb-3' controlId='password'>
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete='current-password'
                                    placeholder='Enter your password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Button
                                    variant='light'
                                    className='auth-eye'
                                    type='button'
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    <i className={showPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                                </Button>
                            </InputGroup>
                        </Form.Group>
                        <Button type='submit' variant='primary' className='btn-cta mt-2' disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </Form>
                    <hr className="soft-divider" />
                    <div className="auth-alt">
                        New to Tnalp? <Link to={`/signup?redirect=${redirect}`}>Create an account</Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    )
}
