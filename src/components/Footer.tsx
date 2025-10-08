import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowUp, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
    <footer className={`footer ${theme}`}>
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <div className="brand-header">
                <div className="brand-logo-wrapper">
                  <img src="/images/skillverse.png" alt="Skillverse Logo" className="brand-logo" />
                </div>
                <span className="brand-name">Skillverse</span>
              </div>
              <p className="brand-description">
                An integrated learning and working ecosystem for students and career changers in the digital age.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/profile.php?id=61581184190711" className="social-link hover-float">
                  <Facebook className="social-icon facebook" />
                </a>
                <a href="#" className="social-link hover-float">
                  <Twitter className="social-icon twitter" />
                </a>
                <a href="#" className="social-link hover-float">
                  <Instagram className="social-icon instagram" />
                </a>
                <a href="#" className="social-link hover-float">
                  <Linkedin className="social-icon linkedin" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">{translations.footer.quickLinks}</h3>
              <ul className="footer-links">
                <li><a href="/courses" className="footer-link hover-underline">{translations.navigation.courses}</a></li>
                <li><a href="/jobs" className="footer-link hover-underline">{translations.navigation.jobs}</a></li>
                <li><a href="/portfolio" className="footer-link hover-underline">{translations.navigation.portfolio}</a></li>
                <li><a href="/chatbot" className="footer-link hover-underline">{translations.navigation.chatbot}</a></li>
                <li><a href="/gamification" className="footer-link hover-underline">{translations.navigation.gamification}</a></li>
                <li><a href="/mentorship" className="footer-link hover-underline">{
translations.navigation.mentorship}</a></li>
                <li><a href="/community" className="footer-link hover-underline">{translations.navigation.community}</a></li>
                <li><a href="/seminar" className="footer-link hover-underline">{translations.navigation.seminar}</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-section">
              <h3 className="footer-title">{translations.footer.support}</h3>
              <ul className="footer-links">
                <li><Link to="/help-center" className="footer-link hover-underline">{translations.footer.links.helpCenter}</Link></li>
                <li><Link to="/terms-of-service" className="footer-link hover-underline">{translations.footer.links.termsOfService}</Link></li>
                <li><Link to="/privacy-policy" className="footer-link hover-underline">{translations.footer.links.privacyPolicy}</Link></li>
                <li><a href="#" className="footer-link hover-underline">{translations.footer.links.faq}</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-section">
              <h3 className="footer-title">{translations.footer.contact}</h3>
              <div className="contact-info">
                <a href="mailto:truongtranxuan41@gmail.com" className="contact-item hover-float">
                  <Mail className="contact-icon" />
                  <span>truongtranxuan41@gmail.com</span>
                </a>
                <a href="tel:+84931430662" className="contact-item hover-float">
                  <Phone className="contact-icon" />
                  <span>0931430662</span>
                </a>
                <div className="contact-item hover-float">
                  <MapPin className="contact-icon" />
                  <span>{translations.footer.location}</span>
                </div>
              </div>

              {/* Newsletter Subscription */}
              <div className="newsletter">
                <h4 className="newsletter-title">{translations.footer.subscribe}</h4>
                <div className="newsletter-form">
                  <input 
                    type="email" 
                    placeholder={translations.footer.emailPlaceholder}
                    className="newsletter-input" 
                  />
                  <button className="newsletter-button">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <iframe
              src={mapUrl}
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: '12px', marginTop: '2rem' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="FPT University Location"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="copyright">
              {translations.footer.copyright}
            </p>
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