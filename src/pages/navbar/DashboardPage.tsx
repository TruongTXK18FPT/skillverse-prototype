import { useLanguage } from '../../context/LanguageContext';
import MothershipDashboard from '../../components/dashboard-hud/MothershipDashboard';

const DashboardPage = () => {
  const { translations } = useLanguage();

  return <MothershipDashboard userName="InnoVibe Team" translations={translations} />;
};

export default DashboardPage;
