import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import HRDashboard from "./pages/HRDashboard";
import Feedback from "./pages/Feedback";
import Profiles from "./pages/Profiles";
import Integrations from "./pages/Integrations";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<Login />} />

        {/* Защищенные маршруты - требуется авторизация */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Маршруты с проверкой роли */}
            <Route
              element={<ProtectedRoute requiredRoles={["manager", "hr"]} />}
            >
              <Route path="manager-dashboard" element={<ManagerDashboard />} />
              <Route path="profiles" element={<Profiles />} />
            </Route>

            <Route element={<ProtectedRoute requiredRoles={["hr"]} />}>
              <Route path="hr-dashboard" element={<HRDashboard />} />
              <Route path="integrations" element={<Integrations />} />
            </Route>

            <Route path="feedback" element={<Feedback />} />
          </Route>
        </Route>

        {/* Любой другой маршрут перенаправляет на логин или дашборд в зависимости от авторизации */}
        <Route
          path="*"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
