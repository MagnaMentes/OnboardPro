import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";
import React from "react";
import designTokens, { componentSizes } from "../../theme/designTokens";

export interface ButtonProps extends ChakraButtonProps {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "link";
  isFullWidth?: boolean; // Added isFullWidth prop
}

/**
 * Компонент кнопки OnboardPro, реализующий единый стиль согласно дизайн-системе.
 *
 * @example
 * <Button variant="primary">Нажми меня</Button>
 * <Button variant="secondary" size="sm">Маленькая кнопка</Button>
 * <Button variant="tertiary" leftIcon={<FiPlus />}>С иконкой</Button>
 */
export const Button: React.FC<ButtonProps> = (props) => {
  const {
    variant = "primary",
    colorScheme = "blue",
    isFullWidth,
    ...rest
  } = props; // Destructure isFullWidth

  // Маппинг пользовательских вариантов на встроенные варианты Chakra UI
  const variantMapping: Record<
    string,
    { variant: string; colorScheme?: string }
  > = {
    primary: { variant: "solid", colorScheme: "blue" },
    secondary: { variant: "outline", colorScheme: "blue" },
    tertiary: { variant: "ghost", colorScheme: "blue" },
    outline: { variant: "outline" },
    ghost: { variant: "ghost" },
    link: { variant: "link" },
  };

  const mappedVariant = variantMapping[variant]?.variant || "solid";
  const mappedColorScheme = variantMapping[variant]?.colorScheme || colorScheme;

  // Получаем размер кнопки из наших токенов дизайна
  const size = (props.size as keyof typeof componentSizes.button) || "md";

  // Стандартизированные стили в зависимости от размера
  const sizeStyles = componentSizes.button[size];

  return (
    <ChakraButton
      variant={mappedVariant}
      colorScheme={mappedColorScheme}
      height={sizeStyles?.height}
      fontSize={sizeStyles?.fontSize}
      px={props.px || sizeStyles?.padding}
      py={props.py}
      borderRadius="md"
      transition={designTokens.animation.transition.normal}
      _hover={{
        transform: "translateY(-1px)",
        boxShadow: variant === "primary" ? "md" : "none",
      }}
      width={isFullWidth ? "full" : undefined} // Используем width="full" вместо isFullWidth
      {...rest}
    />
  );
};
