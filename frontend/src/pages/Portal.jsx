import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "react-query";
import CandidateStatus from "../components/specific/CandidateStatus";
import { portalApi } from "../config/api";

/**
 * Компонент для отображения портала кандидата
 * Позволяет кандидату отслеживать прогресс своего онбординга
 */
const Portal = () => {
  const { id } = useParams(); // Получаем ID кандидата из параметров URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Получаем токен из query-параметра

  const [isAuthorized, setIsAuthorized] = useState(false);

  // При загрузке компонента проверяем наличие токена
  useEffect(() => {
    // Если в URL передан токен, сохраняем его
    if (token) {
      localStorage.setItem("token", token);
      setIsAuthorized(true);
    } else {
      // Если токена нет в URL, проверяем наличие в localStorage
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setIsAuthorized(true);
      }
    }
  }, [token]);

  // Запрос информации о кандидате
  const {
    data: candidateData,
    isLoading: isLoadingCandidate,
    error: candidateError,
  } = useQuery(["candidateData", id], () => portalApi.getCandidateInfo(id), {
    enabled: !!id && isAuthorized, // Выполнять запрос только если есть ID и разрешение
    retry: 1, // При ошибке пробуем повторить запрос только 1 раз
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
  });

  // Запрос общей информации о компании
  const {
    data: companyData,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useQuery(["companyInfo"], () => portalApi.getCompanyInfo(), {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Если нет id или токена, показываем заглушку
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">OnboardPro</span>
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium">
              Портал кандидата
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Портал кандидата
              </h2>
              <p className="mt-2 text-gray-600">
                Для доступа к порталу необходимо указать идентификатор кандидата
                в URL.
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Ссылка для доступа к порталу должна быть предоставлена
                HR-специалистом. Если у вас возникли проблемы с доступом,
                пожалуйста, свяжитесь с HR-отделом компании.
              </p>
            </div>
            {companyData && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Контакты компании
                </h3>
                <div className="mt-4 text-sm text-gray-600 space-y-2">
                  <p>
                    <span className="font-medium">Название: </span>
                    {companyData.name}
                  </p>
                  {companyData.email && (
                    <p>
                      <span className="font-medium">Email: </span>
                      <a
                        href={`mailto:${companyData.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {companyData.email}
                      </a>
                    </p>
                  )}
                  {companyData.phone && (
                    <p>
                      <span className="font-medium">Телефон: </span>
                      <a
                        href={`tel:${companyData.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {companyData.phone}
                      </a>
                    </p>
                  )}
                  {companyData.address && (
                    <p>
                      <span className="font-medium">Адрес: </span>
                      {companyData.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Индикатор загрузки
  if (isLoadingCandidate || isLoadingCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Обработка ошибок
  if (candidateError || companyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
            Ошибка при загрузке данных
          </h2>
          <p className="mt-2 text-center text-gray-600">
            {candidateError?.message ||
              companyError?.message ||
              "Не удалось загрузить данные портала. Пожалуйста, проверьте ваш токен или обратитесь в HR-отдел."}
          </p>
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка портала */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              {companyData?.name || "OnboardPro"}
            </span>
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium">
              Портал кандидата
            </span>
          </div>
          {candidateData && (
            <div className="text-right">
              <h2 className="text-lg font-semibold text-gray-900">
                {candidateData.name || "Кандидат"}
              </h2>
              <p className="text-sm text-gray-500">{candidateData.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {candidateData && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Прогресс онбординга
                </h2>
                <CandidateStatus candidateData={candidateData} />
              </div>
            </div>
          )}

          {/* Контактная информация компании */}
          {companyData && (
            <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Информация о компании
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {companyData.name}
                    </h3>
                    {companyData.description && (
                      <p className="mt-1 text-gray-600">
                        {companyData.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {companyData.email && (
                      <p className="flex items-center text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={`mailto:${companyData.email}`}
                          className="hover:text-blue-600"
                        >
                          {companyData.email}
                        </a>
                      </p>
                    )}
                    {companyData.phone && (
                      <p className="flex items-center text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <a
                          href={`tel:${companyData.phone}`}
                          className="hover:text-blue-600"
                        >
                          {companyData.phone}
                        </a>
                      </p>
                    )}
                    {companyData.address && (
                      <p className="flex items-center text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {companyData.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portal;
