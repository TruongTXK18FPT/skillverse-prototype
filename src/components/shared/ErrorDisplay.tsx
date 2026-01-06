import React from 'react';
import { AlertTriangle, XCircle, X } from 'lucide-react';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  errors?: string | string[];
  onClose?: () => void;
  className?: string;
}

/**
 * Component to display validation errors with proper styling
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, onClose, className = '' }) => {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return null;
  }

  const errorArray = Array.isArray(errors) ? errors : [errors];

  return (
    <div className={`error-display ${className}`}>
      <div className="error-display-header">
        <div className="error-display-icon">
          <AlertTriangle size={20} />
        </div>
        <span className="error-display-title">Vui lòng kiểm tra lại thông tin</span>
        {onClose && (
          <button onClick={onClose} className="error-display-close">
            <X size={18} />
          </button>
        )}
      </div>
      <ul className="error-display-list">
        {errorArray.map((error, index) => (
          <li key={index} className="error-display-item">
            <XCircle size={14} className="error-display-item-icon" />
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface FieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * Component to display field-specific error
 */
export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) {
    return null;
  }

  return (
    <div className={`field-error ${className}`}>
      <XCircle size={14} className="field-error-icon" />
      <span className="field-error-text">{error}</span>
    </div>
  );
};
