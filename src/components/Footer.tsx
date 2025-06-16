import React, { useEffect } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowUp, Send, Heart } from 'lucide-react';
import Logo from '../assets/Logo.jpg';
import '../styles/Footer.css';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
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
                  <img src={Logo} alt="Skillverse Logo" className="brand-logo" />
                </div>
                <span className="brand-name">Skillverse</span>
              </div>
              <p className="brand-description">
                An integrated learning and working ecosystem for students and career changers in the digital age.
              </p>
              <div className="social-links">
                <a href="#" className="social-link hover-float">
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
              <h3 className="footer-title">Quick Links</h3>
              <ul className="footer-links">
                <li><a href="/courses" className="footer-link hover-underline">Courses</a></li>
                <li><a href="/jobs" className="footer-link hover-underline">Jobs</a></li>
                <li><a href="/portfolio" className="footer-link hover-underline">Portfolio</a></li>
                <li><a href="/chatbot" className="footer-link hover-underline">AI Advisor</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-section">
              <h3 className="footer-title">Support</h3>
              <ul className="footer-links">
                <li><a href="#" className="footer-link hover-underline">Help Center</a></li>
                <li><a href="#" className="footer-link hover-underline">Terms of Service</a></li>
                <li><a href="#" className="footer-link hover-underline">Privacy Policy</a></li>
                <li><a href="#" className="footer-link hover-underline">FAQ</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-section">
              <h3 className="footer-title">Contact</h3>
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
                  <span>FPT HCMC</span>
                </div>
              </div>

              {/* Newsletter Subscription */}
              <div className="newsletter">
                <h4 className="newsletter-title">Subscribe to Newsletter</h4>
                <div className="newsletter-form">
                  <input type="email" placeholder="Enter your email" className="newsletter-input" />
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
              © 2025 Skillverse. Made with <Heart className="heart-icon" /> by Team InnoVibe
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