import React from 'react';
import { AlertTriangle, XCircle, X } from 'lucide-react';
import './SeminarErrorDisplay.css';

interface SeminarErrorDisplayProps {
  errors?: string | string[];
  onClose?: () => void;
  className?: string;
}

/**
 * Component to display seminar validation errors with proper styling
 * Specific to seminar forms to avoid CSS conflicts
 */
export const SeminarErrorDisplay: React.FC<SeminarErrorDisplayProps> = ({ errors, onClose, className = '' }) => {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return null;
  }

  const errorArray = Array.isArray(errors) ? errors : [errors];

  return (
    <div className={`seminar-error-display ${className}`}>
      <div className="seminar-error-display__header">
        <div className="seminar-error-display__icon">
          <AlertTriangle size={20} />
        </div>
        <span className="seminar-error-display__title">Vui lòng kiểm tra lại thông tin</span>
        {onClose && (
          <button onClick={onClose} className="seminar-error-display__close" type="button">
            <X size={18} />
          </button>
        )}
      </div>
      <ul className="seminar-error-display__list">
        {errorArray.map((error, index) => (
          <li key={index} className="seminar-error-display__item">
            <XCircle size={14} className="seminar-error-display__item-icon" />
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface SeminarFieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * Component to display seminar field-specific error
 * Uses BEM naming to avoid conflicts
 */
export const SeminarFieldError: React.FC<SeminarFieldErrorProps> = ({ error, className = '' }) => {
  if (!error) {
    return null;
  }

  return (
    <div className={`seminar-field-error ${className}`}>
      <XCircle size={14} className="seminar-field-error__icon" />
      <span className="seminar-field-error__text">{error}</span>
    </div>
  );
};
