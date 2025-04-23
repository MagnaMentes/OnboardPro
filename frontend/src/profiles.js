document.addEventListener("DOMContentLoaded", async () => {
  const user = await initNavigation();
  if (!user) return;

  const departmentFilter = document.getElementById("department-filter");
  const roleFilter = document.getElementById("role-filter");
  let profiles = [];

  // Проверка прав доступа
  if (user.role === "employee") {
    window.location.href = "/src/dashboard.html";
    return;
  }

  // Загрузка профилей
  async function fetchProfiles() {
    try {
      const response = await fetch("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Доступ запрещен");
      profiles = await response.json();

      // Обновляем список отделов в фильтре
      const departments = [
        ...new Set(profiles.map((p) => p.department).filter((d) => d !== null)),
      ];
      departmentFilter.innerHTML = `
                <option value="all">Все отделы</option>
                ${departments
                  .map(
                    (d) => `
                    <option value="${d}">${d}</option>
                `
                  )
                  .join("")}
            `;

      renderProfiles();
    } catch (error) {
      console.error("Ошибка загрузки профилей:", error);
      document.getElementById("profile-list").innerHTML =
        '<p class="text-red-500 text-center">Ошибка загрузки профилей</p>';
    }
  }

  // Отрисовка профилей с учетом фильтров
  function renderProfiles() {
    const departmentValue = departmentFilter.value;
    const roleValue = roleFilter.value;

    const filteredProfiles = profiles.filter((p) => {
      const departmentMatch =
        departmentValue === "all" || p.department === departmentValue;
      const roleMatch = roleValue === "all" || p.role === roleValue;
      return departmentMatch && roleMatch;
    });

    const profileList = document.getElementById("profile-list");
    if (filteredProfiles.length === 0) {
      profileList.innerHTML =
        '<p class="text-gray-500 text-center col-span-3">Нет профилей для отображения</p>';
      return;
    }

    profileList.innerHTML = filteredProfiles
      .map(
        (p) => `
            <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-lg font-semibold text-primary">${
                          p.email
                        }</h3>
                        <p class="text-sm text-gray-500">
                            ${getRoleText(p.role)}${
          p.department ? ` • ${p.department}` : ""
        }
                        </p>
                    </div>
                </div>
                <div class="mt-4 flex justify-end">
                    <a href="/src/feedback.html?recipient=${p.id}" 
                       class="text-sm text-primary hover:text-blue-700">
                        Отправить отзыв
                    </a>
                </div>
            </div>
        `
      )
      .join("");
  }

  function getRoleText(role) {
    const roles = {
      employee: "Сотрудник",
      manager: "Менеджер",
      hr: "HR",
    };
    return roles[role] || role;
  }

  // Обработчики фильтров
  [departmentFilter, roleFilter].forEach((filter) => {
    filter.addEventListener("change", renderProfiles);
  });

  // Загружаем профили
  fetchProfiles();
});
