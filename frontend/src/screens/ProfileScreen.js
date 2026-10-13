import React, { useContext, useReducer, useState } from "react";
import { Store } from "../Store";
import { Helmet } from "react-helmet-async";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { getError } from "../utils";
import axios from "axios";

const reducer = (state, action) => {
    switch (action.type) {
        case 'PROFILE_REQUEST':
            return { ...state, loadingProfile: true };
        case 'PROFILE_SUCCESS':
        case 'PROFILE_FAIL':
            return { ...state, loadingProfile: false };
        case 'PASSWORD_REQUEST':
            return { ...state, loadingPassword: true };
        case 'PASSWORD_SUCCESS':
        case 'PASSWORD_FAIL':
            return { ...state, loadingPassword: false };
        default:
            return state;
    }
};

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

export default function ProfileScreen() {
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo } = state;

    const [name, setName] = useState(userInfo ? userInfo.name : '');
    const [email, setEmail] = useState(userInfo ? userInfo.email : '');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [{ loadingProfile, loadingPassword }, dispatch] = useReducer(reducer, {
        loadingProfile: false,
        loadingPassword: false,
    });

    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const pwChecks = {
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /\d/.test(password),
    };
    const pwValid = Object.values(pwChecks).every(Boolean);
    const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

    const saveProfile = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setProfileError('Please enter a valid email address.');
            return;
        }
        dispatch({ type: 'PROFILE_REQUEST' });
        try {
            const { data } = await axios.put(
                '/api/users/profile',
                { name, email },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            ctxDispatch({ type: 'USER_SIGNIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setProfileSuccess('Profile updated successfully.');
            toast.success('Profile updated successfully');
        } catch (err) {
            setProfileError(getError(err));
            dispatch({ type: 'PROFILE_FAIL' });
        }
    };

    const updatePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (!pwValid) {
            setPasswordError('Please meet the password requirements below.');
            return;
        }
        if (mismatch) {
            setPasswordError('Passwords do not match.');
            return;
        }
        dispatch({ type: 'PASSWORD_REQUEST' });
        try {
            const { data } = await axios.put(
                '/api/users/profile',
                { name, email, password },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            ctxDispatch({ type: 'USER_SIGNIN', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirm(false);
            setPasswordSuccess('Password updated successfully.');
            toast.success('Password updated successfully');
        } catch (err) {
            setPasswordError(getError(err));
            dispatch({ type: 'PASSWORD_FAIL' });
        }
    };

    return (
        <div className="profile-page">
            <Helmet>
                <title>Account Settings</title>
            </Helmet>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">Manage your profile information and password.</p>

            <div className="profile-sections">
                <Card className="profile-card">
                    <Card.Body>
                        <h2 className="profile-card-title">Profile Information</h2>
                        <p className="profile-card-subtitle">Update your personal information</p>
                        {profileError && <div className="auth-error" role="alert">{profileError}</div>}
                        {profileSuccess && <div className="profile-success" role="status">{profileSuccess}</div>}
                        <Form onSubmit={saveProfile} noValidate>
                            <Form.Group className='mb-3' controlId='name'>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type='text'
                                    autoComplete='name'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required />
                            </Form.Group>
                            <Form.Group className='mb-3' controlId='email'>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type='email'
                                    autoComplete='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required />
                            </Form.Group>
                            <Form.Group className='mb-3' controlId='role'>
                                <Form.Label>Role</Form.Label>
                                <Form.Control value={userInfo.isAdmin ? 'Administrator' : 'Customer'} readOnly disabled />
                            </Form.Group>
                            <Button type='submit' variant='primary' className='btn-cta' disabled={loadingProfile}>
                                {loadingProfile ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card className="profile-card">
                    <Card.Body>
                        <h2 className="profile-card-title">Change Password</h2>
                        <p className="profile-card-subtitle">Choose a strong new password</p>
                        {passwordError && <div className="auth-error" role="alert">{passwordError}</div>}
                        {passwordSuccess && <div className="profile-success" role="status">{passwordSuccess}</div>}
                        <Form onSubmit={updatePassword} noValidate>
                            <Form.Group className='mb-2' controlId='newpassword'>
                                <Form.Label>New Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        placeholder='Create a password'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required />
                                    {passwordEye(showPassword, () => setShowPassword((s) => !s), 'newpassword')}
                                </InputGroup>
                                <div className="pw-hints">
                                    <span className={pwChecks.length ? 'ok' : ''}>✓ At least 8 characters</span>
                                    <span className={pwChecks.letter ? 'ok' : ''}>✓ Contains a letter</span>
                                    <span className={pwChecks.number ? 'ok' : ''}>✓ Contains a number</span>
                                </div>
                            </Form.Group>
                            <Form.Group className='mb-3' controlId='confirmpassword'>
                                <Form.Label>Confirm New Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        placeholder='Enter password again'
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required />
                                    {passwordEye(showConfirm, () => setShowConfirm((s) => !s), 'confirmpassword')}
                                </InputGroup>
                                {mismatch && <div className="pw-mismatch">Passwords do not match.</div>}
                            </Form.Group>
                            <Button type='submit' variant='primary' className='btn-cta' disabled={loadingPassword}>
                                {loadingPassword ? 'Updating password…' : 'Update Password'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
