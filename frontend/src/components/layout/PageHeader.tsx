import React, { ReactNode } from "react";
import { Box, Heading, Text, Flex, HStack, BoxProps } from "@chakra-ui/react";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";

export interface PageHeaderProps extends BoxProps {
  title: string;
  subtitle?: string;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: ReactNode;
}

/**
 * Компонент заголовка страницы OnboardPro.
 * Используется для стандартной верхней секции каждой страницы,
 * включая заголовок, подзаголовок, хлебные крошки и действия.
 *
 * @example
 * <PageHeader
 *   title="Управление сотрудниками"
 *   subtitle="Просмотр и редактирование информации о сотрудниках"
 *   breadcrumbItems={[
 *     { label: 'Главная', href: '/dashboard' },
 *     { label: 'Управление сотрудниками', isCurrentPage: true }
 *   ]}
 *   actions={
 *     <Button leftIcon={<FiPlus />}>Добавить сотрудника</Button>
 *   }
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbItems,
  actions,
  ...rest
}) => {
  return (
    <Box mb={8} {...rest}>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumbs items={breadcrumbItems} mb={4} />
      )}

      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
      >
        <Box>
          <Heading as="h1" size="xl" mb={subtitle ? 2 : 0}>
            {title}
          </Heading>

          {subtitle && (
            <Text color="gray.600" fontSize="lg">
              {subtitle}
            </Text>
          )}
        </Box>

        {actions && (
          <HStack spacing={3} mt={{ base: 4, md: 0 }}>
            {actions}
          </HStack>
        )}
      </Flex>
    </Box>
  );
};
