import {useEffect} from 'react';

/**
 * Hook that exposes a scroll-to-top method to parent components
 * Used for tab navigation scroll-to-top functionality
 */
export const useScrollToTop = (
  scrollRef: React.RefObject<any>,
  setScrollRef?: (ref: any) => void,
) => {
  useEffect(() => {
    if (setScrollRef && scrollRef.current !== null) {
      setScrollRef({
        scrollToTop: () => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({y: 0, animated: true});
          }
        },
      });
    }
  }, [scrollRef, setScrollRef]);
};