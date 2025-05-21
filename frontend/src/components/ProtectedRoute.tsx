import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  requiredRole?: string[];
}

/**
 * Компонент для защиты маршрутов, требующих аутентификации
 * и определенных ролей пользователя
 */
const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если требуется определенная роль и у пользователя ее нет, перенаправляем на dashboard
  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Если все проверки пройдены, рендерим дочерние компоненты
  return <Outlet />;
};

export default ProtectedRoute;
