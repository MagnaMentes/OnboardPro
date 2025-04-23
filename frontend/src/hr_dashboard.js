async function fetchAnalyticsSummary() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("http://localhost:8000/analytics/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Access denied");
    const data = await response.json();

    // Обновляем статистику
    document.getElementById("total-tasks").textContent = data.task_stats.total;
    document.getElementById("completed-tasks").textContent =
      data.task_stats.completed;
    document.getElementById("completion-rate").textContent = `${(
      data.task_stats.completion_rate * 100
    ).toFixed(1)}%`;
    document.getElementById("feedback-per-user").textContent =
      data.feedback_stats.avg_per_user.toFixed(1);
  } catch (error) {
    console.error("Error fetching analytics:", error);
  }
}

async function fetchDepartmentProgress() {
  const token = localStorage.getItem("token");
  try {
    const [tasksResponse, usersResponse] = await Promise.all([
      fetch("http://localhost:8000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!tasksResponse.ok || !usersResponse.ok)
      throw new Error("Access denied");

    const tasks = await tasksResponse.json();
    const users = await usersResponse.json();

    // Группируем задачи по отделам
    const departmentStats = {};
    tasks.forEach((task) => {
      const user = users.find((u) => u.id === task.user_id);
      if (user && user.department) {
        if (!departmentStats[user.department]) {
          departmentStats[user.department] = {
            total: 0,
            completed: 0,
          };
        }
        departmentStats[user.department].total++;
        if (task.status === "completed") {
          departmentStats[user.department].completed++;
        }
      }
    });

    // Создаем график прогресса по отделам
    const ctx = document.getElementById("department-progress").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(departmentStats),
        datasets: [
          {
            label: "Выполнено задач",
            data: Object.values(departmentStats).map((s) => s.completed),
            backgroundColor: "#10B981",
          },
          {
            label: "Всего задач",
            data: Object.values(departmentStats).map((s) => s.total),
            backgroundColor: "#6B7280",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching department progress:", error);
  }
}

async function fetchCompletionTrends() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("http://localhost:8000/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tasks = await response.json();

    // Группируем задачи по дате
    const tasksByDate = {};
    tasks.forEach((task) => {
      const date = new Date(task.created_at).toLocaleDateString();
      if (!tasksByDate[date]) {
        tasksByDate[date] = {
          total: 0,
          completed: 0,
        };
      }
      tasksByDate[date].total++;
      if (task.status === "completed") {
        tasksByDate[date].completed++;
      }
    });

    // Создаем график трендов
    const ctx = document.getElementById("completion-trends").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(tasksByDate),
        datasets: [
          {
            label: "Процент выполнения",
            data: Object.values(tasksByDate).map(
              (s) => (s.completed / s.total) * 100
            ),
            borderColor: "#1D4ED8",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching completion trends:", error);
  }
}

async function fetchTasksCalendar() {
  const token = localStorage.getItem("token");
  try {
    const [tasksResponse, usersResponse] = await Promise.all([
      fetch("http://localhost:8000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const tasks = await tasksResponse.json();
    const users = await usersResponse.json();

    // Сортируем задачи по дедлайну
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Отображаем календарь задач
    const calendar = document.getElementById("tasks-calendar");
    calendar.innerHTML = tasks
      .map((task) => {
        const user = users.find((u) => u.id === task.user_id);
        const deadlineDate = new Date(task.deadline);
        const isOverdue =
          deadlineDate < new Date() && task.status !== "completed";

        return `
                <div class="border-l-4 ${
                  isOverdue
                    ? "border-red-500"
                    : task.status === "completed"
                    ? "border-green-500"
                    : "border-yellow-500"
                } pl-4 py-2">
                    <p class="font-semibold">${task.title}</p>
                    <p class="text-sm text-gray-600">
                        Исполнитель: ${user ? user.email : "Не назначен"}
                    </p>
                    <p class="text-sm text-gray-600">
                        Дедлайн: ${deadlineDate.toLocaleDateString()}
                    </p>
                    <p class="text-sm ${
                      isOverdue
                        ? "text-red-500"
                        : task.status === "completed"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }">
                        Статус: ${task.status}
                    </p>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching calendar:", error);
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
  // Инициализируем навигацию и получаем данные пользователя
  const user = await initNavigation();
  if (!user) return;

  // Проверяем роль пользователя
  if (user.role !== "hr") {
    window.location.href = "/src/dashboard.html";
    return;
  }

  // Загружаем данные дашборда
  fetchAnalyticsSummary();
  fetchDepartmentProgress();
  fetchCompletionTrends();
  fetchTasksCalendar();

  // Обновляем данные каждые 5 минут
  setInterval(() => {
    fetchAnalyticsSummary();
    fetchTasksCalendar();
  }, 5 * 60 * 1000);
});
