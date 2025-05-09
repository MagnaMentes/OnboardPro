import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { usersApi } from "../config/api";
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BoltIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import webSocketService from "../services/WebSocketService";

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
    name: "HR Dashboard",
    path: "/hr-dashboard",
    icon: ChartBarIcon,
    roles: ["hr"],
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
];

export default function Layout() {
  const [user, setUser] = useState(null);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем данные о текущем пользователе
    usersApi
      .getCurrentUser()
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Ошибка при получении данных пользователя:", err);
        // Эта ошибка будет перехвачена компонентом ProtectedRoute
        // и пользователь будет перенаправлен на страницу логина
      });
  }, [navigate]);

  // Отслеживаем статус подключения WebSocket
  useEffect(() => {
    // Функция для проверки статуса WebSocket соединения
    const checkWebSocketStatus = () => {
      setWsConnected(webSocketService.isConnected);
    };

    // Проверяем статус при загрузке
    checkWebSocketStatus();

    // Создаем интервал для периодической проверки
    const intervalId = setInterval(checkWebSocketStatus, 5000);

    // Очищаем интервал при размонтировании компонента
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Функция выхода
  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    // Добавляем принудительное обновление страницы после перенаправления
    navigate("/login", { replace: true });
    // Перезагрузка страницы для полного сброса состояния приложения
    window.location.reload();
  }

  // Фильтрация навигационных элементов по роли пользователя
  const filteredNavItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role?.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold flex items-center">
            <span>OnboardPro</span>
            {wsConnected && (
              <span className="ml-2 flex items-center text-xs text-green-300 bg-blue-700 px-2 py-1 rounded-full">
                <WifiIcon className="h-3 w-3 mr-1" />
                Real-time
              </span>
            )}
          </Link>

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
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="nav-link flex items-center"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 12H9m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="nav-text">Выйти</span>
              </button>
            )}
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
            {user && (
              <button
                onClick={handleLogout}
                className={
                  "nav-link flex items-center ml-2" +
                  (location.pathname === "/logout" ? " active" : "")
                }
                title="Выйти"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 12H9m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="nav-text">Выйти</span>
              </button>
            )}
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
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
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
            {user && (
              <button
                onClick={() => {
                  setIsBurgerOpen(false);
                  handleLogout();
                }}
                className="nav-link flex items-center mt-2"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 12H9m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span>Выйти</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-auto py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-blue-600 text-white py-4 sticky bottom-0 z-10 shadow-md-up">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-1">
            © 2025 Created by magna_mentes. Все права защищены.
          </p>
        </div>
      </footer>

      <style jsx="true">{`
        .container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          color: white;
          text-decoration: none;
          transition: background-color 0.2s;
          margin: 0.125rem;
        }

        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .nav-link.active {
          background-color: rgba(255, 255, 255, 0.2);
          font-weight: 500;
        }

        .nav-text {
          font-size: 0.875rem;
        }

        .shadow-md-up {
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1),
            0 -2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  );
}
