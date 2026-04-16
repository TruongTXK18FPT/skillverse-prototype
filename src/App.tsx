import { lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { MeowlSkinProvider } from "./context/MeowlSkinContext";
import { MeowlStateProvider } from "./context/MeowlStateContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import { ChatSettingsProvider } from "./context/ChatSettingsContext";
import { ToastProvider } from "./context/ToastContext";
import {
  AuthenticatedRoute,
  MentorRoute,
  AdminRoute,
  RecruiterRoute,
  PremiumAccessRoute,
  StudentOnlyRoute,
} from "./components/shared/ProtectedRoute";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/main/HomePage";
import DashboardPage from "./pages/navbar/DashboardPage";
import CoursesPage from "./pages/navbar/CoursesPage";
import LearningReportPage from "./pages/user/LearningReportPage";
import MentorshipPage from "./pages/navbar/MentorshipPage";
import CommunityHUD from "./components/community-hud/CommunityHUD";
import PostDetailPage from "./pages/community/PostDetailPage";
import CommunityDashboardPage from "./pages/community/CommunityDashboardPage";
import BroadcastForm from "./components/community-hud/BroadcastForm";
import JobsPage from "./pages/navbar/JobsPage";
import CareerChatPage from "./pages/navbar/CareerChatPage";
import CareerChatLanding from "./pages/navbar/CareerChatLanding";
import ExpertChatPage from "./pages/navbar/ExpertChatPage";
import Gamification from "./pages/navbar/Gamification";
// import PortfolioPage from './pages/navbar/PortfolioPage';  // OLD - Backup
import TacticalDossierPortfolio from "./components/portfolio-hud/TacticalDossierPortfolio"; // NEW - Mothership Theme
import DossierCreatePortfolioPage from "./components/portfolio-hud/DossierCreatePortfolioPage";
import PortfolioDebug from "./pages/navbar/PortfolioDebug";
// import CVPage from './pages/navbar/CV';  // OLD - Backup
import DataCompilerPreview from "./components/portfolio-hud/DataCompilerPreview"; // NEW - Mothership Theme
import ElevatorLoginPage from "./pages/auth/ElevatorLoginPage";
import ElevatorPersonalRegisterPage from "./pages/auth/ElevatorPersonalRegisterPage";
import ElevatorBusinessRegisterPage from "./pages/auth/ElevatorBusinessRegisterPage";
import ElevatorMentorRegisterPage from "./pages/auth/ElevatorMentorRegisterPage";
import ElevatorParentRegisterPage from "./pages/auth/ElevatorParentRegisterPage";
import ChooseRolePage from "./pages/auth/ChooseRolePage";
import VerifyPage from "./pages/auth/VerifyPage";
import AlreadyAuthenticatedWarning from "./pages/auth/AlreadyAuthenticatedWarning";
import ElevatorForgotPasswordPage from "./pages/auth/ElevatorForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SetPasswordPage from "./pages/settings/SetPasswordPage";
import ChangePasswordPage from "./pages/settings/ChangePasswordPage";
import Transactional from "./pages/payment/Transactional";
import PremiumPageCosmic from "./pages/payment/PremiumPageCosmic";
import ManagerPage from "./pages/main/ManagerPage";
// import CoinWallet from './pages/main/CoinWallet'; // Replaced by MyWalletCosmic
import MyWalletCosmic from "./pages/my-wallet/MyWalletCosmic";
import NotFoundPage from "./pages/notfound/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { ReportUserPage, MyReportsPage } from "./components/report";
import TermOfService from "./pages/footer/TermOfService";
import PrivacyPolicy from "./pages/footer/Privacy&Policy";
import HelpCenter from "./pages/footer/HelpCenter";
// import SeminarPage from "./pages/navbar/SeminarPage";
// import SeminarDetailPage from "./pages/navbar/SeminarDetailPage";
import BusinessPage from "./pages/main/BusinessPage";
// Mentor pages - organized in /pages/mentor/
import MentorDashboard from "./pages/mentor/MentorDashboard";
import AllBadgesPage from "./pages/mentor/AllBadgesPage";
import MentorGradingPage from "./pages/mentor/MentorGradingPage";
import CourseCreationPage from "./pages/mentor/course-builder/CourseCreationPage";
import { CourseManagementProvider } from "./context/mentor/CourseManagementContext";
import { MentorNoticeProvider } from "./context/mentor/MentorNoticeContext";
import AdminPage from "./pages/main/AdminPage";
import AdminSecurityPage from "./pages/admin/AdminSecurityPage";
import AdminAiGradingDashboard from "./pages/admin/AdminAiGradingDashboard";
import AdminCoursePreviewPage from "./pages/admin/AdminCoursePreviewPage";
import AiRoadmapPage from "./pages/roadmap/AiRoadmapPage";
import RoadmapDetailPage from "./pages/roadmap/RoadmapDetailPage";
import StudyPlannerPage from "./pages/study-planner/StudyPlannerPage";
import GSJJourneyPage from "./pages/journey/GSJJourneyPage";
import JourneyCreatePage from "./pages/journey/JourneyCreatePage";
import "./styles/App.css";
import ScrollToTop from "./components/scroll/ScrollToTop";
import CourseDetailPage from "./pages/navbar/CourseDetailPage";
import CourseLearningPage from "./pages/navbar/CourseLearningPage";
import AssignmentPage from "./pages/navbar/AssignmentPage";
import QuizAttemptPage from "./pages/quiz/QuizAttemptPage";
import ProfilePageCosmic from "./pages/profile/ProfilePageCosmic";
import MentorProfilePage from "./pages/mentor/MentorProfilePage";
import RecruiterProfilePage from "./pages/business/RecruiterProfilePage";
import RecruiterPublicProfilePage from "./pages/business/RecruiterPublicProfilePage";
import ProfileRouter from "./components/shared/ProfileRouter";
import JobLabPage from "./pages/user/JobLabPage";
import ExploreMapPage from "./pages/ExploreMapPage";
import AboutPage from "./pages/about/AboutPage";
import NotificationPage from "./pages/NotificationPage";
import MessengerPage from "./pages/navbar/MessengerPage";
import UserBookingsPage from "./pages/user/UserBookingsPage";
import BookingDetailPage from "./pages/booking/BookingDetailPage";
import MeowlBubbleNotification from "./components/meowl/MeowlBubbleNotification";
import MeowlPetWrapper from "./components/meowl-pet/MeowlPetWrapper";
import ForbiddenTemple from "./components/easter-egg/ForbiddenTemple";
import TicTacToeGame from "./components/game/tic-tac-toe/TicTacToeGame";
import MeowlAdventure from "./components/game/meowl-adventure/MeowlAdventure";

// import AdminSeminarManager from "./pages/main/AdminSeminarManager";
// import RecruiterSeminarManager from "./pages/main/RecruiterSeminarManager";
import ContractDetailPage from "./components/contract/ContractDetailPage";
import ContractForm from "./components/contract/ContractForm";
import ContractSignPage from "./components/contract/ContractSignPage";
import MyContractsPage from "./pages/user/MyContractsPage";
import ContractManagementPage from "./pages/business/ContractManagementPage";
import FateDetailPage from "./components/jobs-odyssey/FateDetailPage";
import GigDetailPage from "./components/jobs-odyssey/GigDetailPage";
import MeowlSkinShopPage from "./pages/shop/MeowlSkinShopPage";
import UserGuidePage from "./pages/user-guide/UserGuidePage";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import Certificate from "./components/certificate/Certificate";

const CertificateVerifyPage = lazy(
  () => import("./components/certificate/CertificateVerifyPage"),
);
const CertificateDemoPage = lazy(() => import("./pages/CertificateDemoPage"));

const AppContents = () => {
  const location = useLocation();
  // Determine if header is hidden
  const isHeaderHidden =
    fullScreenRoutes.has(location.pathname) ||
    isCertificateRoute(location.pathname) ||
    isCourseLearningRoute(location.pathname) ||
    isAssignmentRoute(location.pathname) ||
    isQuizAttemptRoute(location.pathname);

  return (
    <div
      className={`app-container ${isHeaderHidden ? "app-container--no-header-offset" : ""}`}
    >
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
                animationDuration: `${20 + Math.random() * 15}s`,
              }}
            />
          ))}
        </div>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/user-guide" element={<UserGuidePage />} />
            <Route
              path="/notifications"
              element={
                <AuthenticatedRoute>
                  <NotificationPage />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <AuthenticatedRoute>
                  <MessengerPage />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <StudentOnlyRoute>
                  <UserBookingsPage />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/bookings/:bookingId"
              element={<BookingDetailPage />}
            />
            <Route path="/explore" element={<ExploreMapPage />} />
            <Route
              path="/dashboard"
              element={
                <StudentOnlyRoute>
                  <DashboardPage />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/learning-report"
              element={
                <StudentOnlyRoute>
                  <LearningReportPage />
                </StudentOnlyRoute>
              }
            />
            <Route path="/courses" element={<CoursesPage />} />
            <Route
              path="/roadmap"
              element={
                <StudentOnlyRoute>
                  <AiRoadmapPage />
                </StudentOnlyRoute>
              }
            />
            <Route path="/journey" element={<GSJJourneyPage />} />
            <Route path="/journey/create" element={<JourneyCreatePage />} />
            <Route
              path="/roadmap/:id"
              element={
                <StudentOnlyRoute>
                  <RoadmapDetailPage />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/study-planner"
              element={
                <StudentOnlyRoute>
                  <StudyPlannerPage />
                </StudentOnlyRoute>
              }
            />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/community" element={<CommunityHUD />} />
            <Route path="/community/:id" element={<PostDetailPage />} />
            <Route path="/community/create" element={<BroadcastForm />} />
            <Route
              path="/community/manage"
              element={<CommunityDashboardPage />}
            />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:jobId" element={<FateDetailPage />} />
            <Route
              path="/short-term-jobs/:jobId/view"
              element={<GigDetailPage />}
            />
            <Route
              path="/chatbot"
              element={
                <StudentOnlyRoute>
                  <CareerChatLanding />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/chatbot/general"
              element={
                <StudentOnlyRoute>
                  <CareerChatPage />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/chatbot/expert"
              element={
                <StudentOnlyRoute>
                  <ExpertChatPage />
                </StudentOnlyRoute>
              }
            />
            <Route path="/gamification" element={<Gamification />} />
            <Route
              path="/gamification/tic-tac-toe"
              element={<TicTacToeGame />}
            />
            <Route
              path="/gamification/meowl-adventure"
              element={<MeowlAdventure />}
            />
            {/* <Route path="/portfolio" element={<PortfolioPage />} /> */}{" "}
            {/* BACKUP - Old Portfolio */}
            <Route
              path="/portfolio"
              element={<TacticalDossierPortfolio />}
            />{" "}
            {/* ACTIVE - Mothership Theme */}
            <Route
              path="/portfolio/create"
              element={<DossierCreatePortfolioPage />}
            />
            <Route
              path="/portfolio/:slug"
              element={<TacticalDossierPortfolio />}
            />
            <Route
              path="/portfolio-debug"
              element={
                <AdminRoute>
                  <PortfolioDebug />
                </AdminRoute>
              }
            />
            {/* <Route path="/cv" element={<CVPage />} /> */}{" "}
            {/* BACKUP - Old CV Page */}
            <Route
              path="/cv"
              element={
                <StudentOnlyRoute>
                  <DataCompilerPreview />
                </StudentOnlyRoute>
              }
            />{" "}
            {/* ACTIVE - Mothership Theme */}
            <Route
              path="/certificate/:id"
              element={
                <StudentOnlyRoute>
                  <Certificate />
                </StudentOnlyRoute>
              }
            />
            <Route
              path="/certificate/verify/:serial"
              element={<CertificateVerifyPage />}
            />
            <Route path="/login" element={<ElevatorLoginPage />} />
            <Route
              path="/auth-warning"
              element={<AlreadyAuthenticatedWarning />}
            />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route
              path="/register"
              element={<ElevatorPersonalRegisterPage />}
            />
            <Route
              path="/register/business"
              element={<ElevatorBusinessRegisterPage />}
            />
            <Route
              path="/register/mentor"
              element={<ElevatorMentorRegisterPage />}
            />
            <Route
              path="/register/parent"
              element={<ElevatorParentRegisterPage />}
            />
            <Route path="/verify-otp" element={<VerifyPage />} />
            <Route
              path="/forgot-password"
              element={<ElevatorForgotPasswordPage />}
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            {/* Profile Routes by Role */}
            <Route
              path="/profile"
              element={
                <AuthenticatedRoute>
                  <ProfileRouter />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/profile/user"
              element={
                <AuthenticatedRoute>
                  <ProfilePageCosmic />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/profile/mentor"
              element={
                <AuthenticatedRoute>
                  <MentorProfilePage />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/profile/business"
              element={
                <AuthenticatedRoute>
                  <RecruiterProfilePage />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/profile/business/:id"
              element={<RecruiterPublicProfilePage />}
            />
            <Route path="/payment/transactional" element={<Transactional />} />
            <Route
              path="/premium"
              element={
                <PremiumAccessRoute>
                  <PremiumPageCosmic />
                </PremiumAccessRoute>
              }
            />
            <Route path="/manager" element={<ManagerPage />} />
            <Route
              path="/wallet"
              element={
                <AuthenticatedRoute>
                  <MyWalletCosmic />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/my-wallet"
              element={
                <AuthenticatedRoute>
                  <MyWalletCosmic />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/courses/:courseSlug/:coursePublicId"
              element={<CourseDetailPage />}
            />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/course/:id/preview" element={<CourseDetailPage />} />
            <Route
              path="/course-learning/:courseSlug/:coursePublicId"
              element={<CourseLearningPage />}
            />
            <Route path="/course-learning" element={<CourseLearningPage />} />
            <Route
              path="/assignment/:assignmentId"
              element={<AssignmentPage />}
            />
            <Route path="/quiz/:quizId/attempt" element={<QuizAttemptPage />} />
            {/* Add the missing footer routes */}
            {/* Add these missing footer routes */}
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/terms-of-service" element={<TermOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* User My Applications - Using JobLab for better UX */}
            <Route
              path="/my-applications"
              element={
                <StudentOnlyRoute>
                  <JobLabPage />
                </StudentOnlyRoute>
              }
            />
            {/* Job Lab - Career Hub (alias) */}
            <Route
              path="/job-lab"
              element={
                <StudentOnlyRoute>
                  <JobLabPage />
                </StudentOnlyRoute>
              }
            />
            {/* Contract Routes — flattened directly (no nested <Routes> wrapper) */}
            <Route
              path="/business/contracts/:id/edit"
              element={<ContractForm />}
            />
            <Route
              path="/business/contracts/create"
              element={<ContractForm />}
            />
            <Route
              path="/business/contracts/:id"
              element={<ContractDetailPage />}
            />
            <Route
              path="/business/contracts"
              element={<ContractManagementPage />}
            />
            <Route
              path="/my-contracts"
              element={
                <AuthenticatedRoute>
                  <MyContractsPage />
                </AuthenticatedRoute>
              }
            />
            <Route path="/contracts/:id/sign" element={<ContractSignPage />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            {/* Violation Report Routes */}
            <Route path="/report-violation" element={<ReportUserPage />} />
            <Route
              path="/my-reports"
              element={
                <AuthenticatedRoute>
                  <MyReportsPage />
                </AuthenticatedRoute>
              }
            />
            {/* Protected Routes */}
            <Route
              path="/business"
              element={
                <RecruiterRoute>
                  <BusinessPage />
                </RecruiterRoute>
              }
            />
            <Route
              path="/business/premium"
              element={
                <RecruiterRoute>
                  <PremiumPageCosmic />
                </RecruiterRoute>
              }
            />
            <Route
              path="/mentor"
              element={
                <MentorRoute>
                  <MentorNoticeProvider>
                    <MentorDashboard />
                  </MentorNoticeProvider>
                </MentorRoute>
              }
            />
            {/* Course Builder Routes */}
            <Route
              path="/mentor/courses/create"
              element={
                <MentorRoute>
                  <MentorNoticeProvider>
                    <CourseManagementProvider>
                      <CourseCreationPage />
                    </CourseManagementProvider>
                  </MentorNoticeProvider>
                </MentorRoute>
              }
            />
            <Route
              path="/mentor/courses/:courseId/edit"
              element={
                <MentorRoute>
                  <MentorNoticeProvider>
                    <CourseManagementProvider>
                      <CourseCreationPage />
                    </CourseManagementProvider>
                  </MentorNoticeProvider>
                </MentorRoute>
              }
            />
            <Route
              path="/mentor/badges"
              element={
                <MentorRoute>
                  <MentorNoticeProvider>
                    <AllBadgesPage />
                  </MentorNoticeProvider>
                </MentorRoute>
              }
            />
            <Route
              path="/mentor/assignments/:assignmentId/grade"
              element={
                <MentorRoute>
                  <MentorNoticeProvider>
                    <MentorGradingPage />
                  </MentorNoticeProvider>
                </MentorRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/ai-grading"
              element={
                <AdminRoute>
                  <AdminAiGradingDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId/preview"
              element={
                <AdminRoute>
                  <AdminCoursePreviewPage />
                </AdminRoute>
              }
            />
            <Route path="/admin-security" element={<AdminSecurityPage />} />
            {/* Unauthorized Access */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            {/* Easter Egg Route */}
            <Route path="/pray" element={<ForbiddenTemple />} />
            {/* Certificate Demo Route */}
            <Route
              path="/certificate-demo"
              element={
                <AdminRoute>
                  <CertificateDemoPage />
                </AdminRoute>
              }
            />
            {/* Meowl Skin Shop */}
            <Route
              path="/meowl-shop"
              element={
                <StudentOnlyRoute>
                  <MeowlSkinShopPage />
                </StudentOnlyRoute>
              }
            />
            {/* Catch-all route for 404 errors - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <FooterVisibilityWrapper />
        <MeowlBubbleWrapper />
        <MeowlPetWrapper />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ChakraProvider value={defaultSystem}>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <MeowlSkinProvider>
                <MeowlStateProvider>
                  <ConfirmDialogProvider>
                    <ChatSettingsProvider>
                      <Router>
                        <AppContents />
                      </Router>
                    </ChatSettingsProvider>
                  </ConfirmDialogProvider>
                </MeowlStateProvider>
              </MeowlSkinProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ChakraProvider>
  );
};

// Routes that need full-screen layout (no header/footer)
const fullScreenRoutes = new Set<string>([
  "/login",
  "/register",
  "/register/business",
  "/register/mentor",
  "/register/parent",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/course-learning",
]);

// Routes that only hide footer (keep header visible)
const hideFooterOnlyRoutes = new Set<string>([
  "/choose-role",
  "/chatbot",
  "/chatbot/general",
  "/chatbot/expert",
  "/roadmap",
  "/cv",
  "/learning-report",
  "/admin-security",
  "/course-learning",
  "/notifications",
  "/messages",
  "/premium",
  "/mentor",
  "/business",
  "/jobs",
  "/portfolio/create",
  "/my-applications",
  "/my-contracts",
  "/business/contracts",
  "/contracts",
  "/contracts/sign",
  "/profile/user",
  "/profile/mentor",
  "/profile/business",
  "/set-password",
  "/bookings",
  "/user/bookings",
  "/journey/create",
  "/journey",
  "/portfolio",
]);

// Check if path matches quiz attempt pattern
const isQuizAttemptRoute = (pathname: string) => {
  return /^\/quiz\/\d+\/attempt$/.test(pathname);
};

// Check if path is any contract route
const isContractRoute = (pathname: string) => {
  return (
    pathname.startsWith("/contracts/") ||
    pathname.startsWith("/business/contracts/") ||
    pathname === "/my-contracts"
  );
};

// Check if path matches booking detail routes
const isBookingRoute = (pathname: string) => {
  return /^\/bookings\/\d+$/.test(pathname) || pathname === "/user/bookings";
};

// Check if path matches assignment page pattern
const isAssignmentRoute = (pathname: string) => {
  return /^\/assignment\/\d+$/.test(pathname);
};

const isCertificateRoute = (pathname: string) => {
  return (
    /^\/certificate\/\d+$/.test(pathname) ||
    /^\/verify\/certificate\/[^/]+$/.test(pathname) ||
    /^\/certificate\/verify\/[^/]+$/.test(pathname)
  );
};

// Check if path matches roadmap detail pattern
const isRoadmapDetailRoute = (pathname: string) => {
  return pathname.startsWith("/roadmap/") && pathname !== "/roadmap";
};

const isCourseLearningRoute = (pathname: string) => {
  return (
    pathname === "/course-learning" || pathname.startsWith("/course-learning/")
  );
};

const isCourseDetailRoute = (pathname: string) => {
  return (
    /^\/courses\/[^/]+(?:\/[^/]+)?$/.test(pathname) ||
    /^\/course\/[^/]+\/preview$/.test(pathname)
  );
};

// Check if path is any admin route
const isAdminRoute = (pathname: string) => {
  return pathname === "/admin" || pathname.startsWith("/admin/");
};

// Check if path is any mentor management route
const isMentorRoute = (pathname: string) => {
  return pathname === "/mentor" || pathname.startsWith("/mentor/");
};

// Check if path is job detail route
const isJobDetailRoute = (pathname: string) => {
  return (
    /^\/jobs\/\d+$/.test(pathname) ||
    /^\/short-term-jobs\/\d+\/view$/.test(pathname)
  );
};

// Hide Header on specific routes
const HeaderVisibilityWrapper = () => {
  const location = useLocation();
  if (
    fullScreenRoutes.has(location.pathname) ||
    isCourseLearningRoute(location.pathname) ||
    isCertificateRoute(location.pathname) ||
    isAssignmentRoute(location.pathname) ||
    isQuizAttemptRoute(location.pathname)
  )
    return null;
  return <Header />;
};

// Hide Footer on specific routes
const FooterVisibilityWrapper = () => {
  const location = useLocation();
  if (
    fullScreenRoutes.has(location.pathname) ||
    hideFooterOnlyRoutes.has(location.pathname) ||
    isCourseLearningRoute(location.pathname) ||
    isAdminRoute(location.pathname) ||
    isMentorRoute(location.pathname) ||
    isCertificateRoute(location.pathname) ||
    isAssignmentRoute(location.pathname) ||
    isQuizAttemptRoute(location.pathname) ||
    isRoadmapDetailRoute(location.pathname) ||
    isJobDetailRoute(location.pathname) ||
    isBookingRoute(location.pathname) ||
    isContractRoute(location.pathname) ||
    isCourseDetailRoute(location.pathname)
  ) {
    return null;
  }
  return <Footer />;
};

// Routes where Meowl Bubble should NOT appear
const hideMeowlBubbleRoutes = new Set<string>([
  "/login",
  "/register",
  "/register/business",
  "/register/mentor",
  "/register/parent",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/chatbot/general",
  "/chatbot/expert",
  "/admin",
  "/admin-security",
]);

// Meowl Bubble Notification Wrapper
const MeowlBubbleWrapper = () => {
  const location = useLocation();
  const shouldHide =
    hideMeowlBubbleRoutes.has(location.pathname) ||
    isQuizAttemptRoute(location.pathname) ||
    isAssignmentRoute(location.pathname) ||
    isCertificateRoute(location.pathname);
  return <MeowlBubbleNotification disabled={shouldHide} />;
};

export default App;
