import { useState, useEffect, useRef } from 'react';
import MessageRenderer from '../MessageRenderer'; // Your existing renderer

interface StreamingMessageProps {
  content: string;
  scrollToBottom: () => void;
  onComplete?: () => void;
  isExpertMode?: boolean;
}

export const StreamingMessage = ({ content, scrollToBottom, onComplete, isExpertMode }: StreamingMessageProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset if content changes completely (rare case)
    indexRef.current = 0;
    setDisplayedContent("");

    const interval = setInterval(() => {
      // Chunk size: Increase to make it faster (e.g., 3 chars per tick)
      const chunkSize = 3; 
      
      if (indexRef.current < content.length) {
        const nextChunk = content.slice(indexRef.current, indexRef.current + chunkSize);
        setDisplayedContent((prev) => prev + nextChunk);
        indexRef.current += chunkSize;
        scrollToBottom(); // Keep view at bottom
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // Speed in ms

    return () => clearInterval(interval);
  }, [content, scrollToBottom, onComplete]);

  return <MessageRenderer content={displayedContent} isExpertMode={isExpertMode} />;
};
