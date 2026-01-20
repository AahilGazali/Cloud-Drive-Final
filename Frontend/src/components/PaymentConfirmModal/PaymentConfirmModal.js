/**
 * PaymentConfirmModal Component - Modal for confirming payment
 */

import React from 'react';

const PaymentConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  planName,
  planStorage,
  price,
  currency = '₹',
  billingPeriod = 'month'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="payment-confirm-modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="payment-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-confirm-modal-header">
          <div className="payment-confirm-modal-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 16L16 11L14.59 9.59L11 13.17L8.41 10.59L7 12L11 16Z" 
                fill="#34a853"
              />
            </svg>
          </div>
          <h2 className="payment-confirm-modal-title">Confirm Payment</h2>
        </div>

        <div className="payment-confirm-modal-content">
          <div className="payment-confirm-details">
            <div className="payment-confirm-detail-row">
              <span className="payment-confirm-label">Plan:</span>
              <span className="payment-confirm-value">{planName} ({planStorage} GB)</span>
            </div>
            <div className="payment-confirm-detail-row">
              <span className="payment-confirm-label">Billing:</span>
              <span className="payment-confirm-value">Monthly</span>
            </div>
            <div className="payment-confirm-detail-row payment-confirm-total">
              <span className="payment-confirm-label">Total:</span>
              <span className="payment-confirm-value">{currency}{price}/{billingPeriod}</span>
            </div>
          </div>
          <p className="payment-confirm-message">
            You will be charged {currency}{price} per {billingPeriod} for the {planName} plan. This subscription will automatically renew.
          </p>
        </div>

        <div className="payment-confirm-modal-footer">
          <button 
            type="button" 
            className="payment-confirm-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="payment-confirm-modal-confirm"
            onClick={handleConfirm}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmModal;
