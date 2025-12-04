import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { MeowlSkinProvider } from './context/MeowlSkinContext';
import { MentorRoute, AdminRoute, RecruiterRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/main/HomePage';
import DashboardPage from './pages/navbar/DashboardPage';
import CoursesPage from './pages/navbar/CoursesPage';
import MentorshipPage from './pages/navbar/MentorshipPage';
import CommunityHUD from './components/community-hud/CommunityHUD';
import PostDetailPage from './pages/community/PostDetailPage';
import CommunityDashboardPage from './pages/community/CommunityDashboardPage';
import BroadcastForm from './components/community-hud/BroadcastForm';
import JobsPage from './pages/navbar/JobsPage';
import CareerChatPage from './pages/navbar/CareerChatPage';
import CareerChatLanding from './pages/navbar/CareerChatLanding';
import ExpertChatPage from './pages/navbar/ExpertChatPage';
import Gamification from './pages/navbar/Gamification';
// import PortfolioPage from './pages/navbar/PortfolioPage';  // OLD - Backup
import TacticalDossierPortfolio from './components/portfolio-hud/TacticalDossierPortfolio'; // NEW - Mothership Theme
import PortfolioDebug from './pages/navbar/PortfolioDebug';
// import CVPage from './pages/navbar/CV';  // OLD - Backup
import DataCompilerPreview from './components/portfolio-hud/DataCompilerPreview'; // NEW - Mothership Theme
import ElevatorLoginPage from './pages/auth/ElevatorLoginPage';
import ElevatorPersonalRegisterPage from './pages/auth/ElevatorPersonalRegisterPage';
import ElevatorBusinessRegisterPage from './pages/auth/ElevatorBusinessRegisterPage';
import ElevatorMentorRegisterPage from './pages/auth/ElevatorMentorRegisterPage';
import ChooseRolePage from './pages/auth/ChooseRolePage';
import VerifyPage from './pages/auth/VerifyPage';
import AlreadyAuthenticatedWarning from './pages/auth/AlreadyAuthenticatedWarning';
import ElevatorForgotPasswordPage from './pages/auth/ElevatorForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SetPasswordPage from './pages/settings/SetPasswordPage';
import ChangePasswordPage from './pages/settings/ChangePasswordPage';
import Transactional from './pages/payment/Transactional';
import PremiumPageCosmic from './pages/payment/PremiumPageCosmic';
import ManagerPage from './pages/main/ManagerPage';
// import CoinWallet from './pages/main/CoinWallet'; // Replaced by MyWalletCosmic
import MyWalletCosmic from './pages/my-wallet/MyWalletCosmic';
import NotFoundPage from './pages/notfound/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Certificate from './components/Certificate';
import TermOfService from './pages/footer/TermOfService';
import PrivacyPolicy from './pages/footer/Privacy&Policy';
import HelpCenter from './pages/footer/HelpCenter';
import SeminarPage from './pages/navbar/SeminarPage';
import BusinessPage from './pages/main/BusinessPage';
import MentorPage from './pages/main/MentorPage';
import AllBadgesPage from './pages/mentor/AllBadgesPage';
import AdminPage from './pages/main/AdminPage';
import AiRoadmapPage from './pages/roadmap/AiRoadmapPage';
import RoadmapDetailPage from './pages/roadmap/RoadmapDetailPage';
import './styles/App.css';
import ScrollToTop from './components/scroll/ScrollToTop';
import CourseDetailPage from './pages/navbar/CourseDetailPage';
import CourseLearningPage from './pages/navbar/CourseLearningPage';
import QuizAttemptPage from './pages/quiz/QuizAttemptPage';
import ProfilePageCosmic from './pages/profile/ProfilePageCosmic';
import MentorProfilePage from './pages/mentor/MentorProfilePage';
import RecruiterProfilePage from './pages/business/RecruiterProfilePage';
import ProfileRouter from './components/ProfileRouter';
import MyApplicationsPage from './pages/user/MyApplicationsPage';
import ExploreMapPage from './pages/ExploreMapPage';
import AboutPage from './pages/about/AboutPage';
import NotificationPage from './pages/NotificationPage';
import MessengerPage from './pages/navbar/MessengerPage';
import UserBookingsPage from './pages/user/UserBookingsPage';
import MeowlBubbleNotification from './components/MeowlBubbleNotification';
import MeowlPetWrapper from './components/meowl-pet/MeowlPetWrapper';
import ForbiddenTemple from './components/easter-egg/ForbiddenTemple';

const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <MeowlSkinProvider>
            <Router>
            <div className="app-container">
              <ScrollToTop />
              <HeaderVisibilityWrapper />
              <div className="app__galaxy-bg">
                <div className="cosmic-dust">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="dust-particle"
                      style={{
                        left: `${Math.random() * 95}%`,
                        top: `${Math.random() * 95}%`,
                        animationDelay: `${Math.random() * 10}s`,
                        animationDuration: `${20 + Math.random() * 15}s`
                      }}
                    />
                  ))}
                </div>
                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/notifications" element={<NotificationPage />} />
                    <Route path="/messages" element={<MessengerPage />} />
                    <Route path="/my-bookings" element={<UserBookingsPage />} />
                    <Route path="/explore" element={<ExploreMapPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/roadmap" element={<AiRoadmapPage />} />
                    <Route path="/roadmap/:id" element={<RoadmapDetailPage />} />
                    <Route path="/mentorship" element={<MentorshipPage />} />
                    <Route path="/community" element={<CommunityHUD />} />
                    <Route path="/community/:id" element={<PostDetailPage />} />
                    <Route path="/community/create" element={<BroadcastForm />} />
                    <Route path="/community/manage" element={<CommunityDashboardPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/chatbot" element={<CareerChatLanding />} />
                    <Route path="/chatbot/general" element={<CareerChatPage />} />
                    <Route path="/chatbot/expert" element={<ExpertChatPage />} />
                    <Route path="/gamification" element={<Gamification />} />
                    {/* <Route path="/portfolio" element={<PortfolioPage />} /> */}  {/* BACKUP - Old Portfolio */}
                    <Route path="/portfolio" element={<TacticalDossierPortfolio />} />  {/* ACTIVE - Mothership Theme */}
                    <Route path="/portfolio/:slug" element={<TacticalDossierPortfolio />} />
                    <Route path="/portfolio-debug" element={<PortfolioDebug />} />
                    {/* <Route path="/cv" element={<CVPage />} /> */}  {/* BACKUP - Old CV Page */}
                    <Route path="/cv" element={<DataCompilerPreview />} />  {/* ACTIVE - Mothership Theme */}
                    <Route path="/certificate/:id" element={<Certificate />} />
                    <Route path="/login" element={<ElevatorLoginPage />} />
                    <Route path="/auth-warning" element={<AlreadyAuthenticatedWarning />} />
                    <Route path="/choose-role" element={<ChooseRolePage />} />
                    <Route path="/register" element={<ElevatorPersonalRegisterPage />} />
                    <Route path="/register/business" element={<ElevatorBusinessRegisterPage />} />
                    <Route path="/register/mentor" element={<ElevatorMentorRegisterPage />} />
                    <Route path="/verify-otp" element={<VerifyPage />} />
                    <Route path="/forgot-password" element={<ElevatorForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/set-password" element={<SetPasswordPage />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    
                    {/* Profile Routes by Role */}
                    <Route path="/profile" element={<ProfileRouter />} />
                    <Route path="/profile/user" element={<ProfilePageCosmic />} />
                    <Route path="/profile/mentor" element={<MentorProfilePage />} />
                    <Route path="/profile/business" element={<RecruiterProfilePage />} />
                    
  
                    <Route path="/payment/transactional" element={<Transactional />} />
                    <Route path="/premium" element={<PremiumPageCosmic />} />
                    <Route path="/manager" element={<ManagerPage />} />
                    <Route path="/wallet" element={<MyWalletCosmic />} />
                    <Route path="/my-wallet" element={<MyWalletCosmic />} />
                    <Route path="/seminar" element={<SeminarPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/course-learning" element={<CourseLearningPage />} />
                    <Route path="/quiz/:quizId/attempt" element={<QuizAttemptPage />} />

                    {/* Add the missing footer routes */}

                    {/* Add these missing footer routes */}
                    <Route path="/help-center" element={<HelpCenter />} />
                    <Route path="/terms-of-service" element={<TermOfService />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    
                    {/* User My Applications */}
                    <Route path="/my-applications" element={<MyApplicationsPage />} />

                    {/* Protected Routes */}
                    <Route path="/business" element={
                      <RecruiterRoute>
                        <BusinessPage />
                      </RecruiterRoute>
                    } />
                    <Route path="/mentor" element={
                      <MentorRoute>
                        <MentorPage />
                      </MentorRoute>
                    } />
                    <Route path="/mentor/badges" element={
                      <MentorRoute>
                        <AllBadgesPage />
                      </MentorRoute>
                    } />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    } />

                    {/* Unauthorized Access */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />

                    {/* Easter Egg Route */}
                    <Route path="/pray" element={<ForbiddenTemple />} />

                    {/* Catch-all route for 404 errors - must be last */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <FooterVisibilityWrapper />
                <MeowlBubbleWrapper />
                <MeowlPetWrapper />
              </div>
            </div>
          </Router>
          </MeowlSkinProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;

// Routes that need full-screen layout (no header/footer)
const fullScreenRoutes = new Set<string>([
  '/login',
  '/register',
  '/register/business',
  '/register/mentor',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
]);

// Routes that only hide footer (keep header visible)
const hideFooterOnlyRoutes = new Set<string>([
  '/choose-role',
  '/chatbot',
  '/chatbot/general',
  '/chatbot/expert',
  '/roadmap',
  '/cv',
  '/admin',
  '/course-learning',
  '/notifications',
  '/messages',
]);

// Check if path matches quiz attempt pattern
const isQuizAttemptRoute = (pathname: string) => {
  return /^\/quiz\/\d+\/attempt$/.test(pathname);
};

// Hide Header on specific routes
const HeaderVisibilityWrapper = () => {
  const location = useLocation();
  if (fullScreenRoutes.has(location.pathname)) return null;
  return <Header />;
};

// Hide Footer on specific routes
const FooterVisibilityWrapper = () => {
  const location = useLocation();
  if (fullScreenRoutes.has(location.pathname) || hideFooterOnlyRoutes.has(location.pathname) || isQuizAttemptRoute(location.pathname)) {
    return null;
  }
  return <Footer />;
};

// Routes where Meowl Bubble should NOT appear
const hideMeowlBubbleRoutes = new Set<string>([
  '/login',
  '/register',
  '/register/business',
  '/register/mentor',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/chatbot/general',
  '/chatbot/expert',
  '/admin',
]);

// Meowl Bubble Notification Wrapper
const MeowlBubbleWrapper = () => {
  const location = useLocation();
  const shouldHide = hideMeowlBubbleRoutes.has(location.pathname) || isQuizAttemptRoute(location.pathname);
  return <MeowlBubbleNotification disabled={shouldHide} />;
};
