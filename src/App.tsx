import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/main/HomePage';
import DashboardPage from './pages/navbar/DashboardPage';
import CoursesPage from './pages/navbar/CoursesPage';
import MentorshipPage from './pages/navbar/MentorshipPage';
import CommunityPage from './pages/navbar/CommunityPage';
import JobsPage from './pages/navbar/JobsPage';
import ChatbotPage from './pages/navbar/ChatbotPage';
import Gamification from './pages/navbar/Gamification';
import PortfolioPage from './pages/navbar/PortfolioPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import ForgotPasswordPage from './pages/login/ForgotPasswordPage';
import PaymentPage from './pages/payment/PaymentPage';
import PremiumPage from './pages/payment/PremiumPage';
import ManagerPage from './pages/main/ManagerPage';
import CoinWallet from './pages/main/CoinWallet';
import BlogForm from './pages/community/BlogForm';
import NotFoundPage from './pages/notfound/NotFoundPage';

import TermOfService from './pages/footer/TermOfService';
import PrivacyPolicy from './pages/footer/Privacy&Policy';
import HelpCenter from './pages/footer/HelpCenter';
import SeminarPage from './pages/navbar/SeminarPage';
import './styles/App.css';

const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <div className="app-container">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/mentorship" element={<MentorshipPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/create" element={<BlogForm />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/payment/:type/:id" element={<PaymentPage />} />
                <Route path="/manager" element={<ManagerPage />} />
                <Route path="/wallet" element={<CoinWallet />} />
                <Route path="/seminar" element={<SeminarPage />} />
                
                {/* Add these missing footer routes */}
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/terms-of-service" element={<TermOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Catch-all route for 404 errors - must be last */}
                <Route path="*" element={<NotFoundPage />} />
                {/* Admin Page - ensure this is protected or only accessible to admins */}
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;