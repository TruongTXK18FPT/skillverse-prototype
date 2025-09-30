import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Array of funny meowl messages
  const messages = [
    "Hoot did you get here?! 🦉",
    "This page is owl-fully missing! 🦉", 
    "I'm owl-ways watching, but I can't find this page! 👀",
    "Whoo knew this would happen? 🤔",
    "Don't have a cow... or an owl! This page is gone! 🦉",
    "Owl bet you didn't expect this! 😄"
  ];

  useEffect(() => {
    // Random exclamation colors animation
    const interval = setInterval(() => {
      const exclamations = document.querySelectorAll('.exclamation');
      const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];
      
      exclamations.forEach(exclamation => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        (exclamation as HTMLElement).style.color = randomColor;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleMeowlClick = () => {
    setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    
    // Add extra bounce animation
    const meowlImg = document.querySelector('.meowl-image') as HTMLElement;
    if (meowlImg) {
      meowlImg.style.animation = 'none';
      setTimeout(() => {
        meowlImg.style.animation = 'pulse 2s ease-in-out infinite, bounce 0.5s ease-in-out';
      }, 10);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`not-found-container ${theme}`} data-theme={theme}>
      {/* Floating Background Elements */}
      <div className="floating-element">❗</div>
      <div className="floating-element">❓</div>
      <div className="floating-element">❗</div>
      <div className="floating-element">🦉</div>
      <div className="floating-element">❗</div>
      <div className="floating-element">❗</div>
      <div className="floating-element">❗</div>
      <div className="floating-element">❗</div>

      <div className="not-found-content">
        {/* 404 Code */}
        <div className="error-code">404</div>

        {/* Meowl Image with Exclamations */}
        <div className="meowl-container">
          <div className="exclamation exclamation-1">❗</div>
          <div className="exclamation exclamation-2">❗</div>
          <div className="exclamation exclamation-3">❗</div>          <img 
            src="/images/meowl.jpg" 
            alt="Confused Meowl" 
            className="meowl-image"
            onClick={handleMeowlClick}
          />
        </div>

        {/* Speech Bubble */}
        <div className="speech-bubble-404">
          <p className="bubble-text">{messages[currentMessageIndex]}</p>
        </div>

        {/* Error Message */}
        <div className="error-message-404">
          <h1 className="error-title-404">Page Not Found!</h1>
          <p className="error-description-404">
            Looks like this page flew away! Even our wise meowl couldn't find what you're looking for. 
            Don't worry though, we'll help you get back on track! 🦉✨
          </p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleGoHome} className="btn btn-primary">
            🏠 Take Me Home
          </button>
          <button onClick={handleGoBack} className="btn btn-secondary">
            ⬅️ Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;