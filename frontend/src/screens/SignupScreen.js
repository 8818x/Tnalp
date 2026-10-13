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

export default function SignupScreen() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirectInUrl = new URLSearchParams(search).get('redirect');
    const redirect = redirectInUrl ? redirectInUrl : '/';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;

    const pwChecks = {
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /\d/.test(password),
    };
    const pwValid = Object.values(pwChecks).every(Boolean);
    const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!pwValid) {
            setError('Please meet the password requirements below.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await Axios.post('/api/users/signup', {
                name,
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

    const passwordEye = (show, toggle, id) => (
        <Button
            variant='light'
            className='auth-eye'
            type='button'
            onClick={toggle}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-controls={id}>
            <i className={show ? 'far fa-eye-slash' : 'far fa-eye'}></i>
        </Button>
    );

    return (
        <div className="auth-page">
            <Helmet>
                <title>Create Account</title>
            </Helmet>
            <Card className="auth-card">
                <Card.Body>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Join Tnalp and start shopping</p>
                    {error && (
                        <div className="auth-error" role="alert">{error}</div>
                    )}
                    <Form onSubmit={submitHandler} noValidate>
                        <Form.Group className='mb-3' controlId='name'>
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type='text'
                                required
                                autoComplete='name'
                                placeholder='Your name'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Form.Group>
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
                        <Form.Group className='mb-2' controlId='password'>
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete='new-password'
                                    placeholder='Create a password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {passwordEye(showPassword, () => setShowPassword((s) => !s), 'password')}
                            </InputGroup>
                            <div className="pw-hints">
                                <span className={pwChecks.length ? 'ok' : ''}>✓ At least 8 characters</span>
                                <span className={pwChecks.letter ? 'ok' : ''}>✓ Contains a letter</span>
                                <span className={pwChecks.number ? 'ok' : ''}>✓ Contains a number</span>
                            </div>
                        </Form.Group>
                        <Form.Group className='mb-3' controlId='confirmPassword'>
                            <Form.Label>Confirm Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    autoComplete='new-password'
                                    placeholder='Enter password again'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {passwordEye(showConfirm, () => setShowConfirm((s) => !s), 'confirmPassword')}
                            </InputGroup>
                            {mismatch && (
                                <div className="pw-mismatch">Passwords do not match.</div>
                            )}
                        </Form.Group>
                        <p className="auth-terms">
                            By creating an account, you agree to our{' '}
                            <Link to='/terms'>Terms of Service</Link> and{' '}
                            <Link to='/privacy'>Privacy Policy</Link>.
                        </p>
                        <Button type='submit' variant='primary' className='btn-cta' disabled={loading}>
                            {loading ? 'Creating account…' : 'Create Account'}
                        </Button>
                    </Form>
                    <hr className="soft-divider" />
                    <div className="auth-alt">
                        Already have an account? <Link to={`/signin?redirect=${redirect}`}>Sign in</Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}
