import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../assets/Logo.jpg';
import '../../styles/LoginPage.css';

const LoginPage = () => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt with:', { email, password });
  };

  return (
    <div className="login-container" data-theme={theme}>
      <div className="login-content">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-wrapper">
            <img src={Logo} alt="Skillverse Logo" className="logo-image" />
          </div>
          <span className="logo-title">Skillverse</span>
        </div>

        {/* Welcome Text */}
        <div className="login-welcome">
          <h1>Chào mừng trở lại!</h1>
          <p>Đăng nhập để tiếp tục hành trình học tập của bạn</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="login-input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="login-button">
            Đăng nhập
          </button>
        </form>

        {/* Social Login */}
        <div className="social-login">
          <div className="divider">
            <span>Hoặc đăng nhập với</span>
          </div>
          <div className="social-buttons">
            <button className="social-button google">
              <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google" className="social-icon" />
              <span>Google</span>
            </button>
            <button className="social-button facebook">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png" alt="Facebook" className="social-icon" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="register-link">
          <span>Chưa có tài khoản?</span>
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;