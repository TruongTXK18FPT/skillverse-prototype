import { Mail, Phone, MapPin, ArrowUp, Users, Sparkles, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../assets/skillverse.png';

const Footer = () => {
  const { theme } = useTheme();
  const { translations } = useLanguage();
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d31355.755907056393!2d106.80691566973627!3d10.841127618407334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sfpt%20university!5e0!3m2!1sen!2s!4v1709561248044!5m2!1sen!2s";

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className={`footer ${theme} tech-footer`}>
      {/* Tech Background Effects */}
      <div className="footer-bg-effects">
        <div className="footer-grid-overlay"></div>
        <div className="footer-glow-orb footer-orb-1"></div>
        <div className="footer-glow-orb footer-orb-2"></div>
      </div>

      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="brand-header">
                <img src={Logo} alt="Skillverse Logo" className="brand-logo" />
              </Link>
              <p className="brand-description">
                Hệ sinh thái học tập và làm việc tích hợp cho sinh viên và người chuyển đổi nghề nghiệp trong kỷ nguyên số.
              </p>
              <div className="brand-badges">
                <span className="tech-badge"><Shield size={14} /> Secure</span>
                <span className="tech-badge"><Sparkles size={14} /> AI Powered</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">{translations.footer.quickLinks}</h3>
              <ul className="footer-links">
                <li><Link to="/courses" className="footer-link hover-underline">{translations.navigation.courses}</Link></li>
                <li><Link to="/jobs" className="footer-link hover-underline">{translations.navigation.jobs}</Link></li>
                <li><Link to="/portfolio" className="footer-link hover-underline">{translations.navigation.portfolio}</Link></li>
                <li><Link to="/chatbot" className="footer-link hover-underline">{translations.navigation.chatbot}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-section">
              <h3 className="footer-title">{translations.footer.support}</h3>
              <ul className="footer-links">
                <li><Link to="/help-center" className="footer-link hover-underline">{translations.footer.links.helpCenter}</Link></li>
                <li><Link to="/terms-of-service" className="footer-link hover-underline">{translations.footer.links.termsOfService}</Link></li>
                <li><Link to="/privacy-policy" className="footer-link hover-underline">{translations.footer.links.privacyPolicy}</Link></li>
                <li><Link to="/about" className="footer-link hover-underline">{translations.footer.links.aboutUs}</Link></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Facebook and Contact Side by Side */}
      <div className="footer-container">
        <div className="footer-bottom-grid">
          {/* Facebook Page Embed - Tech Style */}
          <div className="facebook-section-bottom">
            <h3 className="footer-title">Facebook</h3>
            <div className="facebook-embed-tech">
              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61581184190711&tabs=timeline&width=500&height=280&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
                width="100%"
                height="280"
                style={{ border: 'none', overflow: 'hidden', borderRadius: '12px' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title="Facebook Page"
              ></iframe>
            </div>
          </div>

          {/* Contact Section - Tech Redesigned */}
          <div className="contact-section-bottom">
            <h3 className="footer-title">{translations.footer.contact}</h3>
            <div className="contact-info-list">
              {/* Support Email */}
              <a href="mailto:support@skillverse.vn" className="contact-row hover-float">
                <div className="contact-icon-box">
                  <Mail size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Support</span>
                  <span className="contact-value">support@skillverse.vn</span>
                </div>
              </a>

              {/* Contact Email */}
              <a href="mailto:contact@skillverse.vn" className="contact-row hover-float">
                <div className="contact-icon-box">
                  <Mail size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Contact</span>
                  <span className="contact-value">contact@skillverse.vn</span>
                </div>
              </a>

              {/* Community Email */}
              <a href="mailto:skillverse.contact@gmail.com" className="contact-row hover-float">
                <div className="contact-icon-box">
                  <Users size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Community</span>
                  <span className="contact-value">skillverse.contact@gmail.com</span>
                </div>
              </a>

              {/* Hotline */}
              <a href="tel:+84931430662" className="contact-row hover-float">
                <div className="contact-icon-box">
                  <Phone size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Hotline</span>
                  <span className="contact-value">0931 430 662</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <iframe
            src={mapUrl}
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '16px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="FPT University Location"
          ></iframe>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 Skillverse. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <div className="contact-item hover-float contact-address-inline">
                <MapPin size={16} className="contact-icon-small" />
                <span>{translations.footer.location}</span>
              </div>
            </div>
            <button onClick={scrollToTop} className="scroll-top-button">
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;