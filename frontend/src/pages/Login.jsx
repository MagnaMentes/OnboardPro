import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка при входе");
      }

      localStorage.setItem("token", data.access_token);

      // Получаем информацию о пользователе, чтобы узнать его роль
      const userResponse = await fetch("http://localhost:8000/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = await userResponse.json();

      // Перенаправляем пользователя в зависимости от его роли
      if (userData.role === "hr") {
        navigate("/hr-dashboard");
      } else if (userData.role === "manager") {
        navigate("/manager-dashboard");
      } else {
        // По умолчанию для сотрудников
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-lg shadow-lg">
        <h1 className="mb-8 text-3xl font-bold text-center text-blue-600">
          OnboardPro
        </h1>
        <h2 className="mb-6 text-2xl font-semibold text-center">
          Вход в систему
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block mb-2 text-sm font-medium"
              htmlFor="password"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Выполняется вход..." : "Войти"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Демо аккаунты:</p>
          <div className="flex justify-center gap-4 mt-2">
            <div className="border p-2 rounded">
              <p>
                <strong>HR:</strong> test@onboardpro.com
              </p>
              <p>
                <strong>Пароль:</strong> test123
              </p>
            </div>
            <div className="border p-2 rounded">
              <p>
                <strong>Менеджер:</strong> manager@onboardpro.com
              </p>
              <p>
                <strong>Пароль:</strong> test123
              </p>
            </div>
            <div className="border p-2 rounded">
              <p>
                <strong>Сотрудник:</strong> employee@onboardpro.com
              </p>
              <p>
                <strong>Пароль:</strong> test123
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 w-full bg-blue-600 text-white text-center py-4 shadow-inner">
        <p>© 2025 magna_mentes. All rights reserved.</p>
      </footer>
    </div>
  );
}
