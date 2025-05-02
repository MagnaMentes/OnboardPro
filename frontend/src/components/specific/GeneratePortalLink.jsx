import React, { useState } from "react";
import { portalApi } from "../../config/api";

/**
 * Компонент для генерации ссылки доступа к порталу кандидата
 * Позволяет HR и менеджерам создавать токены для доступа к порталу
 *
 * @param {Object} props - Свойства компонента
 * @param {number} props.candidateId - ID кандидата
 * @param {Function} props.onSuccess - Функция-обработчик успешной генерации ссылки
 */
const GeneratePortalLink = ({ candidateId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [portalLink, setPortalLink] = useState("");

  const generateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Запрос к API для генерации токена доступа
      const response = await portalApi.generatePortalToken(candidateId);

      // Формирование ссылки для доступа к порталу
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/portal/${candidateId}?token=${response.token}`;

      setPortalLink(link);
      setLinkGenerated(true);

      // Вызов обработчика успешной генерации, если он предоставлен
      if (onSuccess) {
        onSuccess(link);
      }
    } catch (err) {
      setError(err.message || "Не удалось сгенерировать ссылку для портала");
      console.error("Ошибка при генерации токена портала:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(portalLink)
      .then(() => {
        // Временно показываем сообщение об успешном копировании
        const button = document.getElementById("copy-button");
        if (button) {
          const originalText = button.innerText;
          button.innerText = "Скопировано!";
          button.disabled = true;

          setTimeout(() => {
            button.innerText = originalText;
            button.disabled = false;
          }, 2000);
        }
      })
      .catch((err) => {
        console.error("Не удалось скопировать ссылку:", err);
        setError("Не удалось скопировать ссылку в буфер обмена");
      });
  };

  return (
    <div className="mb-4">
      {!linkGenerated ? (
        <button
          onClick={generateLink}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Генерация...
            </>
          ) : (
            "Сгенерировать ссылку для кандидата"
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={portalLink}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              id="copy-button"
              onClick={copyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Копировать
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Эта ссылка действительна в течение 24 часов. Отправьте её кандидату
            для доступа к порталу.
          </p>
          <button
            onClick={() => {
              setLinkGenerated(false);
              setPortalLink("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            Сгенерировать новую ссылку
          </button>
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default GeneratePortalLink;
