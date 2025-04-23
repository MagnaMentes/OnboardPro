document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const response = await fetch("/api/login", {
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
      const userResponse = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userResponse.json();

      // Перенаправляем в зависимости от роли
      if (userData.role === "hr") {
        window.location.href = "/hr_dashboard.html";
      } else if (userData.role === "manager") {
        window.location.href = "/manager_dashboard.html";
      } else {
        window.location.href = "/dashboard.html";
      }
    } else {
      alert("Ошибка входа: " + data.detail);
    }
  } catch (error) {
    alert("Ошибка: " + error.message);
  }
});
