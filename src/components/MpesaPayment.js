import React, { useState } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const MpesaPayment = ({ orderId, amount }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Format phone number if needed
      let formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '254' + phone.substring(1);
      } else if (!phone.startsWith('254')) {
        formattedPhone = '254' + phone;
      }

      const response = await axios.post('/api/payments/mpesa/stk-push', {
        phone: formattedPhone,
        amount,
        orderId
      });
      
      setSuccess('STK push sent to your phone. Please enter your M-Pesa PIN to complete payment.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to initiate M-Pesa payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mpesa-payment-form">
      <h4>Pay with M-Pesa</h4>
      <p>Amount to pay: KES {amount}</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter M-Pesa phone number (e.g., 0712345678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.trim())}
            required
          />
          <Form.Text className="text-muted">
            Enter the phone number registered with M-Pesa
          </Form.Text>
        </Form.Group>
        
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Processing...
            </>
          ) : (
            'Pay with M-Pesa'
          )}
        </Button>
      </Form>
    </div>
  );
};

export default MpesaPayment;
