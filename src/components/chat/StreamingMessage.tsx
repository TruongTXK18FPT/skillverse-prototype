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
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTarget = contentRef.current;
      
      if (indexRef.current < currentTarget.length) {
        const chunkSize = 5; // Increased chunk size for better responsiveness
        const nextChunk = currentTarget.slice(indexRef.current, indexRef.current + chunkSize);
        setDisplayedContent((prev) => prev + nextChunk);
        indexRef.current += chunkSize;
        scrollToBottom();
      } else {
        // Check if we are done (parent controls unmounting, but we can callback)
        if (onComplete && indexRef.current >= currentTarget.length) {
           // We don't call onComplete here immediately because content might still be growing
           // But if the parent stops updating content, we might want to signal.
           // For now, we just wait.
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [scrollToBottom, onComplete]);

  return <MessageRenderer content={displayedContent} isExpertMode={isExpertMode} />;
};
