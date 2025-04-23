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
      window.location.href = "/src/dashboard.html";
    } else {
      alert("Ошибка входа: " + data.detail);
    }
  } catch (error) {
    alert("Ошибка: " + error.message);
  }
});
