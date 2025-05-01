import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";

/**
 * Универсальный компонент модального окна с улучшенным дизайном и анимациями
 * Поддерживает различные варианты цветов, размеры и дополнительные функции (свайп на мобильных)
 *
 * @param {boolean} isOpen - Флаг, указывающий открыто ли модальное окно
 * @param {Function} onClose - Функция закрытия модального окна
 * @param {string} title - Заголовок модального окна
 * @param {React.ReactNode} children - Содержимое модального окна
 * @param {string} size - Размер модального окна (sm, md, lg, xl, full)
 * @param {string} variant - Вариант стиля (default, danger, success, warning, info)
 * @param {React.ReactNode} footer - Футер модального окна с кнопками
 * @param {boolean} closeOnClickOutside - Закрывать ли модальное окно при клике вне его области
 * @param {boolean} closeOnEsc - Закрывать ли модальное окно при нажатии клавиши Escape
 * @param {Object} primaryAction - Основное действие с кнопкой {label: string, onClick: Function}
 * @param {Object} secondaryAction - Второстепенное действие с кнопкой {label: string, onClick: Function}
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md",
  variant = "default",
  footer,
  closeOnClickOutside = true,
  closeOnEsc = true,
  primaryAction = null,
  secondaryAction = null,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef(null);

  // Отслеживание размера экрана
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Блокировка прокрутки при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Вычисляем классы для разных вариантов стилей
  const getHeaderStylesByVariant = (variant) => {
    switch (variant) {
      case "danger":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "success":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "warning":
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900";
      case "info":
        return "bg-gradient-to-r from-blue-400 to-blue-500 text-white";
      default:
        return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white";
    }
  };

  // Вычисляем размер модального окна
  const getModalSize = (size) => {
    if (isMobile) return "w-full max-w-full mx-4";

    switch (size) {
      case "sm":
        return "max-w-sm";
      case "lg":
        return "max-w-2xl";
      case "xl":
        return "max-w-4xl";
      case "full":
        return "max-w-full mx-4";
      case "md":
      default:
        return "max-w-lg";
    }
  };

  // Обработчики для свайпа вниз (закрытие модального окна на мобильных)
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || touchStartY === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;

    // Разрешаем только свайп вниз
    if (diff > 0) {
      setTranslateY(diff);
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;

    // Если свайп достаточно длинный, закрываем модальное окно
    if (translateY > 100) {
      onClose();
    }

    // Сброс состояния
    setTouchStartY(null);
    setTranslateY(0);
    setIsDragging(false);
  };

  // Стили для анимации свайпа
  const swipeStyle = {
    transform: `translateY(${translateY}px)`,
    transition: isDragging ? "none" : "transform 200ms ease-out",
  };

  // Рендер футера на основе переданных действий или пропов
  const renderFooter = () => {
    if (footer) {
      return footer;
    }

    if (primaryAction || secondaryAction) {
      return (
        <>
          {secondaryAction && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeOnClickOutside ? onClose : () => {}}
      className="relative z-50"
      initialFocus={modalRef}
    >
      {/* Фоновое затемнение с эффектом размытия */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Центрирование модального окна */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel
          ref={modalRef}
          className={`w-full ${getModalSize(
            size
          )} overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transform transition-all ${
            isMobile ? "mt-auto rounded-b-none" : ""
          }`}
          style={isMobile ? swipeStyle : {}}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Индикатор свайпа (только для мобильных) */}
          {isMobile && (
            <div className="w-full flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
          )}

          {/* Заголовок модального окна */}
          <div
            className={`flex justify-between items-center px-6 py-4 ${getHeaderStylesByVariant(
              variant
            )}`}
          >
            <Dialog.Title as="h3" className="text-lg font-semibold leading-6">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/20 focus:outline-none transition-colors"
              aria-label="Закрыть"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Содержимое модального окна */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>

          {/* Футер с кнопками действий */}
          {renderFooter() !== null && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
              {renderFooter()}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
