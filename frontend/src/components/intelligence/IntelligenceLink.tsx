import React from "react";
import { Button, Flex, Link, Icon, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiBarChart2, FiExternalLink } from "react-icons/fi";

interface IntelligenceLinkProps {
  type: "user" | "department";
  id: number | string;
  name?: string;
  showIcon?: boolean;
  variant?: string;
  size?: string;
}

/**
 * Компонент для создания ссылки на страницу Intelligence Dashboard для пользователя или департамента
 */
const IntelligenceLink: React.FC<IntelligenceLinkProps> = ({
  type,
  id,
  name,
  showIcon = true,
  variant = "link",
  size = "md",
}) => {
  const url =
    type === "user"
      ? `/admin/intelligence/user/${id}`
      : `/admin/intelligence/department/${id}`;

  const label = name
    ? `AI анализ: ${name}`
    : `${type === "user" ? "Анализ сотрудника" : "Анализ отдела"}`;

  if (variant === "link") {
    return (
      <Link
        as={RouterLink}
        to={url}
        color="brand.500"
        fontWeight="medium"
        display="inline-flex"
        alignItems="center"
      >
        {showIcon && <Icon as={FiBarChart2} mr={1} />}
        {label}
        <Icon as={FiExternalLink} ml={1} fontSize="sm" />
      </Link>
    );
  }

  return (
    <Button
      as={RouterLink}
      to={url}
      leftIcon={showIcon ? <FiBarChart2 /> : undefined}
      rightIcon={<FiExternalLink />}
      variant={variant}
      size={size}
      colorScheme="brand"
    >
      {label}
    </Button>
  );
};

export default IntelligenceLink;
