document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`,
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.access_token);

      // Получаем информацию о пользователе чтобы определить его роль
      const userResponse = await fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userResponse.json();

      // Перенаправляем в зависимости от роли
      if (userData.role === "hr" || userData.role === "manager") {
        window.location.href = "/src/manager_dashboard.html";
      } else {
        window.location.href = "/src/dashboard.html";
      }
    } else {
      alert("Ошибка входа: " + data.detail);
    }
  } catch (error) {
    alert("Ошибка: " + error.message);
  }
});
