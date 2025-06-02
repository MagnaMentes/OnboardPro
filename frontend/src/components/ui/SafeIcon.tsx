import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { IconType } from "react-icons";

interface IconWrapperProps extends BoxProps {
  icon: IconType;
  size?: string | number;
  color?: string;
  label?: string;
}

/**
 * Безопасная обёртка для иконок из react-icons
 * Предотвращает ошибки с refs при использовании в Chakra UI
 */
export const SafeIcon: React.FC<IconWrapperProps> = ({
  icon,
  size = "1em",
  color = "currentColor",
  label,
  ...boxProps
}) => {
  const IconComponent = icon;

  // Преобразуем Chakra цвета в CSS-цвета
  // Если цвет содержит точку (например 'green.500'), извлекаем CSS-переменную
  const cssColor =
    color && color.includes(".")
      ? `var(--chakra-colors-${color.replace(".", "-")})`
      : color;

  return (
    <Box display="inline-flex" alignItems="center" title={label} {...boxProps}>
      <IconComponent size={size} style={{ color: cssColor }} />
    </Box>
  );
};

export default SafeIcon;
