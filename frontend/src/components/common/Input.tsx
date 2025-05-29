import React from "react";
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  FormControl,
  FormControlProps,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Box,
} from "@chakra-ui/react";
import designTokens, {
  componentSizes,
  spacing,
} from "../../theme/designTokens";

export interface InputProps extends ChakraInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  isRequired?: boolean;
  formControlProps?: FormControlProps;
  variant?: "outline" | "filled" | "flushed" | "unstyled" | "primary";
}

/**
 * Компонент поля ввода OnboardPro согласно дизайн-системе.
 * Включает поддержку меток, вспомогательного текста, сообщений об ошибках
 * и элементов иконок слева/справа.
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="email@example.com"
 *   helperText="Введите ваш рабочий email"
 *   isRequired
 * />
 *
 * <Input
 *   label="Пароль"
 *   type="password"
 *   error="Пароль должен содержать не менее 8 символов"
 *   leftElement={<LockIcon />}
 * />
 */
export const Input: React.FC<InputProps> = (props) => {
  const {
    label,
    helperText,
    error,
    leftElement,
    rightElement,
    isRequired,
    formControlProps,
    id,
    variant = "outline",
    ...inputProps
  } = props;

  const inputId =
    id ||
    `input-${label?.toLowerCase().replace(/\s+/g, "-")}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

  // Получаем размер поля из наших токенов дизайна
  const size = (props.size as keyof typeof componentSizes.input) || "md";
  const sizeStyles = componentSizes.input[size];

  return (
    <FormControl
      isInvalid={!!error}
      isRequired={isRequired}
      mb={spacing.md}
      {...formControlProps}
    >
      {label && (
        <FormLabel
          htmlFor={inputId}
          mb={spacing.xs}
          fontSize={size === "sm" ? "sm" : "md"}
        >
          {label}
        </FormLabel>
      )}

      <InputGroup>
        {leftElement && (
          <InputLeftElement pointerEvents="none">
            {leftElement}
          </InputLeftElement>
        )}

        <ChakraInput
          id={inputId}
          variant={variant === "primary" ? "outline" : variant}
          borderColor={variant === "primary" ? "blue.500" : undefined}
          height={sizeStyles?.height}
          fontSize={sizeStyles?.fontSize}
          px={inputProps.px || sizeStyles?.padding}
          borderRadius="md"
          transition={designTokens.animation.transition.normal}
          _hover={{
            borderColor: variant === "primary" ? "blue.600" : undefined,
          }}
          _focus={{
            borderColor: variant === "primary" ? "blue.700" : undefined,
            boxShadow:
              variant === "primary"
                ? "0 0 0 1px var(--chakra-colors-blue-700)"
                : undefined,
          }}
          {...inputProps}
          pl={leftElement ? "2.5rem" : inputProps.px || sizeStyles?.padding}
          pr={rightElement ? "2.5rem" : inputProps.px || sizeStyles?.padding}
        />

        {rightElement && <InputRightElement>{rightElement}</InputRightElement>}
      </InputGroup>

      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};
