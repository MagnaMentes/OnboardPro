import { ChakraProvider } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RewardsPage from "./pages/RewardsPage"; // Добавляем импорт страницы наград
import Analytics from "./pages/admin/Analytics";
import OnboardingProgressDemo from "./pages/OnboardingProgressDemo";
import MyMeetingsPage from "./pages/booking/MyMeetingsPage";
import ManageMeetingsPage from "./pages/booking/ManageMeetingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import authApi from "./api/auth";
import { theme } from "./theme";

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  // Проверяем, есть ли сохраненный токен и пользователь в LocalStorage
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setTokens(storedAccessToken, storedRefreshToken);
      setUser(JSON.parse(storedUser));

      // Проверяем валидность сессии, запрашивая данные пользователя с сервера
      authApi.getCurrentUser().catch(() => {
        // Если запрос не удался, очищаем локальное хранилище
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setTokens(null, null);
        setUser(null);
      });
    }
  }, [setTokens, setUser]);

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          {/* Открытые маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Защищенные маршруты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route
              path="/onboarding/progress"
              element={<OnboardingProgressDemo />}
            />
            <Route path="/booking/meetings" element={<MyMeetingsPage />} />
          </Route>

          {/* Маршруты только для админов */}
          <Route element={<ProtectedRoute requiredRole={["admin"]} />}>
            {/* Здесь будут маршруты только для администраторов */}
          </Route>

          {/* Маршруты для HR и админов */}
          <Route element={<ProtectedRoute requiredRole={["admin", "hr"]} />}>
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route
              path="/admin/booking/manage"
              element={<ManageMeetingsPage />}
            />
          </Route>
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </ChakraProvider>
  );
}

export default App;
