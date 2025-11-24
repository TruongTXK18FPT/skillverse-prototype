import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/skillverse.png';
import './HologramForgotPasswordForm.css';

const HologramForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="fgp-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Borders */}
      <div className="fgp-border">
        <div className="fgp-border-corner top-left"></div>
        <div className="fgp-border-corner top-right"></div>
        <div className="fgp-border-corner bottom-left"></div>
        <div className="fgp-border-corner bottom-right"></div>
        <div className="fgp-border-line top"></div>
        <div className="fgp-border-line bottom"></div>
        <div className="fgp-border-line left"></div>
        <div className="fgp-border-line right"></div>
      </div>

      <div className="fgp-content">
        {/* Header */}
        <div className="fgp-header">
            <div className="fgp-icon-container">
                <img src={Logo} alt="SkillVerse" style={{ width: '60px', height: 'auto' }} />
            </div>
            <h1 className="fgp-title">RECOVERY PROTOCOL</h1>
            <p className="fgp-subtitle">RESTORE ACCESS TO YOUR ACCOUNT</p>
        </div>

        {isSubmitted ? (
            <div className="fgp-success-message">
                <CheckCircle className="fgp-success-icon" />
                <h3 className="fgp-success-text">RECOVERY LINK TRANSMITTED</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--holo-text-dim)', marginBottom: '1rem' }}>
                    We have sent password reset instructions to <strong>{email}</strong>. 
                    Please check your inbox.
                </p>
                <div className="fgp-footer">
                    <Link to="/login" className="fgp-back-link" style={{ color: 'var(--holo-success)', justifyContent: 'center' }}>
                        <ArrowLeft size={16} />
                        <span>RETURN TO LOGIN</span>
                    </Link>
                </div>
            </div>
        ) : (
            <>
                {error && (
                    <div className="fgp-error-message">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="fgp-form">
                    <div className="fgp-field">
                        <label className="fgp-label">
                            <Mail size={14} />
                            <span>EMAIL ADDRESS</span>
                        </label>
                        <div className="fgp-input-wrapper">
                            <input 
                                type="email" 
                                className="fgp-input"
                                placeholder="operator@skillverse.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button type="submit" className="fgp-submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="fgp-spinner" size={18} />
                                <span>TRANSMITTING...</span>
                            </>
                        ) : (
                            <>
                                <span>INITIATE RECOVERY</span>
                            </>
                        )}
                        <div className="fgp-btn-glow"></div>
                    </button>
                </form>

                <div className="fgp-footer">
                    <Link to="/login" className="fgp-back-link">
                        <ArrowLeft size={16} />
                        <span>ABORT & RETURN TO LOGIN</span>
                    </Link>
                </div>
            </>
        )}
      </div>
      
      <div className="fgp-flicker"></div>
    </motion.div>
  );
};

export default HologramForgotPasswordForm;
