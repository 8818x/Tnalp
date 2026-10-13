import axios from 'axios';
import React, { useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import { getError } from '../utils';
import { toast } from 'react-toastify';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true };
        case 'FETCH_SUCCESS':
            return { ...state, users: action.payload, loading: false };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'DELETE_REQUEST':
            return { ...state, loadingDelete: true, successDelete: false };
        case 'DELETE_SUCCESS':
            return { ...state, loadingDelete: false, successDelete: true };
        case 'DELETE_FAIL':
            return { ...state, loadingDelete: false };
        case 'DELETE_RESET':
            return { ...state, loadingDelete: false, successDelete: false };
        default:
            return state;
    }
};

const fullDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function UserListScreen() {
    const navigate = useNavigate();
    const [{ loading, error, users, loadingDelete, successDelete }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
        users: [],
    });

    const [query, setQuery] = useState('');
    const [role, setRole] = useState('all');
    const [sort, setSort] = useState('name');

    const { state } = useContext(Store);
    const { userInfo } = state;

    useEffect(() => {
        const fetchData = async () => {
            dispatch({ type: 'FETCH_REQUEST' });
            try {
                const { data } = await axios.get(`/api/users`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        if (successDelete) {
            dispatch({ type: 'DELETE_RESET' });
        } else {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo, successDelete]);

    const deleteHandler = async (user) => {
        if (
            window.confirm(
                `Delete user?\n\n${user.email} will lose access to this account.\nOrder history remains available.\n\nThis action cannot be undone.`
            )
        ) {
            try {
                dispatch({ type: 'DELETE_REQUEST' });
                await axios.delete(`/api/users/${user._id}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                toast.success('User deleted successfully');
                dispatch({ type: 'DELETE_SUCCESS' });
            } catch (err) {
                toast.error(getError(err));
                dispatch({ type: 'DELETE_FAIL' });
            }
        }
    };

    const visibleUsers = useMemo(() => {
        let list = [...users];
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u._id.toLowerCase().includes(q)
            );
        }
        if (role !== 'all') {
            list = list.filter((u) => (role === 'admin' ? u.isAdmin : !u.isAdmin));
        }
        switch (sort) {
            case 'email':
                list.sort((a, b) => a.email.localeCompare(b.email));
                break;
            case 'newest':
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [users, query, role, sort]);

    const adminCount = users.filter((u) => u.isAdmin).length;

    return (
        <div className="products-page">
            <nav className="product-breadcrumb">
                <span>Management / Users</span>
            </nav>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Manage customer accounts and administrative access.</p>

            {!loading && !error && users.length > 0 && (
                <div className="admin-stats">
                    {users.length} {users.length === 1 ? 'user' : 'users'} · {adminCount}{' '}
                    {adminCount === 1 ? 'administrator' : 'administrators'}
                </div>
            )}

            <div className="admin-toolbar">
                <InputGroup className="admin-search">
                    <InputGroup.Text>
                        <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                        type="search"
                        placeholder="Search users..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search users"
                    />
                </InputGroup>
                <Form.Select className="admin-filter" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
                    <option value="all">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="customer">Customers</option>
                </Form.Select>
                <Form.Select className="admin-filter" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort users">
                    <option value="name">Sort: Name A-Z</option>
                    <option value="email">Sort: Email A-Z</option>
                    <option value="newest">Sort: Newest first</option>
                </Form.Select>
            </div>

            {loading ? (
                <div className="dashboard-card">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="d-flex gap-3 mb-3">
                            <div className="skeleton rounded-circle" style={{ width: 40, height: 40 }} />
                            <div className="skeleton flex-grow-1" style={{ height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 90, height: 20, alignSelf: 'center' }} />
                            <div className="skeleton" style={{ width: 110, height: 20, alignSelf: 'center' }} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="dashboard-card">
                    <div className="auth-error" role="alert">Unable to load users. {error}</div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            ) : users.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No users found</h2>
                    <p className="page-subtitle">Accounts appear here after customers sign up.</p>
                </div>
            ) : visibleUsers.length === 0 ? (
                <div className="dashboard-card text-center py-5">
                    <h2 className="profile-card-title">No users match your filters</h2>
                    <p className="page-subtitle">Try changing your search or filters.</p>
                    <Button
                        variant="outline-primary"
                        onClick={() => {
                            setQuery('');
                            setRole('all');
                        }}>
                        Clear filters
                    </Button>
                </div>
            ) : (
                <>
                    <div className="dashboard-card p-0 table-responsive">
                        <table className="table product-table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleUsers.map((user) => {
                                    const isSelf = userInfo && user._id === userInfo._id;
                                    const canDelete = !isSelf && !(user.isAdmin && adminCount <= 1);
                                    const noDeleteReason = isSelf
                                        ? 'You cannot delete the account you are signed in with.'
                                        : user.isAdmin && adminCount <= 1
                                            ? 'At least one administrator is required.'
                                            : undefined;
                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <span className="user-avatar" aria-hidden="true">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <div className="cart-item-name">{user.name}</div>
                                                        <div className="cart-item-variant">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {user.isAdmin ? (
                                                    <Badge bg="dark">Admin</Badge>
                                                ) : (
                                                    <Badge bg="light" text="dark">
                                                        Customer
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>{user.createdAt ? fullDate(user.createdAt) : '-'}</td>
                                            <td className="text-end">
                                                <Button
                                                    type="button"
                                                    variant="light"
                                                    size="sm"
                                                    className="me-1"
                                                    onClick={() => navigate(`/admin/user/${user._id}`)}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="light"
                                                    size="sm"
                                                    className="row-delete"
                                                    title={noDeleteReason || user._id}
                                                    disabled={!canDelete}
                                                    onClick={() => deleteHandler(user)}>
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3">
                        <span className="text-muted small">
                            Showing {visibleUsers.length} of {users.length}{' '}
                            {users.length === 1 ? 'user' : 'users'}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
