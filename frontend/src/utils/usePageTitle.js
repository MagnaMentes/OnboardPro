import { useEffect } from 'react';
import { setPageTitle, resetPageTitle } from './titleUtils';

/**
 * Хук для управления заголовком страницы
 * @param {string} title - Название страницы
 */
const usePageTitle = (title) => {
  useEffect(() => {
    setPageTitle(title);
    
    // Сбрасываем заголовок при размонтировании компонента
    return () => {
      resetPageTitle();
    };
  }, [title]);
};

export default usePageTitle;