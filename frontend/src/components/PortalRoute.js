import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

/**
 * Компонент для обработки доступа к порталу кандидата
 * В отличие от ProtectedRoute, этот компонент:
 * 1. Не требует полной авторизации в системе, достаточно токена портала
 * 2. Не имеет ограничений по ролям, т.к. портал доступен только кандидатам
 */
const PortalRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams(); // Получаем ID кандидата из URL, если есть

  useEffect(() => {
    const checkPortalAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // Без токена нет доступа к порталу
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Для портала не проверяем роль - любой токен подходит
      // Проверка соответствия токена и ID кандидата происходит в компоненте Portal.jsx
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkPortalAuth();
  }, [id]);

  if (isLoading) {
    // Пока проверяем авторизацию, показываем индикатор загрузки
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если нет токена, перенаправляем на страницу логина
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если токен есть, показываем порталь кандидата
  return <Outlet />;
};

export default PortalRoute;
