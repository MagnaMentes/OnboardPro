import React, { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Flex, Spinner, Text, VStack } from "@chakra-ui/react";

interface ProtectedRouteProps {
  requiredRole?: string[];
}

const ProtectedRoute = ({
  requiredRole,
  children,
}: PropsWithChildren<ProtectedRouteProps>) => {
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
  return <>{children}</>;
};

export default ProtectedRoute;
