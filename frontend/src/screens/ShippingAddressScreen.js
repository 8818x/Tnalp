import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";

export default function ShippingAddressScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        userInfo,
        cart: { shippingAddress },
    } = state;
    const [fullName, setFullName] = useState(shippingAddress.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(shippingAddress.phoneNumber || '');
    const [address, setAddress] = useState(shippingAddress.address || '');
    const [district, setDistrict] = useState(shippingAddress.district || '');
    const [province, setProvince] = useState(shippingAddress.province || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    useEffect(() => {
        if(!userInfo) {
            navigate('/signin?redirect=/shipping');
        }
    }, [userInfo, navigate]);
    const submitHandler = (e) => {
        e.preventDefault();
        ctxDispatch({
            type: 'SAVE_SHIPPING_ADDRESS',
            payload: {
                fullName,
                phoneNumber,
                address,
                district,
                province,
                postalCode,
            },
        });
        localStorage.setItem(
            'shippingAddress',
            JSON.stringify({
                fullName,
                phoneNumber,
                address,
                district,
                province,
                postalCode,
            })
        );
        navigate('/payment');
    };
    return (
        <div>
            <Helmet>
                <title>Shipping Address</title>
            </Helmet>
            <CheckoutSteps step1 step2></CheckoutSteps>
            <div className="container-fluid small-container">
                <h1 className="my-3">Shipping Address</h1>
                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="phoneNumber">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            type="tel"
                            pattern="[0-9]{10}"
                            required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                            placeholder="Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="district">
                        <Form.Label>District</Form.Label>
                        <Form.Control
                            placeholder="District"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="province">
                        <Form.Label>Province</Form.Label>
                        <Form.Control
                            placeholder="Province"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="postalCode">
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control
                            placeholder="Postal Code"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            type='any'
                            pattern="[0-9]{5}"
                            required />
                    </Form.Group>
                    <div className="mb-3">
                        <Button variant="primary" type="submit">
                            Continue
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}