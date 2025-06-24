import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/AuthPages.css';

const ForgotPasswordPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { translations } = useLanguage();

  const validateEmail = () => {
    if (!email.trim()) {
      setError(translations.auth.errors.emailRequired);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(translations.auth.errors.emailInvalid);
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
              <span>{translations.common.back}</span>
            </button>
            <h1>{translations.auth.checkEmail}</h1>
            <p>{translations.auth.resetInstructionsSent}</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✉️</div>
            <h2>{translations.auth.emailSentSuccess}</h2>
            <p>
              {translations.auth.resetEmailSentTo} <strong>{email}</strong> {translations.auth.resetLinkExpiry}
            </p>
            <div className="next-steps">
              <h3>{translations.auth.nextSteps}:</h3>
              <ol>
                <li>{translations.auth.checkInbox}</li>
                <li>{translations.auth.clickResetLink}</li>
                <li>{translations.auth.createNewPassword}</li>
              </ol>
            </div>
            <p className="note">
              {translations.auth.noEmailReceived}{' '}
              <button onClick={() => setIsSubmitted(false)} className="resend-link">
                {translations.auth.tryAgain}
              </button>
            </p>
          </div>

          <div className="auth-footer">
            <p>{translations.auth.rememberPassword}</p>
            <Link to="/login" className="auth-link">
              {translations.auth.signIn}
            </Link>
          </div>
        </div>

        <div className="auth-background">
          <div className="auth-features">
            <h2>{translations.auth.securityTips}</h2>
            <ul>
              <li>
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h3>{translations.auth.strongPassword}</h3>
                  <p>{translations.auth.passwordTip}</p>
                </div>
              </li>
              <li>
                <div className="feature-icon">🔄</div>
                <div className="feature-text">
                  <h3>{translations.auth.regularUpdates}</h3>
                  <p>{translations.auth.updatesTip}</p>
                </div>
              </li>
              <li>
                <div className="feature-icon">📱</div>
                <div className="feature-text">
                  <h3>{translations.auth.twoFactor}</h3>
                  <p>{translations.auth.twoFactorTip}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );  }

  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-content">
        <div className="auth-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>{translations.common.back}</span>
          </button>
          <h1>{translations.auth.resetPassword}</h1>
          <p>{translations.auth.resetInstructions}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{translations.auth.emailAddress}</label>
            <div className="input-group">
              <Mail className="auth-input-icon" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleChange}
                placeholder={translations.auth.enterEmail}
                className={error ? 'error' : ''}
              />
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="submit-button">
            {translations.auth.sendResetInstructions}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="auth-footer">
          <p>{translations.auth.rememberPassword}</p>
          <Link to="/login" className="auth-link">
            {translations.auth.signIn}
          </Link>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-features">
          <h2>{translations.auth.needHelp}</h2>
          <ul>
            <li>
              <div className="feature-icon">❓</div>
              <div className="feature-text">
                <h3>{translations.auth.cantAccessEmail}</h3>
                <p>{translations.auth.contactSupport}</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🔑</div>
              <div className="feature-text">
                <h3>{translations.auth.accountRecovery}</h3>
                <p>{translations.auth.alternativeRecovery}</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">
                <h3>{translations.auth.securityCheck}</h3>
                <p>{translations.auth.verifyIdentity}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;