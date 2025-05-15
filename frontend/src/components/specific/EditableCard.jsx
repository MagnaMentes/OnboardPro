import React from "react";
import { Card } from "../../config/theme";

/**
 * Компонент EditableCard - обертка для карточек с возможностью редактирования при клике
 *
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы
 * @param {Function} props.onClick - Функция, вызываемая при клике на карточку
 * @param {string} props.className - Дополнительные CSS классы
 * @param {Object} props.cardProps - Дополнительные свойства для компонента Card
 */
const EditableCard = ({
  children,
  onClick,
  className = "",
  cardProps = {},
}) => {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${className}`}
      onClick={onClick}
      {...cardProps}
    >
      {children}
    </Card>
  );
};

export default EditableCard;
