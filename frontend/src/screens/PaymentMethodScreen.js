import React, { useContext, useEffect, useState } from "react";
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Helmet } from "react-helmet-async";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";

export default function PaymentMethodScreen() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { shippingAddress, paymentMethod },
    } = state;
    const [paymentMethodName, setPaymentMethod] = useState(paymentMethod || 'PromptPay');
    useEffect(() => {
        if(!shippingAddress.address) {
            navigate('/shipping');
        }
    }, [shippingAddress, navigate]);
    const submitHandler = (e) => {
        e.preventDefault();
        ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: paymentMethodName});
        localStorage.setItem('paymentMethod', paymentMethodName);
        navigate('/placeorder');
    };

    return (
        <div>
            <CheckoutSteps step1 step2 step3></CheckoutSteps>
            <div className="container-fluid small-container">
            <Helmet>
                <title>Payment Method</title>
            </Helmet>
            <h1 className="my-3">Payment Method</h1>
            <Form onSubmit={submitHandler}>
                <div className="mb-3">
                    <Form.Check
                        type='radio'
                        id='PromptPay'
                        label='PromptPay'
                        value='PromptPay'
                        checked={paymentMethodName === 'PromptPay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <Button type='submit'>Continue</Button>
                </div>
            </Form>
            </div>
        </div>
    )
}