document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const response = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.access);
      window.location.href = "/src/index.html";
    } else {
      alert("Login failed");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
});
