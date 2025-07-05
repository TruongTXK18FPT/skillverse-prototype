import { useRef, useEffect, RefObject } from 'react';

function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  isActive: boolean = true,
  includeEscape: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    if (isActive) {
      document.addEventListener('mousedown', handleClick);
      if (includeEscape) {
        document.addEventListener('keydown', handleEscape);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClick);
      if (includeEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [callback, isActive, includeEscape]);

  return ref;
}

export default useClickOutside;
