import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { usersApi } from "../config/api";

/**
 * Компонент защищенного маршрута
 * Проверяет наличие токена и его валидность перед отображением дочерних маршрутов
 */
const ProtectedRoute = ({ requiredRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Проверяем валидность токена запросом информации о пользователе
        const userData = await usersApi.getCurrentUser();
        setIsAuthenticated(true);
        setUserRole(userData.role?.toLowerCase()); // Нормализуем роль к нижнему регистру
      } catch (err) {
        // Если токен невалидный, удаляем его
        console.error("Ошибка при проверке авторизации:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Пока проверяем авторизацию, показываем индикатор загрузки
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если не авторизован, перенаправляем на страницу логина
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если указаны требуемые роли и роль пользователя не входит в них, показываем заглушку
  if (
    requiredRoles.length > 0 &&
    userRole &&
    !requiredRoles.map((role) => role.toLowerCase()).includes(userRole)
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md max-w-md">
          <h3 className="text-lg font-bold">Доступ запрещен</h3>
          <p>У вас недостаточно прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  // Если всё в порядке, отображаем дочерние маршруты
  return <Outlet />;
};

export default ProtectedRoute;
