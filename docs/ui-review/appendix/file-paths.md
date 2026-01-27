# File Paths Reference

Danh sách tất cả file code liên quan đến UI đã review.

---

## Pages

### Public Pages

| Page | File Path |
|------|-----------|
| Homepage | `src/pages/main/NewLandingPage.tsx` |
| Login | `src/pages/auth/LoginPage.tsx` |
| Register | `src/pages/auth/RegisterPage.tsx` |
| Courses List | `src/pages/course/CoursesPage.tsx` |
| Course Detail | `src/pages/course/CourseDetailPage.tsx` |
| Jobs | `src/pages/navbar/JobsPage.tsx` |
| Community | `src/pages/community/CommunityPage.tsx` |
| Seminar | `src/pages/navbar/SeminarPage.tsx` |
| Premium | `src/pages/navbar/PremiumPage.tsx` |
| About | `src/pages/about/AboutUsPage.tsx` |
| Explore Map | `src/pages/ExploreMapPage.tsx` |
| Mini Games | `src/components/game/MiniGamesHub.tsx` |
| Help Center | `src/pages/footer/HelpCenterPage.tsx` |
| User Guide | `src/pages/user-guide/UserGuidePage.tsx` |
| Choose Role | `src/pages/auth/ChooseRolePage.tsx` |
| Terms of Service | `src/pages/footer/TermsOfServicePage.tsx` |
| Privacy Policy | `src/pages/footer/PrivacyPolicyPage.tsx` |
| Meowl Shop | `src/pages/shop/MeowlShopPage.tsx` |

### Protected Pages (Student Role)

| Page | File Path | Lines |
|------|-----------|-------|
| Dashboard | `src/pages/navbar/DashboardPage.tsx` | ~200 |
| Dashboard HUD | `src/components/dashboard-hud/MothershipDashboard.tsx` | ~400 |
| My Wallet | `src/pages/my-wallet/MyWalletCosmic.tsx` | ~600 |
| Profile | `src/pages/profile/ProfilePageCosmic.tsx` | ~300 |
| Notifications | `src/pages/NotificationPage.tsx` | ~200 |
| AI Roadmap | `src/pages/roadmap/RoadmapAIPage.tsx` | ~400 |
| Roadmap Detail | `src/pages/roadmap/RoadmapDetailPage.tsx` | ~300 |
| Portfolio | `src/pages/navbar/PortfolioPage.tsx` | 957 |
| Career Chatbot | `src/pages/navbar/CareerChatPage.tsx` | 649 |
| Study Planner | `src/pages/study-planner/StudyPlannerPage.tsx` | 246 |
| Mentorship | `src/pages/navbar/MentorshipPage.tsx` | 391 |
| User Bookings | `src/pages/user/UserBookingsPage.tsx` | 498 |

---

## Components

### Common Components

| Component | File Path |
|-----------|-----------|
| Navbar | `src/components/layout/Navbar.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
| MeowlKuruLoader | `src/components/kuru-loader/MeowlKuruLoader.tsx` |
| MeowlPet | `src/components/meowl-pet/MeowlPet.tsx` |
| Toast | `src/components/common/Toast.tsx` |

### Dashboard Components

| Component | File Path |
|-----------|-----------|
| CommanderWelcome | `src/components/dashboard-hud/CommanderWelcome.tsx` |
| SystemStatus | `src/components/dashboard-hud/SystemStatus.tsx` |
| StatUnit | `src/components/dashboard-hud/StatUnit.tsx` |
| ActiveModules | `src/components/dashboard-hud/ActiveModules.tsx` |
| MissionLog | `src/components/dashboard-hud/MissionLog.tsx` |
| FavoriteMentors | `src/components/dashboard-hud/FavoriteMentors.tsx` |

### Wallet Components

| Component | File Path |
|-----------|-----------|
| DepositCashModal | `src/components/wallet/DepositCashModal.tsx` |
| BuyCoinModal | `src/components/wallet/BuyCoinModal.tsx` |
| WithdrawModal | `src/components/wallet/WithdrawModal.tsx` |
| SetupBankAccountModal | `src/components/wallet/SetupBankAccountModal.tsx` |

### Study Planner Components

| Component | File Path |
|-----------|-----------|
| CalendarView | `src/components/study-planner/CalendarView.tsx` |
| SpaceTaskBoard | `src/components/study-planner/SpaceTaskBoard.tsx` |
| TaskCard | `src/components/study-planner/TaskCard.tsx` |

---

## Services

| Service | File Path |
|---------|-----------|
| Auth | `src/services/authService.ts` |
| Course | `src/services/courseService.ts` |
| Wallet | `src/services/walletService.ts` |
| Portfolio | `src/services/portfolioService.ts` |
| Booking | `src/services/bookingService.ts` |
| Notification | `src/services/notificationService.ts` |
| Roadmap | `src/services/roadmapService.ts` |
| Mentor | `src/services/mentorService.ts` |

---

## Configuration Files

| Config | File Path |
|--------|-----------|
| Explore Map Data | `src/config/exploreMapData.ts` |
| Roadmaps Data | `src/data/roadmapsData.ts` |
| App Routes | `src/App.tsx` |
