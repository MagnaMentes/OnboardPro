import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import HRDashboard from "./pages/HRDashboard";
import Feedback from "./pages/Feedback";
import Profiles from "./pages/Profiles";
import Integrations from "./pages/Integrations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manager-dashboard" element={<ManagerDashboard />} />
          <Route path="hr-dashboard" element={<HRDashboard />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="integrations" element={<Integrations />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
