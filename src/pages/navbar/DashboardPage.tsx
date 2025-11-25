import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import MothershipDashboard from '../../components/dashboard-hud/MothershipDashboard';
import MeowlGuide from '../../components/MeowlGuide';

const DashboardPage = () => {
  const { translations } = useLanguage();
  const { user } = useAuth();

  return (
    <>
      <MothershipDashboard 
        userName={user?.fullName || 'Explorer'}
        translations={translations}
      />
      <MeowlGuide currentPage="dashboard" />
    </>
  );
};

export default DashboardPage;
