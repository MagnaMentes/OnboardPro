document.addEventListener("DOMContentLoaded", async () => {
  const user = await initNavigation();
  if (!user) return;

  let tasks = [];
  const statusFilter = document.getElementById("status-filter");
  const priorityFilter = document.getElementById("priority-filter");

  async function fetchTasks() {
    try {
      const response = await fetch("http://localhost:8000/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Ошибка загрузки задач");
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error("Ошибка:", error);
      const container = document.getElementById("tasks-container");
      container.innerHTML =
        '<p class="text-red-500 text-center col-span-3">Не удалось загрузить задачи</p>';
    }
  }

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

    if (filteredTasks.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500 text-center col-span-3">Нет задач для отображения</p>';
      return;
    }

    container.innerHTML = filteredTasks
      .map(
        (task) => `
            <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-800">${
                      task.title
                    }</h3>
                    <span class="px-2 py-1 text-sm rounded ${getPriorityClass(
                      task.priority
                    )}">
                        ${getPriorityText(task.priority)}
                    </span>
                </div>
                <p class="text-gray-600 mb-4">${
                  task.description || "Нет описания"
                }</p>
                <div class="space-y-2">
                    <p class="text-sm text-gray-500">
                        Срок: ${new Date(task.deadline).toLocaleDateString(
                          "ru-RU"
                        )}
                    </p>
                    <div class="flex items-center justify-between">
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
            </div>
        `
      )
      .join("");
  }

  function getPriorityClass(priority) {
    const classes = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return classes[priority] || "";
  }

  function getPriorityText(priority) {
    const texts = {
      high: "Высокий",
      medium: "Средний",
      low: "Низкий",
    };
    return texts[priority] || priority;
  }

  function getStatusClass(status) {
    const classes = {
      pending: "bg-gray-50 text-gray-800",
      in_progress: "bg-blue-50 text-blue-800",
      completed: "bg-green-50 text-green-800",
    };
    return classes[status] || "";
  }

  window.updateTaskStatus = async function (taskId, newStatus) {
    try {
      const response = await fetch(
        `http://localhost:8001/tasks/${taskId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  [statusFilter, priorityFilter].forEach((filter) => {
    filter.addEventListener("change", renderTasks);
  });

  fetchTasks();
});
