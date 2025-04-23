// Функция для выхода из системы
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/src/login.html";
}

// Функция для проверки токена
async function checkToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/login.html";
    return null;
  }
  return token;
}

// Функция для получения данных пользователя
async function fetchUserData(token) {
  try {
    const response = await fetch("http://localhost:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка:", error);
    localStorage.removeItem("token");
    window.location.href = "/src/login.html";
    return null;
  }
}

// Функция для отрисовки навигации
function renderNavigation(user) {
  const navLinks = document.getElementById("nav-links");
  if (!navLinks) return;

  // Базовые ссылки для всех пользователей
  const links = [
    { href: "/src/dashboard.html", text: "Мои задачи" },
    { href: "/src/feedback.html", text: "Обратная связь" },
  ];

  // Дополнительные ссылки для manager и hr
  if (user.role === "hr" || user.role === "manager") {
    links.push(
      { href: "/src/manager_dashboard.html", text: "Управление задачами" },
      { href: "/src/profiles.html", text: "Профили" }
    );
  }

  // Добавляем кнопку выхода
  const logoutButton = `
    <button 
      onclick="logout()" 
      class="px-3 py-2 hover:bg-blue-700 rounded transition-colors text-white ml-4"
    >
      Выход
    </button>
  `;

  // Отрисовка навигации
  navLinks.innerHTML =
    links
      .map(
        (link) => `
        <a 
            href="${link.href}" 
            class="px-3 py-2 hover:bg-blue-700 rounded transition-colors ${
              window.location.pathname === link.href ? "bg-blue-700" : ""
            }"
        >
            ${link.text}
        </a>
    `
      )
      .join("") + logoutButton;
}

// Основная функция инициализации навигации
async function initNavigation() {
  try {
    const token = await checkToken();
    if (!token) return null;

    const user = await fetchUserData(token);
    if (!user) return null;

    renderNavigation(user);
    return user;
  } catch (error) {
    console.error("Ошибка инициализации навигации:", error);
    return null;
  }
}
