import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ForbiddenTemple.css';

// Assets
import bgNormal from '../../assets/pray/assets/background.png';
import bgBlood from '../../assets/pray/assets/background-blood.png';
import god1Normal from '../../assets/pray/assets/god1.jpg';
import god1Blood from '../../assets/pray/assets/god1-blood.jpg';
import god2Normal from '../../assets/pray/assets/god2.jpg';
import god2Blood from '../../assets/pray/assets/god2-blood.jpg';
import god3Normal from '../../assets/pray/assets/god3.jpg';
import god3Blood from '../../assets/pray/assets/god3-blood.jpg';
import peterImg from '../../assets/pray/assets/ong-dia-peter.png'; 
import quagmireImg from '../../assets/pray/assets/ong-than-tai-quagmire.png';
import frameImg from '../../assets/pray/assets/picture-frame.png';
import bowlImg from '../../assets/pray/assets/incense-bowl.png';
import stickImg from '../../assets/pray/assets/incense-stick.png';
import moImg from '../../assets/pray/assets/percussion.png';
import bellImg from '../../assets/pray/assets/bell.png';

// Sounds
import soundSerenity from '../../assets/pray/sound/serenity.mp3';
import soundLightOut from '../../assets/pray/sound/light-out.mp3';
import soundHorror from '../../assets/pray/sound/horror.mp3';
import soundMo from '../../assets/pray/sound/percussion.mp3';
import soundBell from '../../assets/pray/sound/bell.mp3';
import soundVineBoom from '../../assets/pray/sound/vine-boom.mp3';
import soundMetalPipe from '../../assets/pray/sound/metal-pipe.mp3';

const ForbiddenTemple: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clicks, setClicks] = useState(0);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [prayer, setPrayer] = useState('');
  const [escapeBtnPos, setEscapeBtnPos] = useState({ top: '20px', left: '20px' });
  const [isLightsOut, setIsLightsOut] = useState(false);
  const [isStickLit, setIsStickLit] = useState(false);
  const [moShaking, setMoShaking] = useState(false);
  const [bellShaking, setBellShaking] = useState(false);
  
  // Intro State
  const [introStep, setIntroStep] = useState<'none' | 'text1' | 'text2' | 'blink'>('none');

  // Audio Refs
  const audioSerenity = useRef<HTMLAudioElement>(new Audio(soundSerenity));
  const audioLightOut = useRef<HTMLAudioElement>(new Audio(soundLightOut));
  const audioHorror = useRef<HTMLAudioElement>(new Audio(soundHorror));

  // Thresholds
  const PHASE_1_THRESHOLD = 49;
  const PHASE_2_THRESHOLD = 53;

  // Intro Sequence Logic
  useEffect(() => {
    if (location.state?.fromHorror) {
      setIntroStep('text1');
      
      // Sequence
      const t1 = setTimeout(() => setIntroStep('text2'), 3000);
      const t2 = setTimeout(() => setIntroStep('blink'), 6000);
      const t3 = setTimeout(() => setIntroStep('none'), 9000); // Blink lasts 3s

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [location.state]);

  // Preload Images
  useEffect(() => {
    // Lock Scroll
    document.body.style.overflow = 'hidden';

    const images = [bgNormal, bgBlood, god1Normal, god1Blood, god2Normal, god2Blood, god3Normal, god3Blood, frameImg, bowlImg, stickImg, peterImg, quagmireImg, moImg, bellImg];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    
    // Setup Audio Loops
    audioHorror.current.loop = true;
    audioSerenity.current.loop = true;
    
    return () => {
      document.body.style.overflow = 'auto'; // Unlock Scroll
      audioSerenity.current.pause();
      audioLightOut.current.pause();
      audioHorror.current.pause();
    };
  }, []);

  // Phase Logic
  useEffect(() => {
    if (clicks === PHASE_1_THRESHOLD && phase === 0) {
      triggerPhase1Transition();
    } else if (clicks >= PHASE_2_THRESHOLD && phase === 1) {
      triggerPhase2Transition();
    }
  }, [clicks]);

  const triggerPhase1Transition = () => {
    // Stop Serenity
    audioSerenity.current.pause();

    // 1. Lights Out
    setIsLightsOut(true);
    audioLightOut.current.play().catch(e => console.log("Audio blocked", e));
    
    // 2. Wait and Reveal
    setTimeout(() => {
      setPhase(1);
      setIsLightsOut(false);
    }, 4000); // Sync with light-out sound duration approx
  };

  const triggerPhase2Transition = () => {
    // 1. Lights Out Brief
    setIsLightsOut(true);
    audioSerenity.current.pause(); // Ensure stopped
    audioHorror.current.play().catch(e => console.log("Audio blocked", e));

    // 2. Wait 5s for horror intro
    setTimeout(() => {
      setPhase(2);
      setIsLightsOut(false);
    }, 5000);
  };

  // Troll Logic: Move Escape Button in Phase 2
  useEffect(() => {
    if (phase === 2) {
      const interval = setInterval(() => {
        const maxTop = window.innerHeight - 50;
        const maxLeft = window.innerWidth - 100;
        const newTop = Math.floor(Math.random() * maxTop);
        const newLeft = Math.floor(Math.random() * maxLeft);
        
        setEscapeBtnPos({
          top: `${newTop}px`,
          left: `${newLeft}px`
        });
      }, 300); // Faster movement in horror phase

      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleActionClick = () => {
    // First Click: Light Incense & Play Serenity (Always allowed)
    if (clicks === 0) {
      setIsStickLit(true);
      audioSerenity.current.play().catch(e => console.log("Audio blocked", e));
      setClicks(prev => prev + 1);
      return;
    }

    // Subsequent clicks: Only count if password is correct
    if (prayer === 'mktnhulol') {
      setClicks(prev => prev + 1);
    }
  };

  const handleEscape = () => {
    if (phase !== 2) {
      navigate('/');
    } else {
      // In phase 2, maybe it just resets or does nothing (troll)
      // alert("THERE IS NO ESCAPE.");
    }
  };

  const playInstrument = (type: 'MO' | 'BELL') => {
    const isMeme = Math.random() > 0.9; // 10% Meme Chance
    let audioSrc = '';
    let volume = 0.6;

    if (type === 'MO') {
      audioSrc = isMeme ? soundVineBoom : soundMo;
      volume = isMeme ? 1.0 : 0.8; // Vine boom is loud
      setMoShaking(true);
      setTimeout(() => setMoShaking(false), 200);
    } else {
      audioSrc = isMeme ? soundMetalPipe : soundBell;
      volume = isMeme ? 1.0 : 0.6; 
      setBellShaking(true);
      setTimeout(() => setBellShaking(false), 200);
    }

    const audio = new Audio(audioSrc);
    audio.volume = volume;
    audio.play().catch(e => console.log("Audio play failed", e));
  };

  if (introStep === 'text1' || introStep === 'text2') {
    return (
      <div className="ee-intro-screen">
        <p className="ee-intro-text">
          {introStep === 'text1' ? "Chóng mặt quá..." : "Mình đang ở đâu đây..."}
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`ee-container phase-${phase} ${isLightsOut ? 'lights-out' : ''}`}
      style={{ backgroundImage: `url(${phase === 2 ? bgBlood : bgNormal})` }}
    >
      {introStep === 'blink' && <div className="ee-blink-overlay" />}
      {phase === 2 && <div className="ee-blood-overlay" />}
      
      {/* Escape Button (Moves in Phase 2) */}
      <button 
        className="ee-btn-escape"
        style={{ top: escapeBtnPos.top, left: escapeBtnPos.left }}
        onClick={handleEscape}
      >
        {phase === 2 ? "KHÔNG LỐI THOÁT" : "RỜI KHỎI ĐÂY"}
      </button>

      {/* ================= SCENE PROPS ================= */}
      
      {/* Layer 1: Portraits (Visible in Phase 1+) */}
      <div className={`ee-portraits-row ${phase >= 1 ? 'visible' : ''}`}>
        {/* Left: God 1 */}
        <div className="ee-frame-container">
          <img src={frameImg} className="ee-frame-img" alt="Frame" />
          <img src={phase === 2 ? god1Blood : god1Normal} className="ee-god-img" alt="Deity 1" />
        </div>
        
        {/* Center: God 2 */}
        <div className="ee-frame-container">
          <img src={frameImg} className="ee-frame-img" alt="Frame" />
          <img src={phase === 2 ? god2Blood : god2Normal} className="ee-god-img" alt="Deity 2" />
        </div>

        {/* Right: God 3 */}
        <div className="ee-frame-container">
          <img src={frameImg} className="ee-frame-img" alt="Frame" />
          <img src={phase === 2 ? god3Blood : god3Normal} className="ee-god-img" alt="Deity 3" />
        </div>
      </div>

      {/* Layer 2: Incense Stick */}
      <div className="ee-incense-stick-container">
        <img 
          src={stickImg} 
          className={`ee-stick-img ${isStickLit ? 'lit' : ''}`} 
          alt="Incense Stick" 
        />
      </div>

      {/* Layer 3: Incense Bowl */}
      <img src={bowlImg} className="ee-incense-bowl" alt="Incense Bowl" />

      {/* Layer 3.1: Smoke (Moved here for Z-Index) */}
      <div className={`ee-smoke ${isStickLit ? 'lit' : ''}`}></div>

      {/* Layer 3.2: Instruments */}
      <img 
        src={moImg} 
        className={`ee-instrument-mo ${moShaking ? 'shaking' : ''}`} 
        alt="Wooden Fish" 
        onClick={() => playInstrument('MO')}
      />
      <img 
        src={bellImg} 
        className={`ee-instrument-bell ${bellShaking ? 'shaking' : ''}`} 
        alt="Bronze Bell" 
        onClick={() => playInstrument('BELL')}
      />

      {/* Layer 3.5: Peter Ong Dia & Quagmire Than Tai - Visible only in Phase 0 */}
      <img 
        src={peterImg} 
        className={`ee-peter-statue ${phase === 0 ? '' : 'hidden'}`} 
        alt="Ong Dia Peter" 
      />
      <img 
        src={quagmireImg} 
        className={`ee-quagmire-statue ${phase === 0 ? '' : 'hidden'}`} 
        alt="Than Tai Quagmire" 
      />


      {/* ================= UI LAYER ================= */}
      <div className="ee-ui-layer">
        {/* Input Section */}
        <input 
          type="text" 
          className={`ee-input ${phase === 2 ? 'corrupted' : ''}`}
          placeholder={phase === 2 ? "C̴H̴Ạ̴Y̴ ̴N̴G̴A̴Y̴ ̴Đ̴I̴" : "Nhập lời khấn..."}
          value={prayer}
          onChange={(e) => setPrayer(e.target.value)}
          disabled={phase === 2}
        />

        {/* Action Button */}
        <button 
          className={`ee-btn-action ${phase >= 1 ? 'warning' : 'normal'}`}
          onClick={handleActionClick}
        >
          {phase === 0 && (clicks === 0 ? "[ THẮP HƯƠNG ]" : "[ KHẤN NGUYỆN ]")}
          {phase === 1 && "[ HIẾN TẾ ]"}
          {phase === 2 && "H̴I̴Ế̴N̴ ̴T̴Ế̴ ̴Đ̴Ư̴Ợ̴C̴ ̴C̴H̴Ấ̴P̴ ̴N̴H̴Ậ̴N̴"}
        </button>
        
        {/* Debug Counter (Remove in Prod) */}
        {/* <div style={{ color: 'rgba(255,255,255,0.2)' }}>
          Clicks: {clicks} | Phase: {phase}
        </div> */}
      </div>
    </div>
  );
};

export default ForbiddenTemple;
