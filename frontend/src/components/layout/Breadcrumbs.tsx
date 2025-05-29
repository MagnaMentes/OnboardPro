import React from "react";
import {
  Breadcrumb as ChakraBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbProps as ChakraBreadcrumbProps,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface BreadcrumbsProps extends ChakraBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Компонент хлебных крошек OnboardPro согласно дизайн-системе.
 *
 * @example
 * const breadcrumbItems = [
 *   { label: 'Главная', href: '/dashboard' },
 *   { label: 'Онбординг', href: '/onboarding' },
 *   { label: 'Шаг 1', isCurrentPage: true }
 * ];
 *
 * <Breadcrumbs items={breadcrumbItems} />
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, ...rest }) => {
  return (
    <ChakraBreadcrumb
      separator={<Icon as={ChevronRightIcon} color="gray.400" />}
      spacing={2}
      mb={4}
      {...rest}
    >
      {items.map((item, index) => (
        <BreadcrumbItem key={index} isCurrentPage={item.isCurrentPage}>
          <BreadcrumbLink
            as={item.href && !item.isCurrentPage ? RouterLink : undefined}
            to={item.href}
            color={item.isCurrentPage ? "gray.800" : "gray.500"}
            fontWeight={item.isCurrentPage ? "semibold" : "medium"}
            _hover={
              !item.isCurrentPage
                ? { textDecoration: "none", color: "brand.500" }
                : undefined
            }
          >
            {item.label}
          </BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </ChakraBreadcrumb>
  );
};
