import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import '../../styles/AuthPages.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail()) {
      // Handle password reset logic here
      console.log('Reset password for:', email);
      setIsSubmitted(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <button onClick={() => navigate(-1)} className="back-button">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1>Check Your Email</h1>
            <p>We've sent password reset instructions to your email</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✉️</div>
            <h2>Email Sent Successfully!</h2>
            <p>
              We've sent an email to <strong>{email}</strong> with instructions to reset your
              password. The link will expire in 1 hour.
            </p>
            <div className="next-steps">
              <h3>Next Steps:</h3>
              <ol>
                <li>Check your email inbox</li>
                <li>Click the reset password link in the email</li>
                <li>Create your new password</li>
              </ol>
            </div>
            <p className="note">
              Didn't receive the email? Check your spam folder or{' '}
              <button onClick={() => setIsSubmitted(false)} className="resend-link">
                try again
              </button>
            </p>
          </div>

          <div className="auth-footer">
            <p>Remember your password?</p>
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </div>

        <div className="auth-background">
          <div className="auth-features">
            <h2>Account Security Tips</h2>
            <ul>
              <li>
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h3>Strong Password</h3>
                  <p>Use a combination of letters, numbers, and symbols</p>
                </div>
              </li>
              <li>
                <div className="feature-icon">🔄</div>
                <div className="feature-text">
                  <h3>Regular Updates</h3>
                  <p>Change your password periodically</p>
                </div>
              </li>
              <li>
                <div className="feature-icon">📱</div>
                <div className="feature-text">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Reset Password</h1>
          <p>Enter your email address to receive password reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={error ? 'error' : ''}
              />
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="submit-button">
            Send Reset Instructions
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="auth-footer">
          <p>Remember your password?</p>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-features">
          <h2>Need Help?</h2>
          <ul>
            <li>
              <div className="feature-icon">❓</div>
              <div className="feature-text">
                <h3>Can't Access Email?</h3>
                <p>Contact our support team for assistance</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🔑</div>
              <div className="feature-text">
                <h3>Account Recovery</h3>
                <p>Alternative ways to recover your account</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">
                <h3>Security Check</h3>
                <p>Verify your identity to protect your account</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 