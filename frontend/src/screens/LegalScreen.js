import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';

export default function LegalScreen({ kind }) {
    const isTerms = kind === 'terms';
    return (
        <div className="auth-page">
            <Helmet>
                <title>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</title>
            </Helmet>
            <Card className="auth-card">
                <Card.Body>
                    <h1 className="auth-title">{isTerms ? 'Terms of Service' : 'Privacy Policy'}</h1>
                    <p className="auth-subtitle">Tnalp demo store</p>
                    <p className="legal-text">
                        {isTerms
                            ? 'Tnalp is a demonstration e-commerce project. Accounts and orders created here are demo data; no real payment is processed and nothing is delivered. Do not enter real personal or payment information.'
                            : 'Tnalp is a demonstration e-commerce project. Sign-up details (name, email, password hash) stay in this demo database only. Nothing is shared with third parties or used for marketing.'}
                    </p>
                    <Link to="/" className="continue-shopping">← Back to shop</Link>
                </Card.Body>
            </Card>
        </div>
    );
}
