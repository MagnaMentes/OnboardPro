import React from "react";
import { useQuery } from "@tanstack/react-query";
import { portalApi } from "../../config/api";

/**
 * Компонент для отображения статуса и прогресса кандидата в процессе онбординга.
 *
 * @param {Object} props - Свойства компонента
 * @param {number} props.candidateId - ID кандидата для которого отображается статус
 */
const CandidateStatus = ({ candidateId }) => {
  // Получение данных о кандидате с использованием React Query
  const {
    data: candidateData,
    isLoading,
    isError,
    error,
  } = useQuery(
    ["candidate", candidateId],
    () => portalApi.getCandidateInfo(candidateId),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      refetchOnWindowFocus: true,
      retry: 2,
    }
  );

  // Если данные загружаются, показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Не удалось загрузить данные о прогрессе кандидата
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message || "Пожалуйста, попробуйте позже."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Рассчитываем процент выполнения для использования в прогресс-баре
  const progressPercentage =
    Math.round(
      (candidateData?.completed_tasks / candidateData?.total_tasks) * 100
    ) || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Прогресс онбординга
          </h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {candidateData?.status || "Статус не определен"}
          </span>
        </div>

        {candidateData?.plan_title && (
          <p className="text-sm text-gray-600 mb-4">
            План:{" "}
            <span className="font-medium">{candidateData.plan_title}</span>
          </p>
        )}

        {/* Прогресс-бар */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              Выполнено задач: {candidateData?.completed_tasks || 0} из{" "}
              {candidateData?.total_tasks || 0}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Список задач */}
        {candidateData?.tasks && candidateData.tasks.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Задачи онбординга
            </h3>
            <ul className="space-y-2">
              {candidateData.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-100"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 ${
                      task.status === "completed"
                        ? "bg-green-500"
                        : task.status === "in_progress"
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <span className="ml-3 text-gray-700 flex-grow">
                    {task.title}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : task.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status === "completed"
                      ? "Выполнено"
                      : task.status === "in_progress"
                      ? "В процессе"
                      : "Предстоит"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            Нет активных задач в плане онбординга
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateStatus;
