document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/src/login.html";
    return;
  }

  let currentUser = null;
  let plans = [];
  let tasks = [];

  const taskForm = document.getElementById("task-form");
  const planForm = document.getElementById("plan-form");
  const createTaskBtn = document.getElementById("create-task-btn");
  const createPlanBtn = document.getElementById("create-plan-btn");
  const cancelTaskBtn = document.getElementById("cancel-task-btn");
  const cancelPlanBtn = document.getElementById("cancel-plan-btn");
  const statusFilter = document.getElementById("status-filter");
  const priorityFilter = document.getElementById("priority-filter");

  // Получение информации о текущем пользователе
  async function getCurrentUser() {
    try {
      const response = await fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      currentUser = await response.json();
      if (currentUser.role !== "hr") {
        createPlanBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Ошибка:", error);
      window.location.href = "/src/login.html";
    }
  }

  // Получение списка планов
  async function fetchPlans() {
    try {
      const response = await fetch("http://localhost:8000/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      plans = await response.json();
      renderPlans();
      updatePlanSelect();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось загрузить планы: " + error.message);
    }
  }

  // Получение списка задач
  async function fetchTasks() {
    try {
      const response = await fetch("http://localhost:8000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось загрузить задачи: " + error.message);
    }
  }

  // Отображение планов
  function renderPlans() {
    const container = document.getElementById("plans-container");
    container.innerHTML = plans
      .map(
        (plan) => `
            <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-gray-800">${
                          plan.title
                        }</h4>
                        <p class="text-sm text-gray-500">Роль: ${getRoleText(
                          plan.role
                        )}</p>
                    </div>
                    <span class="text-xs text-gray-400">
                        ${new Date(plan.created_at).toLocaleDateString("ru-RU")}
                    </span>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Отображение задач
  function renderTasks() {
    const container = document.getElementById("tasks-container");
    const statusValue = statusFilter.value;
    const priorityValue = priorityFilter.value;

    const filteredTasks = tasks.filter((task) => {
      const statusMatch = statusValue === "all" || task.status === statusValue;
      const priorityMatch =
        priorityValue === "all" || task.priority === priorityValue;
      return statusMatch && priorityMatch;
    });

    container.innerHTML = filteredTasks
      .map(
        (task) => `
            <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-800">${task.title}</h4>
                    <span class="px-2 py-1 text-sm rounded ${getPriorityClass(
                      task.priority
                    )}">
                        ${getPriorityText(task.priority)}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-3">${
                  task.description || "Нет описания"
                }</p>
                <div class="flex justify-between items-center text-sm">
                    <div class="space-y-1">
                        <p class="text-gray-500">План: ${getPlanTitle(
                          task.plan_id
                        )}</p>
                        <p class="text-gray-500">
                            Срок: ${new Date(task.deadline).toLocaleDateString(
                              "ru-RU"
                            )}
                        </p>
                    </div>
                    <select
                        class="px-2 py-1 text-sm border rounded ${getStatusClass(
                          task.status
                        )}"
                        onchange="updateTaskStatus(${task.id}, this.value)"
                    >
                        <option value="pending" ${
                          task.status === "pending" ? "selected" : ""
                        }>
                            Ожидает
                        </option>
                        <option value="in_progress" ${
                          task.status === "in_progress" ? "selected" : ""
                        }>
                            В процессе
                        </option>
                        <option value="completed" ${
                          task.status === "completed" ? "selected" : ""
                        }>
                            Завершено
                        </option>
                    </select>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Обновление выпадающего списка планов
  function updatePlanSelect() {
    const planSelect = document.getElementById("plan-select");
    planSelect.innerHTML = plans
      .map((plan) => `<option value="${plan.id}">${plan.title}</option>`)
      .join("");
  }

  // Вспомогательные функции для стилей и текстов
  function getPriorityClass(priority) {
    const classes = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return classes[priority] || "";
  }

  function getStatusClass(status) {
    const classes = {
      pending: "bg-gray-50 text-gray-800",
      in_progress: "bg-blue-50 text-blue-800",
      completed: "bg-green-50 text-green-800",
    };
    return classes[status] || "";
  }

  function getPriorityText(priority) {
    const texts = {
      high: "Высокий",
      medium: "Средний",
      low: "Низкий",
    };
    return texts[priority] || priority;
  }

  function getRoleText(role) {
    const texts = {
      employee: "Сотрудник",
      manager: "Менеджер",
      hr: "HR",
    };
    return texts[role] || role;
  }

  function getPlanTitle(planId) {
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.title : "Неизвестный план";
  }

  // Обработчики событий форм
  createTaskBtn.addEventListener("click", () => {
    taskForm.classList.remove("hidden");
  });

  createPlanBtn.addEventListener("click", () => {
    planForm.classList.remove("hidden");
  });

  cancelTaskBtn.addEventListener("click", () => {
    taskForm.classList.add("hidden");
    document.getElementById("new-task-form").reset();
  });

  cancelPlanBtn.addEventListener("click", () => {
    planForm.classList.add("hidden");
    document.getElementById("new-plan-form").reset();
  });

  document
    .getElementById("new-plan-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch("http://localhost:8000/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: document.getElementById("plan-title").value,
            role: document.getElementById("plan-role").value,
          }),
        });
        if (!response.ok) throw new Error("Ошибка создания плана");
        const newPlan = await response.json();
        plans.push(newPlan);
        renderPlans();
        updatePlanSelect();
        planForm.classList.add("hidden");
        document.getElementById("new-plan-form").reset();
      } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось создать план: " + error.message);
      }
    });

  document
    .getElementById("new-task-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch("http://localhost:8000/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: parseInt(document.getElementById("plan-select").value),
            user_id: parseInt(document.getElementById("user-select").value),
            title: document.getElementById("task-title").value,
            description: document.getElementById("task-description").value,
            priority: document.getElementById("task-priority").value,
            deadline:
              document.getElementById("task-deadline").value + "T00:00:00Z",
          }),
        });
        if (!response.ok) throw new Error("Ошибка создания задачи");
        const newTask = await response.json();
        tasks.push(newTask);
        renderTasks();
        taskForm.classList.add("hidden");
        document.getElementById("new-task-form").reset();
      } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось создать задачу: " + error.message);
      }
    });

  // Обработчик обновления статуса задачи
  window.updateTaskStatus = async function (taskId, newStatus) {
    try {
      const response = await fetch(
        `http://localhost:8000/tasks/${taskId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Ошибка обновления статуса");
      const updatedTask = await response.json();
      tasks = tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      );
      renderTasks();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось обновить статус: " + error.message);
    }
  };

  // Фильтрация задач
  [statusFilter, priorityFilter].forEach((filter) => {
    filter.addEventListener("change", renderTasks);
  });

  // Инициализация
  getCurrentUser();
  fetchPlans();
  fetchTasks();
});
