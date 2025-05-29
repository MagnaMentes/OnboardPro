import React from "react";
import {
  Alert as ChakraAlert,
  AlertProps as ChakraAlertProps,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Box,
} from "@chakra-ui/react";

export interface AlertProps extends ChakraAlertProps {
  title?: string;
  description?: string;
  onClose?: () => void;
}

/**
 * Компонент оповещения OnboardPro согласно дизайн-системе.
 *
 * @example
 * <Alert status="success" title="Выполнено!" description="Задача успешно завершена." onClose={handleClose} />
 * <Alert status="error" title="Ошибка" description="Не удалось сохранить изменения." />
 * <Alert status="warning" title="Внимание" description="Срок выполнения задачи истекает завтра." />
 * <Alert status="info" title="Информация" description="Запланирована встреча на следующей неделе." />
 */
export const Alert: React.FC<AlertProps> = (props) => {
  const { title, description, onClose, children, ...rest } = props;

  return (
    <ChakraAlert
      borderRadius="md"
      display="flex"
      alignItems="flex-start"
      boxShadow="sm"
      variant="subtle"
      {...rest}
    >
      <AlertIcon boxSize="20px" mt="2px" />

      <Box flex="1">
        {title && <AlertTitle fontWeight="semibold">{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
        {children}
      </Box>

      {onClose && (
        <CloseButton
          position="relative"
          right={-1}
          top={-1}
          onClick={onClose}
        />
      )}
    </ChakraAlert>
  );
};
