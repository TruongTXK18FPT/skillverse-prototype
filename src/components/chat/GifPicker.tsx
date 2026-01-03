import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Sparkles, Loader2, ImageOff } from 'lucide-react';
import './GifPicker.css';

// GIPHY API Configuration
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Free tier API key
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

interface GifData {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
    preview_gif: {
      url: string;
    };
  };
}

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gifUrl: string, previewUrl: string) => void;
  position?: 'top' | 'bottom';
}

const TRENDING_SEARCHES = [
  'happy', 'sad', 'love', 'funny', 'excited', 
  'thumbs up', 'clap', 'party', 'hi', 'bye'
];

const GifPicker: React.FC<GifPickerProps> = ({ 
  isOpen, 
  onClose, 
  onGifSelect,
  position = 'top' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [trendingGifs, setTrendingGifs] = useState<GifData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Fetch trending GIFs on mount
  useEffect(() => {
    if (isOpen) {
      fetchTrendingGifs();
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchTrendingGifs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=25&rating=g`
      );
      const data = await response.json();
      setTrendingGifs(data.data || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải GIF');
      console.error('Error fetching trending GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchGifs = useCallback(async (query: string, newSearch: boolean = true) => {
    if (!query.trim()) {
      setGifs([]);
      setOffset(0);
      setHasMore(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const currentOffset = newSearch ? 0 : offset;
      const response = await fetch(
        `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=25&offset=${currentOffset}&rating=g&lang=vi`
      );
      const data = await response.json();
      
      if (newSearch) {
        setGifs(data.data || []);
        setOffset(25);
      } else {
        setGifs(prev => [...prev, ...(data.data || [])]);
        setOffset(prev => prev + 25);
      }
      
      setHasMore((data.data || []).length === 25);
    } catch (err) {
      setError('Không thể tìm kiếm GIF');
      console.error('Error searching GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchGifs(value, true);
    }, 300);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    searchGifs(term, true);
  };

  const handleScroll = () => {
    if (!gridRef.current || isLoading || !hasMore || !searchQuery) return;
    
    const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      searchGifs(searchQuery, false);
    }
  };

  const handleGifClick = (gif: GifData) => {
    const originalUrl = gif.images.original.url;
    const previewUrl = gif.images.fixed_height.url;
    onGifSelect(originalUrl, previewUrl);
    onClose();
  };

  if (!isOpen) return null;

  const displayGifs = searchQuery ? gifs : trendingGifs;

  return (
    <div 
      ref={pickerRef}
      className={`gif-picker ${position === 'top' ? 'gif-picker-top' : 'gif-picker-bottom'}`}
    >
      {/* Header */}
      <div className="gif-picker-header">
        <div className="gif-search-container">
          <Search size={16} className="gif-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm GIF..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="gif-search-input"
          />
          {searchQuery && (
            <button 
              className="gif-search-clear" 
              onClick={() => {
                setSearchQuery('');
                setGifs([]);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button className="gif-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Quick searches */}
      {!searchQuery && (
        <div className="gif-quick-searches">
          <div className="gif-section-title">
            <TrendingUp size={14} />
            <span>Tìm kiếm phổ biến</span>
          </div>
          <div className="gif-quick-tags">
            {TRENDING_SEARCHES.map((term, index) => (
              <button
                key={index}
                className="gif-quick-tag"
                onClick={() => handleQuickSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Grid */}
      <div 
        ref={gridRef}
        className="gif-grid-container"
        onScroll={handleScroll}
      >
        {error ? (
          <div className="gif-error">
            <ImageOff size={32} />
            <p>{error}</p>
            <button onClick={fetchTrendingGifs} className="gif-retry-btn">
              Thử lại
            </button>
          </div>
        ) : displayGifs.length === 0 && !isLoading ? (
          <div className="gif-empty">
            <Sparkles size={32} />
            <p>{searchQuery ? 'Không tìm thấy GIF' : 'Nhập từ khóa để tìm GIF'}</p>
          </div>
        ) : (
          <>
            {!searchQuery && (
              <div className="gif-section-title trending">
                <TrendingUp size={14} />
                <span>Đang hot</span>
              </div>
            )}
            <div className="gif-masonry-grid">
              {displayGifs.map((gif) => (
                <div
                  key={gif.id}
                  className="gif-item"
                  onClick={() => handleGifClick(gif)}
                  title={gif.title}
                >
                  <img
                    src={gif.images.fixed_height_small.url}
                    alt={gif.title}
                    loading="lazy"
                  />
                  <div className="gif-item-overlay">
                    <span>Chọn</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {isLoading && (
          <div className="gif-loading">
            <Loader2 size={24} className="gif-loading-spinner" />
            <span>Đang tải...</span>
          </div>
        )}
      </div>

      {/* Footer - GIPHY attribution */}
      <div className="gif-picker-footer">
        <span>Powered by</span>
        <img 
          src="https://giphy.com/static/img/giphy-logo.svg" 
          alt="GIPHY" 
          className="giphy-logo"
        />
      </div>
    </div>
  );
};

export default GifPicker;
