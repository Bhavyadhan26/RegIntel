import { useEffect, useState } from 'react';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const getDesktopState = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
};

export const useResponsiveSidebar = () => {
  const [isDesktop, setIsDesktop] = useState(getDesktopState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(getDesktopState);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      setIsSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isDesktop,
    isSidebarOpen,
    openSidebar: () => setIsSidebarOpen(true),
    closeSidebar: () => setIsSidebarOpen(false),
  };
};