document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/login.html";
    return;
  }

  // Telegram Integration
  document
    .getElementById("telegram-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const telegram_id = document.getElementById("telegram-id").value;

      try {
        const response = await fetch(
          "http://localhost:8000/integrations/telegram",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ telegram_id }),
          }
        );

        if (response.ok) {
          alert("Telegram успешно подключен");
        } else {
          const error = await response.json();
          throw new Error(error.detail || "Ошибка подключения Telegram");
        }
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    });

  // Google Calendar Integration
  document
    .getElementById("calendar-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const task_id = parseInt(document.getElementById("task-id").value);

      try {
        const response = await fetch(
          "http://localhost:8000/integrations/calendar",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ task_id }),
          }
        );

        if (response.ok) {
          alert("Событие успешно создано в календаре");
        } else {
          const error = await response.json();
          throw new Error(error.detail || "Ошибка создания события");
        }
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    });

  // Workable Integration
  document
    .getElementById("workable-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const response = await fetch(
          "http://localhost:8000/integrations/workable",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          alert("Сотрудники успешно импортированы из Workable");
        } else {
          const error = await response.json();
          throw new Error(error.detail || "Ошибка импорта сотрудников");
        }
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    });
});
