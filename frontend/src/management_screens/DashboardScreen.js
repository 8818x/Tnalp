import React, { useContext, useEffect, useReducer } from 'react';
import { Store } from '../Store';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getError } from '../utils';
import { Col, Row } from 'react-bootstrap';
import Chart from 'react-google-charts';
import Badge from 'react-bootstrap/Badge';

const reducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true, error: '' };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                summary: action.payload.summary,
                recentOrders: action.payload.recentOrders,
                lowStock: action.payload.lowStock,
                loading: false,
            };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

const money = (n) => '฿' + Number(n || 0).toLocaleString('en-US');
const shortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fullDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function DashboardScreen() {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [{ loading, summary, recentOrders, lowStock, error }, dispatch] = useReducer(reducer, {
        summary: null,
        recentOrders: [],
        lowStock: [],
        loading: true,
        error: '',
    });

    const fetchData = async () => {
        dispatch({ type: 'FETCH_REQUEST' });
        const headers = { Authorization: `Bearer ${userInfo.token}` };
        try {
            const { data: summary } = await axios.get('/api/orders/summary', { headers });
            let recentOrders = [];
            let lowStock = [];
            // secondary widgets fail soft: dashboard stays up if they do
            try {
                const { data: orders } = await axios.get('/api/orders', { headers });
                recentOrders = orders.slice(0, 5);
            } catch {
                recentOrders = [];
            }
            try {
                const { data: products } = await axios.get('/api/products', { headers });
                lowStock = products.filter((p) => p.countInStock <= 5);
            } catch {
                lowStock = [];
            }
            dispatch({ type: 'FETCH_SUCCESS', payload: { summary, recentOrders, lowStock } });
        } catch (err) {
            dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const numUsers = summary?.users?.[0]?.numUsers ?? 0;
    const numOrders = summary?.orders?.[0]?.numOrders ?? 0;
    const totalSales = summary?.orders?.[0]?.totalSales ?? 0;
    const dailyOrders = summary?.dailyOrders ?? [];
    const categories = summary?.productCategories ?? [];
    const categoryTotal = categories.reduce((a, c) => a + c.count, 0);

    const metrics = [
        { label: 'Total Users', value: numUsers, icon: 'fas fa-users' },
        { label: 'Total Orders', value: numOrders, icon: 'fas fa-box' },
        { label: 'Revenue', value: money(totalSales), icon: 'fas fa-coins' },
    ];

    const orderStatus = (o) =>
        o.isCanceled ? (
            <Badge bg="danger">Canceled</Badge>
        ) : o.isPaid ? (
            <Badge bg="success">Paid</Badge>
        ) : o.isUploaded ? (
            <Badge bg="warning" text="dark">
                Slip uploaded
            </Badge>
        ) : (
            <Badge bg="secondary">Pending</Badge>
        );

    return (
        <div className="dashboard-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of store performance</p>

            {loading ? (
                <div>
                    <Row className="g-3">
                        {[0, 1, 2].map((i) => (
                            <Col md={4} key={i}>
                                <div className="dashboard-card">
                                    <div className="skeleton" style={{ height: 16, width: '40%' }} />
                                    <div className="skeleton" style={{ height: 34, width: '30%', marginTop: 12 }} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                    <div className="dashboard-card mt-3">
                        <div className="skeleton" style={{ height: 16, width: '25%' }} />
                        <div className="skeleton" style={{ height: 240, marginTop: 16 }} />
                    </div>
                </div>
            ) : error ? (
                <div className="dashboard-card">
                    <div className="auth-error" role="alert">Unable to load dashboard data. {error}</div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={fetchData}>
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <Row className="g-3 metrics-grid">
                        {metrics.map((m) => (
                            <Col md={4} key={m.label}>
                                <div className="dashboard-card metric-card">
                                    <div className="metric-label">
                                        <span>{m.label}</span>
                                        <i className={m.icon + ' metric-icon'}></i>
                                    </div>
                                    <div className="metric-value">{m.value}</div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <div className="dashboard-card mt-3">
                        <h2 className="dashboard-card-title">Revenue Trend</h2>
                        {dailyOrders.length === 0 ? (
                            <div className="empty-note">
                                No sales yet. Revenue will appear here after the first order.
                            </div>
                        ) : dailyOrders.length === 1 ? (
                            <div className="empty-note">
                                Not enough data to show a trend yet.
                                <div className="metric-value mt-2">{money(dailyOrders[0].sales)}</div>
                                <div className="text-muted small">
                                    {fullDate(dailyOrders[0]._id)} · {numOrders} order
                                    {numOrders === 1 ? '' : 's'}
                                </div>
                            </div>
                        ) : (
                            <div className="chart-container">
                                <Chart
                                    width="100%"
                                    height="320px"
                                    chartType="AreaChart"
                                    loader={<div>Loading Chart...</div>}
                                    data={[
                                        ['Date', 'Revenue'],
                                        ...dailyOrders.map((x) => [shortDate(x._id), x.sales]),
                                    ]}
                                    options={{
                                        legend: { position: 'none' },
                                        vAxis: { minValue: 0, format: '¤#,##0' },
                                        colors: ['#427147'],
                                        chartArea: { left: 64, right: 16, top: 16, bottom: 32 },
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <Row className="g-3 mt-1">
                        <Col lg={7}>
                            <div className="dashboard-card h-100">
                                <h2 className="dashboard-card-title">Products by Category</h2>
                                {categories.length === 0 ? (
                                    <div className="empty-note">No products yet.</div>
                                ) : (
                                    categories.map((c) => {
                                        const pct = Math.round((c.count / categoryTotal) * 100);
                                        return (
                                            <div className="cat-bar-row" key={c._id}>
                                                <span className="cat-bar-name">{c._id}</span>
                                                <div className="cat-bar-track">
                                                    <div className="cat-bar-fill" style={{ width: pct + '%' }} />
                                                </div>
                                                <span className="cat-bar-value">
                                                    {c.count} ({pct}%)
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div className="text-muted small">Out of {categoryTotal} products</div>
                            </div>
                        </Col>
                        <Col lg={5}>
                            <div className="dashboard-card h-100">
                                <h2 className="dashboard-card-title">Recent Orders</h2>
                                {recentOrders.length === 0 ? (
                                    <div className="empty-note">No orders yet.</div>
                                ) : (
                                    <>
                                        {recentOrders.map((o) => (
                                            <div className="recent-order-row" key={o._id}>
                                                <span>
                                                    #{o._id.slice(-6)} · {fullDate(o.createdAt)}
                                                </span>
                                                <span>
                                                    {money(o.totalPrice)} {orderStatus(o)}
                                                </span>
                                            </div>
                                        ))}
                                        <Link to="/admin/orders" className="continue-shopping">
                                            View all orders →
                                        </Link>
                                    </>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {lowStock.length > 0 && (
                        <Row className="g-3 mt-1">
                            <Col>
                                <div className="dashboard-card">
                                    <h2 className="dashboard-card-title">Low Stock (5 or fewer)</h2>
                                    {lowStock.map((p) => (
                                        <div className="recent-order-row" key={p._id}>
                                            <span>{p.name}</span>
                                            <span className="product-stock low">{p.countInStock} left</span>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}
                </>
            )}
        </div>
    );
}
