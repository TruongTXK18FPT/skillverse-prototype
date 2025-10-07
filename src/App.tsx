import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { MentorRoute, AdminRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/main/HomePage';
import DashboardPage from './pages/navbar/DashboardPage';
import CoursesPage from './pages/navbar/CoursesPage';
import MentorshipPage from './pages/navbar/MentorshipPage';
import CommunityPage from './pages/navbar/CommunityPage';
import JobsPage from './pages/navbar/JobsPage';
import ChatbotPage from './pages/navbar/ChatbotPage';
import AiChatbotPage from './pages/navbar/AiChatbotPage';
import Gamification from './pages/navbar/Gamification';
import PortfolioPage from './pages/navbar/PortfolioPage';
import CVPage from './pages/navbar/CV';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import BusinessRegisterPage from './pages/auth/BusinessRegisterPage';
import MentorRegisterPage from './pages/auth/MentorRegisterPage';
import VerifyPage from './pages/auth/VerifyPage';
import ForgotPasswordPage from './pages/login/ForgotPasswordPage';
import PaymentPage from './pages/payment/PaymentPage';
import Transactional from './pages/payment/Transactional';
import PremiumPage from './pages/payment/PremiumPage';
import ManagerPage from './pages/main/ManagerPage';
import CoinWallet from './pages/main/CoinWallet';
import BlogForm from './pages/community/BlogForm';
import NotFoundPage from './pages/notfound/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Certificate from './components/Certificate';
import TermOfService from './pages/footer/TermOfService';
import PrivacyPolicy from './pages/footer/Privacy&Policy';
import HelpCenter from './pages/footer/HelpCenter';
import SeminarPage from './pages/navbar/SeminarPage';
import BusinessPage from './pages/main/BusinessPage';
import MentorPage from './pages/main/MentorPage';
import AdminPage from './pages/main/AdminPage';
import AiRoadmapPage from './pages/roadmap/AiRoadmapPage';
import './styles/App.css';
import ScrollToTop from './components/scroll/ScrollToTop';
import CourseDetailPage from './pages/navbar/CourseDetailPage';
import CourseLearningPage from './pages/navbar/CourseLearningPage';
import ProfilePage from './pages/profile/ProfilePage';
const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="app-container">
              <ScrollToTop />
              <Header />
              <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/roadmap" element={<AiRoadmapPage />} />
                <Route path="/mentorship" element={<MentorshipPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/create" element={<BlogForm />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/chatbot" element={<AiChatbotPage />} />
                <Route path="/chatbot-old" element={<ChatbotPage />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/cv" element={<CVPage />} />
                <Route path="/certificate/:id" element={<Certificate />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/business" element={<BusinessRegisterPage />} />
                <Route path="/register/mentor" element={<MentorRegisterPage />} />
                <Route path="/verify-otp" element={<VerifyPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/payment/transactional" element={<Transactional />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/payment/:type/:id" element={<PaymentPage />} />
                <Route path="/manager" element={<ManagerPage />} />
                <Route path="/wallet" element={<CoinWallet />} />
                <Route path="/seminar" element={<SeminarPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/course-learning" element={<CourseLearningPage />} />

                {/* Add the missing footer routes */}
                
                {/* Add these missing footer routes */}
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/terms-of-service" element={<TermOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/business" element={<BusinessPage />} />
                
                {/* Protected Routes */}
                <Route path="/mentor" element={
                  <MentorRoute>
                    <MentorPage />
                  </MentorRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                } />
                
                {/* Unauthorized Access */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Catch-all route for 404 errors - must be last */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <FooterVisibilityWrapper />
          </div>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;

// Hide Footer on specific routes (e.g., chatbot needs full-screen)
const FooterVisibilityWrapper = () => {
  const location = useLocation();
  const hideOn = new Set<string>([
    '/chatbot',
  ]);
  if (hideOn.has(location.pathname)) return null;
  return <Footer />;
};