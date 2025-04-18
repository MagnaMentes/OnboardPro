document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("http://localhost:8000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ username: email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.access);
          localStorage.setItem("refresh", data.refresh);
          window.location.href = "/";
        } else {
          const errorData = await response.json();
          alert(`Login failed: ${errorData.detail || "Invalid credentials"}`);
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Error during login. Please try again.");
      }
    });
});
