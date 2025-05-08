import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import {
  Button,
  FormField,
  Card,
  FORM_STYLES,
  CARD_STYLES,
} from "../config/theme";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md px-6 py-8">
        <h1 className="mb-8 text-3xl font-bold text-center text-blue-600">
          OnboardPro
        </h1>
        <h2 className="mb-6 text-2xl font-semibold text-center">
          Вход в систему
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите ваш email"
            required
          />

          <FormField
            label="Пароль"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите ваш пароль"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Выполняется вход..." : "Войти"}
          </Button>
        </form>
      </Card>

      <footer className="fixed bottom-0 w-full bg-blue-600 text-white text-center py-4 shadow-inner">
        <p>© 2025 magna_mentes. All rights reserved.</p>
      </footer>
    </div>
  );
}
