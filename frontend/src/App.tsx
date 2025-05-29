import { ChakraProvider, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import authApi from "./api/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RewardsPage from "./pages/RewardsPage";
import OnboardingProgressDemo from "./pages/OnboardingProgressDemo";
import MyMeetingsPage from "./pages/booking/MyMeetingsPage";
import ManageMeetingsPage from "./pages/booking/ManageMeetingsPage";
import SettingsPage from "./pages/Settings";
import NotificationCenterPage from "./pages/NotificationCenterPage";
// Импорт страниц администрирования
import AdminDashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import UsersListPage from "./pages/admin/UsersListPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import FeedbackPage from "./pages/admin/FeedbackPage";
import FeedbackTemplatesPage from "./pages/admin/FeedbackTemplatesPage";
import FeedbackResultsPage from "./pages/admin/FeedbackResultsPage";
import FeedbackUserDetailPage from "./pages/admin/FeedbackUserDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  useAuthStore,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
} from "./store/authStore";
import { theme } from "./theme/theme";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  // Проверяем, есть ли сохраненный токен и пользователь в LocalStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_DATA_KEY);

      if (storedAccessToken && storedRefreshToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          useAuthStore
            .getState()
            .login(storedAccessToken, storedRefreshToken, userData);

          // Асинхронно проверяем валидность сессии на сервере
          try {
            const user = await authApi.getCurrentUser();
            if (JSON.stringify(user) !== storedUser) {
              useAuthStore.getState().setUser(user);
              localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
            }
            console.log("Сессия подтверждена на сервере");
          } catch (error) {
            console.error("Ошибка при проверке сессии:", error);
            useAuthStore.getState().logout();
          }
        } catch (error) {
          console.error("Ошибка при восстановлении сессии:", error);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_DATA_KEY);
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // Показываем загрузку до инициализации
  if (!isInitialized) {
    return (
      <ChakraProvider theme={theme}>
        <Flex height="100vh" width="100vw" justify="center" align="center">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text>Загрузка...</Text>
          </VStack>
        </Flex>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Toaster position="top-right" />
        <Routes>
          {/* Открытые маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Защищенные маршруты */}
          <Route element={<ProtectedRoute />}>
            {/* пользовательские страницы */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route
              path="/onboarding/progress"
              element={<OnboardingProgressDemo />}
            />
            <Route path="/booking/meetings" element={<MyMeetingsPage />} />
            <Route path="/booking/manage" element={<ManageMeetingsPage />} />
            {/* новый маршрут для админского управления встречами */}
            <Route
              path="/admin/booking/manage"
              element={<ManageMeetingsPage />}
            />
            {/* страница настроек */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* страница уведомлений */}
            <Route path="/notifications" element={<NotificationCenterPage />} />

            {/* маршруты администрирования */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/employees" element={<UsersListPage />} />
            <Route
              path="/admin/employees/:userId"
              element={<UserDetailPage />}
            />
            {/* маршруты обратной связи */}
            <Route path="/admin/feedback" element={<FeedbackPage />} />
            <Route
              path="/admin/feedback/templates"
              element={<FeedbackTemplatesPage />}
            />
            <Route
              path="/admin/feedback/results"
              element={<FeedbackResultsPage />}
            />
            <Route
              path="/admin/feedback/user/:userId"
              element={<FeedbackUserDetailPage />}
            />
          </Route>
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
