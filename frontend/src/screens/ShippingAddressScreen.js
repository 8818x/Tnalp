import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";

export default function ShippingAddressScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        userInfo,
        cart: { shippingAddress },
    } = state;
    const [fullName, setFullName] = useState(shippingAddress.fullName || userInfo?.name || '');
    const [phoneNumber, setPhoneNumber] = useState(shippingAddress.phoneNumber || '');
    const [address, setAddress] = useState(shippingAddress.address || '');
    const [district, setDistrict] = useState(shippingAddress.district || '');
    const [province, setProvince] = useState(shippingAddress.province || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (!userInfo) {
            navigate('/signin?redirect=/shipping');
        }
    }, [userInfo, navigate]);

    const validate = () => {
        const errs = {};
        if (!fullName.trim()) errs.fullName = 'Full name is required.';
        if (!/^0\d{8,9}$/.test(phoneNumber.trim())) errs.phoneNumber = 'Please enter a valid phone number (e.g. 0812345678).';
        if (!address.trim()) errs.address = 'Address is required.';
        if (!district.trim()) errs.district = 'District is required.';
        if (!province.trim()) errs.province = 'Province is required.';
        if (!/^\d{5}$/.test(postalCode.trim())) errs.postalCode = 'Please enter a 5-digit postal code.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!validate()) return;
        const payload = {
            fullName,
            phoneNumber,
            address,
            district,
            province,
            postalCode,
        };
        ctxDispatch({ type: 'SAVE_SHIPPING_ADDRESS', payload });
        localStorage.setItem('shippingAddress', JSON.stringify(payload));
        navigate('/payment');
    };

    return (
        <div className="checkout-content narrow">
            <Helmet>
                <title>Shipping Address</title>
            </Helmet>
            <CheckoutSteps step1 step2></CheckoutSteps>
            <h1 className="page-title">Shipping Address</h1>
            <p className="page-subtitle">Enter the address where you want your order delivered.</p>

            <Form onSubmit={submitHandler} noValidate>
                <div className="dashboard-card mx-auto" style={{ maxWidth: 560 }}>
                    <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            isInvalid={!!fieldErrors.fullName}
                            required />
                        {fieldErrors.fullName && (
                            <div className="pw-mismatch" role="alert">{fieldErrors.fullName}</div>
                        )}
                    </Form.Group>
                    <Form.Group className="mb-2" controlId="phoneNumber">
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            isInvalid={!!fieldErrors.phoneNumber}
                            required />
                        {fieldErrors.phoneNumber && (
                            <div className="pw-mismatch" role="alert">{fieldErrors.phoneNumber}</div>
                        )}
                        <div className="text-muted small mt-1">Used only for delivery contact.</div>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="address">
                        <Form.Label>Address *</Form.Label>
                        <Form.Control
                            type="text"
                            autoComplete="street-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            isInvalid={!!fieldErrors.address}
                            required />
                        {fieldErrors.address && (
                            <div className="pw-mismatch" role="alert">{fieldErrors.address}</div>
                        )}
                    </Form.Group>
                    <Row className="g-2">
                        <Form.Group as={Col} className="mb-3" controlId="district">
                            <Form.Label>District *</Form.Label>
                            <Form.Control
                                type="text"
                                autoComplete="address-level2"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                isInvalid={!!fieldErrors.district}
                                required />
                            {fieldErrors.district && (
                                <div className="pw-mismatch" role="alert">{fieldErrors.district}</div>
                            )}
                        </Form.Group>
                        <Form.Group as={Col} className="mb-3" controlId="province">
                            <Form.Label>Province *</Form.Label>
                            <Form.Control
                                type="text"
                                autoComplete="address-level1"
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                isInvalid={!!fieldErrors.province}
                                required />
                            {fieldErrors.province && (
                                <div className="pw-mismatch" role="alert">{fieldErrors.province}</div>
                            )}
                        </Form.Group>
                    </Row>
                    <Form.Group className="mb-3" controlId="postalCode">
                        <Form.Label>Postal Code *</Form.Label>
                        <Form.Control
                            type="text"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            isInvalid={!!fieldErrors.postalCode}
                            required />
                        {fieldErrors.postalCode && (
                            <div className="pw-mismatch" role="alert">{fieldErrors.postalCode}</div>
                        )}
                    </Form.Group>
                    <Button variant="primary" type="submit" className="btn-cta">
                        Continue to Payment
                    </Button>
                    <div className="text-muted small mt-2 text-center">
                        Your information is used only to fulfill your order.
                    </div>
                </div>
            </Form>
            <div className="text-center mt-3">
                <Link to="/cart" className="continue-shopping">← Back to Cart</Link>
            </div>
        </div>
    );
}
