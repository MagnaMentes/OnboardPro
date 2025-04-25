import { useState, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/outline";

export default function Profiles() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Получаем информацию о текущем пользователе для определения роли
        const currentUserResponse = await fetch(
          "http://localhost:8000/users/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!currentUserResponse.ok) {
          throw new Error("Ошибка при получении данных пользователя");
        }
        const currentUser = await currentUserResponse.json();
        setUserRole(currentUser.role);

        // Проверяем, имеет ли пользователь доступ к этой странице
        if (currentUser.role !== "hr" && currentUser.role !== "manager") {
          throw new Error("Недостаточно прав для просмотра этой страницы");
        }

        // Получаем список всех пользователей
        const usersResponse = await fetch("http://localhost:8000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!usersResponse.ok) {
          throw new Error("Ошибка при загрузке списка пользователей");
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "hr":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Ошибка!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-600">
        Профили пользователей
      </h2>

      {users.length === 0 ? (
        <div className="bg-white p-4 rounded shadow-md">
          <p className="text-gray-500">Нет доступных пользователей</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-50 p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {user.email}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID:</span> {user.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Отдел:</span>{" "}
                    {user.department || "Не указан"}
                  </p>
                </div>

                {userRole === "hr" && (
                  <div className="mt-4 space-x-2 flex justify-end">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      Изменить
                    </button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500">
                      Сбросить пароль
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
