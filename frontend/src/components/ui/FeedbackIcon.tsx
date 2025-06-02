import React from "react";
import { IconType } from "react-icons";
import { Box } from "@chakra-ui/react";

interface FeedbackIconProps {
  icon: IconType;
  color: string;
  size?: string | number;
  label?: string;
  marginRight?: string | number;
}

/**
 * Компонент для отображения цветных иконок в карточках отзывов
 * Прямое использование цветов CSS без преобразований Chakra
 */
const FeedbackIcon: React.FC<FeedbackIconProps> = ({
  icon: Icon,
  color,
  size = "20px",
  label,
  marginRight,
}) => {
  // Преобразуем цвета Chakra UI в настоящие CSS цвета
  let cssColor = color;
  if (color === "green.500") cssColor = "#38A169";
  if (color === "green.300") cssColor = "#68D391";
  if (color === "gray.400") cssColor = "#A0AEC0";
  if (color === "gray.500") cssColor = "#718096";
  if (color === "red.300") cssColor = "#FC8181";
  if (color === "red.500") cssColor = "#E53E3E";

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      title={label}
      marginRight={marginRight}
    >
      <Icon color={cssColor} size={size} />
    </Box>
  );
};

export default FeedbackIcon;
