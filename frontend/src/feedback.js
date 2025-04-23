document.addEventListener("DOMContentLoaded", async () => {
  const user = await initNavigation();
  if (!user) return;

  // Получение информации о текущем пользователе и инициализация данных
  async function init() {
    try {
      if (user.role !== "employee") {
        // Загружаем список пользователей для выбора получателя (только для HR и manager)
        const usersResponse = await fetch("http://localhost:8000/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const recipientSelect = document.getElementById("recipient_id");
          recipientSelect.innerHTML = users
            .filter((u) => u.id !== user.id) // Исключаем текущего пользователя
            .map(
              (u) => `
                            <option value="${u.id}">
                                ${u.email} (${getRoleText(u.role)}${
                u.department ? `, ${u.department}` : ""
              })
                            </option>
                        `
            )
            .join("");
        }
      } else {
        // Для обычных сотрудников показываем только их руководителя и HR
        const recipientSelect = document.getElementById("recipient_id");
        recipientSelect.innerHTML = `
                    <option value="1">HR департамент</option>
                    ${
                      user.department
                        ? `<option value="2">Руководитель ${user.department}</option>`
                        : ""
                    }
                `;
      }

      // Загружаем список задач
      const tasksResponse = await fetch("http://localhost:8000/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        const taskSelect = document.getElementById("task_id");
        taskSelect.innerHTML =
          '<option value="">Выберите задачу</option>' +
          tasks
            .map(
              (t) => `
                        <option value="${t.id}">${t.title}</option>
                    `
            )
            .join("");
      }

      // Загружаем отзывы
      await fetchFeedback();
    } catch (error) {
      console.error("Ошибка инициализации:", error);
    }
  }

  // Загрузка отзывов
  async function fetchFeedback() {
    try {
      const response = await fetch("http://localhost:8000/feedback", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Ошибка загрузки отзывов");
      const feedback = await response.json();

      const feedbackList = document.getElementById("feedback-list");
      if (feedback.length === 0) {
        feedbackList.innerHTML =
          '<p class="text-gray-500 text-center">Нет отзывов для отображения</p>';
        return;
      }

      // Создаем кэш для хранения email пользователей
      const userEmailCache = new Map();

      // Функция для получения email пользователя
      async function getUserEmail(userId) {
        if (userEmailCache.has(userId)) {
          return userEmailCache.get(userId);
        }

        try {
          const response = await fetch(
            `http://localhost:8000/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (!response.ok) {
            return `Пользователь ${userId}`;
          }
          const userData = await response.json();
          userEmailCache.set(userId, userData.email);
          return userData.email;
        } catch {
          return `Пользователь ${userId}`;
        }
      }

      // Получаем email для всех уникальных пользователей
      const uniqueUserIds = new Set(
        feedback.flatMap((f) => [f.sender_id, f.recipient_id])
      );
      await Promise.all([...uniqueUserIds].map((id) => getUserEmail(id)));

      // Отрисовываем отзывы
      feedbackList.innerHTML = (
        await Promise.all(
          feedback.map(
            async (f) => `
                <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-semibold text-gray-800">
                                От: ${await getUserEmail(f.sender_id)}
                            </p>
                            <p class="text-sm text-gray-500">
                                Кому: ${await getUserEmail(f.recipient_id)}
                            </p>
                        </div>
                        <span class="text-sm text-gray-500">
                            ${new Date(f.created_at).toLocaleString("ru-RU")}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-2">${f.message}</p>
                    ${
                      f.task_id
                        ? `
                        <p class="text-sm text-gray-500">
                            Задача: ${f.task_id}
                        </p>
                    `
                        : ""
                    }
                </div>
            `
          )
        )
      ).join("");
    } catch (error) {
      console.error("Ошибка загрузки отзывов:", error);
      const feedbackList = document.getElementById("feedback-list");
      feedbackList.innerHTML =
        '<p class="text-red-500 text-center">Ошибка загрузки отзывов</p>';
    }
  }

  // Отправка отзыва
  async function sendFeedback(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const recipient_id = document.getElementById("recipient_id").value;
      const task_id = document.getElementById("task_id").value;
      const message = document.getElementById("message").value;

      const response = await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: parseInt(recipient_id),
          task_id: task_id ? parseInt(task_id) : null,
          message,
        }),
      });

      if (!response.ok) throw new Error("Ошибка отправки отзыва");

      form.reset();
      await fetchFeedback();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось отправить отзыв: " + error.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  function getRoleText(role) {
    const roles = {
      employee: "Сотрудник",
      manager: "Менеджер",
      hr: "HR",
    };
    return roles[role] || role;
  }

  // Инициализация обработчиков событий
  document
    .getElementById("feedback-form")
    .addEventListener("submit", sendFeedback);

  // Запускаем инициализацию
  init();
});
