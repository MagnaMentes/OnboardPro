import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import { Button, Card } from "../config/theme";
import {
  ExclamationCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Устанавливаем заголовок страницы "Вход в систему"
  usePageTitle("Вход в систему");

  // При загрузке страницы проверяем, авторизован ли пользователь
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Если токен есть, проверяем его и перенаправляем на соответствующую страницу
      authApi
        .validateToken()
        .then((userData) => {
          // Перенаправляем на соответствующий дашборд в зависимости от роли
          const roleInLowerCase = userData.role?.toLowerCase();
          if (roleInLowerCase === "hr") {
            navigate("/hr-dashboard");
          } else if (roleInLowerCase === "manager") {
            navigate("/manager-dashboard");
          } else {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          // Если токен невалидный - удаляем его
          localStorage.removeItem("token");
        });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Используем centralized API клиент для входа
      const data = await authApi.login(email, password);

      // Сохраняем токен
      localStorage.setItem("token", data.access_token);

      // Перенаправляем пользователя в зависимости от его роли
      const roleInLowerCase = data.role?.toLowerCase();
      if (roleInLowerCase === "hr") {
        navigate("/hr-dashboard");
      } else if (roleInLowerCase === "manager") {
        navigate("/manager-dashboard");
      } else {
        // По умолчанию для сотрудников
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Ошибка при авторизации:", err);
      setError("Ошибка авторизации. Проверьте логин и пароль.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Левая половина с декоративным фоном */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-700 opacity-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <pattern
              id="pattern-circles"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternContentUnits="userSpaceOnUse"
            >
              <circle
                id="pattern-circle"
                cx="10"
                cy="10"
                r="1.6257413380501518"
                fill="#fff"
                fillOpacity="0.1"
              ></circle>
            </pattern>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pattern-circles)"
            ></rect>
          </svg>
        </div>

        <div className="relative flex flex-col justify-center items-center h-full px-10 z-10">
          <div className="text-white text-center">
            <h1 className="text-5xl font-bold mb-6">OnboardPro</h1>
            <p className="text-xl opacity-90 mb-8">
              Инновационная платформа, меняющая подход к адаптации новых
              сотрудников
            </p>

            {/* Список ключевых особенностей */}
            <div className="hidden lg:flex justify-center space-y-4 mb-10 text-left">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Автоматические планы адаптации для каждого сотрудника
                  </span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Интеграция с корпоративными системами обучения</span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Аналитика эффективности онбординга в реальном времени
                  </span>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Персонализированный подход к каждому новому сотруднику
                  </span>
                </li>
              </ul>
            </div>

            <div className="hidden lg:block max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 shadow-lg border border-white/20">
                <p className="text-white/90 italic">
                  "Внедрение OnboardPro сократило срок адаптации наших новых
                  сотрудников на 40% и повысило удержание персонала на 25%.
                  Система полностью преобразила наш HR-департамент."
                </p>
                <div className="mt-4 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-blue-700 font-bold">МВ</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-white font-medium">Мария Васильева</p>
                    <p className="text-white/70 text-sm">
                      Директор по персоналу, ООО "ТехИнновации"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Правая половина с формой входа */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="lg:hidden mb-6">
              <h1 className="text-4xl font-bold text-blue-600">OnboardPro</h1>
              <p className="mt-2 text-gray-600">
                Система управления адаптацией
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-red-500 mt-0.5" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <Card className="shadow-lg border border-gray-100 rounded-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <EnvelopeIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите ваш email"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center mb-1">
                    <LockClosedIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Пароль
                    </label>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите ваш пароль"
                    required
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-gray-700"
                  >
                    Запомнить меня
                  </label>
                </div>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Забыли пароль?
                </button>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full py-3 text-base shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Выполняется вход..." : "Войти"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="text-center mt-8 text-gray-600 text-sm">
            <p>© 2025 Created by magna_mentes. Все права защищены.</p>
            <div className="flex justify-center space-x-4 mt-3">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                Правила
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                Конфиденциальность
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                Помощь
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
