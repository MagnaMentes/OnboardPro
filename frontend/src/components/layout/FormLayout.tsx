import React, { ReactNode } from "react";
import {
  Box,
  VStack,
  Heading,
  Divider,
  Button,
  HStack,
  useColorModeValue,
  BoxProps,
} from "@chakra-ui/react";
import { Card, CardHeader, CardBody, CardFooter } from "../common/Card";

export interface FormLayoutProps extends BoxProps {
  title: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
  footer?: ReactNode;
}

/**
 * Компонент макета формы OnboardPro.
 * Стандартизирует отображение всех форм в приложении,
 * обеспечивая консистентный пользовательский опыт.
 *
 * @example
 * <FormLayout
 *   title="Личная информация"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   isLoading={isSubmitting}
 * >
 *   <Input label="Имя" value={name} onChange={handleNameChange} />
 *   <Input label="Email" value={email} onChange={handleEmailChange} />
 *   <Select label="Должность" options={positionOptions} value={position} onChange={handlePositionChange} />
 * </FormLayout>
 */
export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  children,
  submitLabel = "Сохранить",
  cancelLabel = "Отмена",
  isLoading = false,
  isDisabled = false,
  onSubmit,
  onCancel,
  footer,
  ...rest
}) => {
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Card
      variant="outline"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      {...rest}
    >
      <CardHeader
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        bg="gray.50"
      >
        <Heading size="md">{title}</Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {children}
        </VStack>
      </CardBody>

      <Divider borderColor={borderColor} />

      <CardFooter bg="gray.50">
        {footer || (
          <HStack spacing={3} justify="flex-end">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                isDisabled={isLoading || isDisabled}
              >
                {cancelLabel}
              </Button>
            )}
            {onSubmit && (
              <Button
                variant="primary"
                onClick={onSubmit}
                isLoading={isLoading}
                isDisabled={isDisabled}
                loadingText="Сохранение..."
              >
                {submitLabel}
              </Button>
            )}
          </HStack>
        )}
      </CardFooter>
    </Card>
  );
};
