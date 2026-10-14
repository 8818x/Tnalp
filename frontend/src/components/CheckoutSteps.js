import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function CheckoutSteps(props) {
    const steps = [
        { label: 'Sign in', done: props.step1 },
        { label: 'Shipping', done: props.step2 },
        { label: 'Payment', done: props.step3 },
        { label: 'Place Order', done: props.step4 },
    ];
    // the last completed step is the current one; earlier steps show as done
    let currentIdx = -1;
    steps.forEach((s, i) => {
        if (s.done) currentIdx = i;
    });
    return (
        <Row className="checkout-steps">
            {steps.map((s, i) => (
                <Col
                    key={s.label}
                    className={i < currentIdx ? 'completed' : i === currentIdx ? 'current' : ''}>
                    {i <= currentIdx ? '✓ ' : `${i + 1}. `}
                    {s.label}
                </Col>
            ))}
        </Row>
    );
}
