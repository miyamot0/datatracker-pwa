import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

const ScrollReset = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

export default ScrollReset;
