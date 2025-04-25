import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BoltIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: HomeIcon,
    roles: ["employee", "manager", "hr"],
  },
  {
    name: "Manager Dashboard",
    path: "/manager-dashboard",
    icon: UserGroupIcon,
    roles: ["manager", "hr"],
  },
  {
    name: "Feedback",
    path: "/feedback",
    icon: ChatBubbleLeftRightIcon,
    roles: ["employee", "manager", "hr"],
  },
  {
    name: "Profiles",
    path: "/profiles",
    icon: UserIcon,
    roles: ["manager", "hr"],
  },
  {
    name: "Integrations",
    path: "/integrations",
    icon: BoltIcon,
    roles: ["hr"],
  },
  {
    name: "HR Dashboard",
    path: "/hr-dashboard",
    icon: ChartBarIcon,
    roles: ["hr"],
  },
];

export default function Layout() {
  const [user, setUser] = useState(null);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => console.error("Error fetching user:", err));
    }
  }, []);

  // Фильтрация навигационных элементов по роли пользователя
  const filteredNavItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold flex items-center">
            <span>OnboardPro</span>
          </Link>

          {/* Информация о пользователе - видна только на десктопе */}
          {user && (
            <div className="hidden md:flex items-center mr-4 text-sm">
              <span className="mr-2">{user.email}</span>
              <span className="bg-blue-700 px-2 py-1 rounded-full text-xs uppercase">
                {user.role}
              </span>
            </div>
          )}

          {/* Навигация для десктопа (≥1280px) - иконки + текст */}
          <nav className="hidden xl:flex space-x-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="nav-text">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Навигация для планшета (≥768px, <1280px) - только иконки */}
          <nav className="hidden md:flex xl:hidden space-x-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
                title={item.name}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </nav>

          {/* Кнопка бургер-меню для мобильных устройств (<768px) */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setIsBurgerOpen(!isBurgerOpen)}
            aria-label={isBurgerOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isBurgerOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Мобильное меню */}
        <nav
          className={`${
            isBurgerOpen ? "block" : "hidden"
          } md:hidden bg-blue-600 text-white border-t border-blue-500 transition-all duration-300 ease-in-out`}
        >
          <div className="container py-2 flex flex-col space-y-2">
            {user && (
              <div className="flex items-center py-2 border-b border-blue-500 mb-2">
                <span className="mr-2">{user.email}</span>
                <span className="bg-blue-700 px-2 py-1 rounded-full text-xs uppercase">
                  {user.role}
                </span>
              </div>
            )}
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => setIsBurgerOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-grow container py-6 pb-24">
        <Outlet />
      </main>

      <footer className="bg-blue-600 text-white py-4 w-full mt-auto fixed bottom-0 left-0 right-0 z-10 shadow-md">
        <div className="container text-center">
          <p>© 2025 magna_mentes. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
