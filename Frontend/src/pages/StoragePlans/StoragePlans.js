/**
 * StoragePlans Page - Display storage upgrade plans as a full page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentConfirmModal from '../../components/PaymentConfirmModal/PaymentConfirmModal';
import { useToast, ToastContainer } from '../../components/Toast/Toast';

// Helper functions to manage current plan in localStorage
const getCurrentPlan = () => {
  const saved = localStorage.getItem('currentPlan');
  return saved ? JSON.parse(saved) : { id: 'free', storage: 10 };
};

const setCurrentPlan = (plan) => {
  localStorage.setItem('currentPlan', JSON.stringify(plan));
};

// Convert USD to INR (approximate rate: 1 USD = 83 INR)
const convertToINR = (usdPrice) => {
  return Math.round(usdPrice * 83);
};

const StoragePlansPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const { toasts, success, error, removeToast } = useToast();
  const [currentPlan, setCurrentPlanState] = useState(getCurrentPlan());
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: '',
  });

  // Update current plan state when component mounts
  useEffect(() => {
    setCurrentPlanState(getCurrentPlan());
  }, []);

  const currentStorage = currentPlan.storage;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      storage: 10,
      price: 0,
      priceINR: 0,
      period: 'forever',
      features: [
        '10 GB storage',
        'Basic file sharing',
        'Standard support',
        'Mobile app access',
      ],
      popular: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      storage: 100,
      price: 1.99,
      priceINR: convertToINR(1.99),
      period: 'month',
      features: [
        '100 GB storage',
        'Advanced file sharing',
        'Priority support',
        'Mobile app access',
        'File versioning',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      storage: 500,
      price: 9.99,
      priceINR: convertToINR(9.99),
      period: 'month',
      features: [
        '500 GB storage',
        'Advanced file sharing',
        '24/7 priority support',
        'Mobile app access',
        'File versioning',
        'Advanced security',
        'Team collaboration',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      storage: 2000,
      price: 29.99,
      priceINR: convertToINR(29.99),
      period: 'month',
      features: [
        '2 TB storage',
        'Unlimited file sharing',
        '24/7 dedicated support',
        'Mobile app access',
        'File versioning',
        'Advanced security',
        'Team collaboration',
        'Custom integrations',
        'Admin controls',
      ],
      popular: false,
    },
  ];

  const handlePlanSelect = (plan) => {
    if (plan.id === currentPlan.id) {
      error(`You are already on the ${plan.name} plan!`);
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.replace(/\s/g, '').length <= 16) {
        setPaymentData({ ...paymentData, [name]: formatted });
      }
      return;
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formatted.length <= 5) {
        setPaymentData({ ...paymentData, [name]: formatted });
      }
      return;
    }
    
    // Format CVV
    if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '');
      if (formatted.length <= 3) {
        setPaymentData({ ...paymentData, [name]: formatted });
      }
      return;
    }
    
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // Validate payment details
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.name || !paymentData.email) {
      error('Please fill in all payment details');
      return;
    }

    // Show payment confirmation modal
    setShowPaymentConfirm(true);
  };
  
  const handleConfirmPayment = () => {
    // Simulate successful payment
    setTimeout(() => {
      // Save the new plan to localStorage
      const newPlan = {
        id: selectedPlan.id,
        name: selectedPlan.name,
        storage: selectedPlan.storage,
      };
      setCurrentPlan(newPlan);
      setCurrentPlanState(newPlan);
      
      success(`Payment successful! Your ${selectedPlan.name} plan with ${selectedPlan.storage} GB storage is now active.`);
      setShowPayment(false);
      setShowPaymentConfirm(false);
      setSelectedPlan(null);
      
      // Refresh the page to update sidebar storage display
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 1000);
  };

  const handleBack = () => {
    if (showPayment) {
      setShowPayment(false);
      setSelectedPlan(null);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="storage-plans-page">
            <div className="storage-plans-page-header">
              <button className="storage-plans-back-btn" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
                </svg>
                <span>Back to Dashboard</span>
              </button>
              {!showPayment && (
                <div className="storage-plans-page-title">
                  <h1>Upgrade Your Storage</h1>
                  <p>Choose the perfect plan for your needs</p>
                </div>
              )}
            </div>

            {!showPayment ? (
              <div className="storage-plans-page-content">
                <div className="storage-plans-grid">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`storage-plan-card ${plan.popular ? 'popular' : ''} ${plan.storage <= currentStorage ? 'current' : ''}`}
                    >
                      {plan.popular && (
                        <div className="plan-badge">Most Popular</div>
                      )}
                      {plan.id === currentPlan.id && (
                        <div className="plan-badge current-badge">Current Plan</div>
                      )}
                      
                      <div className="plan-header">
                        <h3>{plan.name}</h3>
                        <div className="plan-price">
                          <span className="price-amount">₹{plan.priceINR}</span>
                          {plan.price > 0 && (
                            <span className="price-period">/{plan.period}</span>
                          )}
                        </div>
                      </div>

                      <div className="plan-storage">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
                        </svg>
                        <span>{plan.storage} GB</span>
                      </div>

                      <ul className="plan-features">
                        {plan.features.map((feature, index) => (
                          <li key={index}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#34A853"/>
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        className={`plan-button ${plan.id === currentPlan.id ? 'current' : ''}`}
                        onClick={() => handlePlanSelect(plan)}
                        disabled={plan.id === currentPlan.id}
                      >
                        {plan.id === currentPlan.id ? 'Current Plan' : plan.price === 0 ? 'Select Free' : 'Upgrade Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="payment-section">
                <div className="payment-header">
                  <h2>Complete Your Purchase</h2>
                  <div className="selected-plan-summary">
                    <h3>{selectedPlan.name} Plan</h3>
                    <p>{selectedPlan.storage} GB Storage</p>
                    <div className="plan-total">
                      <span>₹{selectedPlan.priceINR}</span>
                      <span>/month</span>
                    </div>
                  </div>
                </div>

                <form className="payment-form" onSubmit={handlePaymentSubmit}>
                  <div className="payment-section-title">Payment Information</div>
                  
                  <div className="form-group">
                    <label>Card Number</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentData.cardNumber}
                        onChange={handlePaymentChange}
                        maxLength="19"
                        required
                      />
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V8H20V18Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={handlePaymentChange}
                        maxLength="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={handlePaymentChange}
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={paymentData.name}
                      onChange={handlePaymentChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={paymentData.email}
                      onChange={handlePaymentChange}
                      required
                    />
                  </div>

                  <div className="payment-summary">
                    <div className="summary-row">
                      <span>Plan:</span>
                      <span>{selectedPlan.name} ({selectedPlan.storage} GB)</span>
                    </div>
                    <div className="summary-row">
                      <span>Billing:</span>
                      <span>Monthly</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₹{selectedPlan.priceINR}/month</span>
                    </div>
                  </div>

                  <button type="submit" className="payment-submit-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    Complete Payment
                  </button>

                  <div className="payment-security">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1L3 5V11C3 16.55 6.16 21.74 12 23C17.84 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.9 16 12.5 16 13.5V16.5C16 17.6 15.1 18.5 14 18.5H10C8.9 18.5 8 17.6 8 16.5V13.5C8 12.5 8.6 11.9 9.2 11.5V10C9.2 8.6 10.6 7 12 7ZM12 8.2C11.2 8.2 10.5 8.7 10.5 9.5V11.5H13.5V9.5C13.5 8.7 12.8 8.2 12 8.2Z" fill="#34A853"/>
                    </svg>
                    <span>Secure payment powered by SSL encryption</span>
                  </div>
                </form>
              </div>
            )}
      
      <PaymentConfirmModal
        isOpen={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        onConfirm={handleConfirmPayment}
        planName={selectedPlan?.name || ''}
        planStorage={selectedPlan?.storage || ''}
        price={selectedPlan?.priceINR || 0}
        currency="₹"
        billingPeriod="month"
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default StoragePlansPage;
