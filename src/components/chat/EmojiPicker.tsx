import React, { useState, useRef, useEffect } from 'react';
import { Smile, Search, Clock, Star, Heart, Zap, Coffee, Music, Sparkles, X } from 'lucide-react';
import './EmojiPicker.css';

// Custom emoji categories with popular emojis
const EMOJI_CATEGORIES = {
  recent: {
    icon: Clock,
    name: 'Gần đây',
    emojis: [] as string[]
  },
  smileys: {
    icon: Smile,
    name: 'Biểu cảm',
    emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥺', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓']
  },
  gestures: {
    icon: Star,
    name: 'Cử chỉ',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄']
  },
  love: {
    icon: Heart,
    name: 'Yêu thương',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🔥', '❤️‍🩹', '💋', '💌', '💐', '🌹', '🥀', '🌷', '🌸', '💮', '🏵️', '🌻', '🌼', '🌺']
  },
  activities: {
    icon: Zap,
    name: 'Hoạt động',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩']
  },
  food: {
    icon: Coffee,
    name: 'Đồ ăn',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾']
  },
  nature: {
    icon: Sparkles,
    name: 'Thiên nhiên',
    emojis: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌌', '🌃', '🏙️', '🌆', '🌇', '🌉', '🌁', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '💫', '✨', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
  },
  objects: {
    icon: Music,
    name: 'Đồ vật',
    emojis: ['📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🪞', '🪆', '🏧', '🎰']
  }
};

// Custom SkillVerse emojis (can be images or special codes)
const SKILLVERSE_CUSTOM_EMOJIS = [
  { code: ':meowl:', name: 'Meowl', url: '/game_asset/meowl-mascot.png' },
  { code: ':skillverse:', name: 'SkillVerse', url: '/images/skillverse-logo.png' },
  { code: ':star_gold:', name: 'Sao Vàng', url: '/game_asset/star-gold.png' },
  { code: ':trophy:', name: 'Cúp', url: '/game_asset/trophy.png' },
  { code: ':level_up:', name: 'Lên Level', url: '/game_asset/level-up.png' },
  { code: ':fire:', name: 'Hot', url: '/game_asset/fire.png' },
  { code: ':crown:', name: 'Vương miện', url: '/game_asset/crown.png' },
  { code: ':gem:', name: 'Kim cương', url: '/game_asset/gem.png' },
];

export interface EmojiData {
  native: string;
  isCustom?: boolean;
  customUrl?: string;
}

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string, isCustom?: boolean, customUrl?: string) => void;
  position?: 'top' | 'bottom';
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  isOpen, 
  onClose, 
  onEmojiSelect,
  position = 'top' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('skillverse_recent_emojis');
    if (saved) {
      setRecentEmojis(JSON.parse(saved));
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      searchInputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    // Add to recent
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 30);
    setRecentEmojis(newRecent);
    localStorage.setItem('skillverse_recent_emojis', JSON.stringify(newRecent));
    
    onEmojiSelect(emoji);
  };

  const handleCustomEmojiClick = (customEmoji: typeof SKILLVERSE_CUSTOM_EMOJIS[0]) => {
    onEmojiSelect(customEmoji.code, true, customEmoji.url);
  };

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!searchQuery) {
      if (activeCategory === 'recent') {
        return recentEmojis;
      }
      if (activeCategory === 'custom') {
        return [];
      }
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
    }

    // Search across all categories
    const allEmojis: string[] = [];
    Object.values(EMOJI_CATEGORIES).forEach(cat => {
      allEmojis.push(...cat.emojis);
    });
    return [...new Set(allEmojis)].slice(0, 100);
  };

  if (!isOpen) return null;

  const filteredEmojis = getFilteredEmojis();

  return (
    <div 
      ref={pickerRef}
      className={`emoji-picker ${position === 'top' ? 'emoji-picker-top' : 'emoji-picker-bottom'}`}
    >
      {/* Header with search */}
      <div className="emoji-picker-header">
        <div className="emoji-search-container">
          <Search size={16} className="emoji-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="emoji-search-input"
          />
          {searchQuery && (
            <button className="emoji-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="emoji-categories">
        {/* Recent */}
        <button
          className={`emoji-category-btn ${activeCategory === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveCategory('recent')}
          title="Gần đây"
        >
          <Clock size={18} />
        </button>

        {/* Custom SkillVerse */}
        <button
          className={`emoji-category-btn custom ${activeCategory === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveCategory('custom')}
          title="SkillVerse"
        >
          <Sparkles size={18} />
        </button>

        {/* Divider */}
        <div className="emoji-category-divider" />

        {/* Standard categories */}
        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => {
          if (key === 'recent') return null;
          const IconComponent = category.icon;
          return (
            <button
              key={key}
              className={`emoji-category-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
              title={category.name}
            >
              <IconComponent size={18} />
            </button>
          );
        })}
      </div>

      {/* Emoji grid */}
      <div className="emoji-grid-container">
        {activeCategory === 'custom' ? (
          <div className="custom-emoji-grid">
            <div className="custom-emoji-section-title">
              <Sparkles size={14} />
              <span>SkillVerse Special</span>
            </div>
            <div className="emoji-grid custom">
              {SKILLVERSE_CUSTOM_EMOJIS.map((customEmoji, index) => (
                <button
                  key={index}
                  className="emoji-btn custom-emoji-btn"
                  onClick={() => handleCustomEmojiClick(customEmoji)}
                  title={customEmoji.name}
                >
                  <img 
                    src={customEmoji.url} 
                    alt={customEmoji.name}
                    className="custom-emoji-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-emoji.png';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {filteredEmojis.length === 0 ? (
              <div className="emoji-empty">
                <Smile size={32} />
                <p>Không có emoji gần đây</p>
              </div>
            ) : (
              <div className="emoji-grid">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="emoji-btn"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="emoji-picker-footer">
        <span className="emoji-preview">
          {activeCategory === 'custom' ? 'SkillVerse Emojis' : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.name || 'Emoji'}
        </span>
      </div>
    </div>
  );
};

export default EmojiPicker;
