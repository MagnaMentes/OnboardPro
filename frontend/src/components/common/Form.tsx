import React, { ReactNode } from "react";
import {
  Box,
  Stack,
  VStack,
  Heading,
  Text,
  BoxProps,
  Divider,
  Button as ChakraButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { Button } from "./Button";
import designTokens, {
  spacing,
  positioning,
  margins,
} from "../../theme/designTokens";

export interface FormProps extends BoxProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
  submitButton?: {
    text: string;
    isLoading?: boolean;
    loadingText?: string;
    isFullWidth?: boolean; // Added isFullWidth to submitButton options
  };
  cancelButton?: {
    text: string;
    onClick: () => void;
  };
  footer?: ReactNode;
}

/**
 * Компонент формы OnboardPro согласно дизайн-системе.
 * Предоставляет структуру для форм с заголовком, подзаголовком и действиями.
 *
 * @example
 * <Form
 *   title="Создать задачу"
 *   subtitle="Заполните информацию о новой задаче"
 *   onSubmit={handleSubmit}
 *   submitButton={{ text: "Создать", isLoading: isSubmitting }}
 *   cancelButton={{ text: "Отмена", onClick: handleCancel }}
 * >
 *   <Input label="Название" isRequired />
 *   <Textarea label="Описание" />
 *   <Select label="Приоритет" options={priorityOptions} />
 * </Form>
 */
export const Form: React.FC<FormProps> = (props) => {
  const {
    title,
    subtitle,
    onSubmit,
    children,
    submitButton,
    cancelButton,
    footer,
    ...rest
  } = props;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      as="form"
      onSubmit={onSubmit}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="sm"
      maxWidth="100%"
      width={props.width || "100%"}
      mx={props.mx || "auto"}
      {...rest}
    >
      {/* Заголовок формы */}
      {(title || subtitle) && (
        <Box
          p={spacing.xl}
          borderBottomWidth={1}
          borderColor={borderColor}
          {...positioning.centerVertical}
          justifyContent="flex-start"
        >
          <VStack align="flex-start" spacing={spacing.xs}>
            {title && <Heading size="md">{title}</Heading>}
            {subtitle && <Text color="gray.600">{subtitle}</Text>}
          </VStack>
        </Box>
      )}

      {/* Содержимое формы */}
      <Box p={spacing.xl}>
        <VStack spacing={spacing.md} align="stretch">
          {children}
        </VStack>
      </Box>

      {/* Действия формы */}
      {(submitButton || cancelButton || footer) && (
        <>
          <Divider />
          <Box
            p={spacing.xl}
            {...positioning.flexEnd}
            borderTopWidth="1px"
            borderColor={borderColor}
          >
            <Stack direction="row" spacing={spacing.md} width="100%">
              {" "}
              {/* Добавлено width="100%" */}
              {cancelButton && (
                <Button variant="secondary" onClick={cancelButton.onClick}>
                  {cancelButton.text}
                </Button>
              )}
              {submitButton && (
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={submitButton.isLoading}
                  loadingText={submitButton.loadingText}
                  isFullWidth={submitButton.isFullWidth} // Pass isFullWidth to Button
                  px={spacing.lg} // Явно устанавливаем горизонтальный отступ
                >
                  {submitButton.text}
                </Button>
              )}
              {footer}
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
};
