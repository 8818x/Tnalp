import axios from 'axios';
import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'UPDATE_REQUEST':
            return { ...state, loadingUpdate: true };
        case 'UPDATE_SUCCESS':
            return { ...state, loadingUpdate: false };
        case 'UPDATE_FAIL':
            return { ...state, loadingUpdate: false };
        default:
            return state;
    }
};

const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function UserEditScreen() {
    const [{ loading, error, loadingUpdate }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
    });

    const { state } = useContext(Store);
    const { userInfo } = state;

    const params = useParams();
    const { id: userId } = params;
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [createdAt, setCreatedAt] = useState('');
    const [adminCount, setAdminCount] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');

    const initialRef = useRef('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const [{ data: user }, { data: allUsers }] = await Promise.all([
                    axios.get(`/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${userInfo.token}` },
                    }),
                    axios.get(`/api/users`, {
                        headers: { Authorization: `Bearer ${userInfo.token}` },
                    }),
                ]);
                setName(user.name);
                setEmail(user.email);
                setIsAdmin(user.isAdmin);
                setCreatedAt(user.createdAt);
                setAdminCount(allUsers.filter((u) => u.isAdmin).length);
                initialRef.current = JSON.stringify({
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                });
                dispatch({ type: 'FETCH_SUCCESS' });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userInfo]);

    const isDirty = !loading && initialRef.current !== '' && initialRef.current !== JSON.stringify({ name, email, isAdmin });
    const isSelf = userInfo && userId === userInfo._id;
    const demotingSelf = isSelf && isAdmin === false && userInfo?.isAdmin;
    const demotingLastAdmin = isAdmin === false && adminCount <= 1;

    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const leaveWithoutSaving = () => {
        if (!isDirty || window.confirm('You have unsaved changes. Leave without saving?')) {
            navigate('/admin/users');
        }
    };

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Name is required.';
        if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Please enter a valid email address.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!validate()) return;
        if (demotingSelf) {
            setFormError('You cannot remove your own administrator access while signed in.');
            return;
        }
        if (demotingLastAdmin) {
            setFormError('At least one administrator is required.');
            return;
        }
        const roleChanged = isAdmin !== JSON.parse(initialRef.current).isAdmin;
        if (roleChanged) {
            const granting = isAdmin;
            const ok = window.confirm(
                granting
                    ? 'Grant administrator access?\n\nThis user will be able to access management features.'
                    : 'Remove administrator access?\n\nThis user will lose access to management features.'
            );
            if (!ok) return;
        }
        try {
            dispatch({ type: 'UPDATE_REQUEST' });
            await axios.put(
                `/api/users/${userId}`,
                { _id: userId, name, email, isAdmin },
                {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                }
            );
            dispatch({ type: 'UPDATE_SUCCESS' });
            toast.success('User updated successfully');
            navigate('/admin/users');
        } catch (err) {
            setFormError(`Unable to update user. ${getError(err)}`);
            dispatch({ type: 'UPDATE_FAIL' });
        }
    };

    const deleteHandler = async () => {
        if (
            window.confirm(
                `Delete user?\n\n${email} will lose access permanently.\nOrder history should remain available.\n\nThis action cannot be undone.`
            )
        ) {
            try {
                dispatch({ type: 'UPDATE_REQUEST' });
                await axios.delete(`/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                toast.success('User deleted successfully');
                navigate('/admin/users');
            } catch (err) {
                toast.error(getError(err));
                dispatch({ type: 'UPDATE_FAIL' });
            }
        }
    };

    return (
        <div className="profile-page">
            <Helmet>
                <title>Edit User</title>
            </Helmet>
            <nav className="product-breadcrumb">
                <Link to="/admin/users">Users</Link>
                {' / '}
                <span>Edit User</span>
            </nav>

            {loading ? (
                <LoadingBox></LoadingBox>
            ) : error ? (
                <MessageBox variant="danger">{error}</MessageBox>
            ) : (
                <>
                    <h1 className="page-title mb-0">Edit User</h1>
                    <p className="page-subtitle">{email}</p>

                    <Form onSubmit={submitHandler} noValidate>
                        <div className="profile-sections">
                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title">User Information</h2>
                                {formError && <div className="auth-error" role="alert">{formError}</div>}
                                <Form.Group className="mb-3" controlId="name">
                                    <Form.Label>Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        isInvalid={!!fieldErrors.name}
                                        required
                                    />
                                    {fieldErrors.name && (
                                        <div className="pw-mismatch" role="alert">{fieldErrors.name}</div>
                                    )}
                                </Form.Group>
                                <Form.Group controlId="email">
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        isInvalid={!!fieldErrors.email}
                                        required
                                    />
                                    {fieldErrors.email && (
                                        <div className="pw-mismatch" role="alert">{fieldErrors.email}</div>
                                    )}
                                </Form.Group>
                            </div>

                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title">Access &amp; Permissions</h2>
                                <Form.Group className="mb-2" controlId="role">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select value={isAdmin ? 'admin' : 'customer'} onChange={(e) => setIsAdmin(e.target.value === 'admin')}>
                                        <option value="admin">Administrator</option>
                                        <option value="customer" disabled={isSelf && userInfo?.isAdmin}>
                                            Customer
                                        </option>
                                    </Form.Select>
                                    <div className="text-muted small mt-1">
                                        Administrators can access management features and modify store data.
                                    </div>
                                </Form.Group>
                                {isSelf && (
                                    <div className="text-muted small">
                                        You are editing your own account.
                                        {userInfo?.isAdmin && ' Your own role cannot be changed while signed in.'}
                                    </div>
                                )}
                            </div>

                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title">Account Information</h2>
                                <div className="recent-order-row">
                                    <span className="text-muted">Created</span>
                                    <span>{createdAt ? fullDate(createdAt) : '-'}</span>
                                </div>
                                <div className="recent-order-row">
                                    <span className="text-muted">User ID</span>
                                    <span title={userId}>{userId.slice(0, 4)}...{userId.slice(-4)}</span>
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="light"
                                        type="button"
                                        className="btn-cta w-auto"
                                        style={{ flex: '0 0 auto' }}
                                        onClick={leaveWithoutSaving}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="btn-cta w-auto flex-grow-1"
                                        disabled={loadingUpdate}>
                                        {loadingUpdate ? 'Saving…' : 'Save Changes'}
                                    </Button>
                                </div>
                                <div className="text-muted small mt-2 text-center">
                                    {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <h2 className="dashboard-card-title text-danger">Danger Zone</h2>
                                {isSelf ? (
                                    <p className="page-subtitle mb-2">
                                        You cannot delete the account you are signed in with.
                                    </p>
                                ) : (
                                    <p className="page-subtitle mb-2">
                                        Permanently remove this account. Order history should remain available.
                                    </p>
                                )}
                                <Button
                                    variant="outline-danger"
                                    onClick={deleteHandler}
                                    disabled={isSelf}
                                    title={isSelf ? 'You cannot delete the account you are signed in with.' : undefined}>
                                    Delete User
                                </Button>
                            </div>
                        </div>
                        <div className="text-muted small mt-2">* Required fields</div>
                    </Form>
                </>
            )}
        </div>
    );
}
