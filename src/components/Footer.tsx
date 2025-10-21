import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, ArrowUp, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../assets/skillverse.png';

// Minimal TikTok icon as inline SVG
const TikTokIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 256 256"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M170 32c6 28 25 50 54 56v32c-19-1-36-8-54-20v68c0 35-28 64-63 64s-63-29-63-64 28-64 63-64c5 0 10 1 15 2v32c-5-3-10-4-15-4-18 0-31 14-31 34s13 34 31 34 31-14 31-34V32h32z"/>
  </svg>
);

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
              <Link to="/" className="brand-header">
                <img src={Logo} alt="Skillverse Logo" className="brand-logo" />

              </Link>
              <p className="brand-description">
                Hệ sinh thái học tập và làm việc tích hợp cho sinh viên và người chuyển đổi nghề nghiệp trong kỷ nguyên số.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/profile.php?id=61581184190711" target="_blank" rel="noopener noreferrer" className="social-link hover-float">
                  <Facebook className="social-icon facebook" />
                </a>
                <a href="#" className="social-link hover-float" aria-label="TikTok">
                  <TikTokIcon className="social-icon tiktok" />
                </a>
                <a href="#" className="social-link hover-float">
                  <Instagram className="social-icon instagram" />
                </a>
                <a href="#" className="social-link hover-float">
                  <Linkedin className="social-icon linkedin" />
                </a>
              </div>
              
              {/* Facebook Page Embed */}
              <div className="facebook-embed">
                <iframe
                  src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61581184190711&tabs=timeline&width=500&height=250&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
                  width="500"
                  height="250"
                  style={{ border: 'none', overflow: 'hidden', borderRadius: '12px', marginTop: '1.5rem' }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="Facebook Page"
                ></iframe>
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
              © 2025 Skillverse. Đã đăng ký bản quyền.
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