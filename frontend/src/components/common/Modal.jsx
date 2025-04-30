import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CSSTransition } from "react-transition-group";

export default function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md", // sm, md, lg, xl, full
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  primaryAction = null, // { label: 'Save', onClick: () => {} }
  secondaryAction = null, // { label: 'Cancel', onClick: () => {} }
  animationDuration = 200,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Обработка нажатия Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Блокировка прокрутки страницы
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; // Разблокировка прокрутки страницы
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Обработка клика вне модального окна
  const handleOutsideClick = (e) => {
    if (
      closeOnOutsideClick &&
      modalRef.current &&
      !modalRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

  // Определение ширины модального окна в зависимости от размера
  const getModalWidth = () => {
    if (isMobile) return "w-full";

    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "full":
        return "max-w-full";
      default:
        return "max-w-md";
    }
  };

  // Обработчики для свайпа вниз (закрытие модального окна)
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
    transition: isDragging
      ? "none"
      : `transform ${animationDuration}ms ease-out`,
  };

  return (
    <CSSTransition
      in={isOpen}
      timeout={animationDuration}
      classNames={{
        enter: "opacity-0",
        enterActive: "opacity-100 transition-opacity",
        exit: "opacity-100",
        exitActive: "opacity-0 transition-opacity",
      }}
      unmountOnExit
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={handleOutsideClick}
        aria-modal="true"
        role="dialog"
      >
        <div
          ref={modalRef}
          style={isMobile ? swipeStyle : {}}
          className={`
            ${getModalWidth()} mx-auto bg-white rounded-lg shadow-xl overflow-hidden
            ${isMobile ? "mt-auto rounded-b-none" : ""}
            transition-all duration-200
          `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Индикатор свайпа (только для мобильных) */}
          {isMobile && (
            <div className="w-full flex justify-center py-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
          )}

          {/* Заголовок */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            {showCloseButton && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                onClick={onClose}
                aria-label="Закрыть"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Содержимое */}
          <div
            className={`p-4 ${isMobile ? "overflow-y-auto max-h-[70vh]" : ""}`}
          >
            {children}
          </div>

          {/* Панель действий */}
          {(primaryAction || secondaryAction) && (
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-end space-x-2">
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
            </div>
          )}
        </div>
      </div>
    </CSSTransition>
  );
}
