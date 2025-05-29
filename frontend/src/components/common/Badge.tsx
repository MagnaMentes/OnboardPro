import {
  Badge as ChakraBadge,
  BadgeProps as ChakraBadgeProps,
} from "@chakra-ui/react";
import React from "react";

export interface BadgeProps extends ChakraBadgeProps {
  status?: "success" | "warning" | "error" | "info" | "default";
}

/**
 * Компонент бейджа OnboardPro согласно дизайн-системе.
 * Поддерживает семантические статусы для визуальной коммуникации.
 *
 * @example
 * <Badge>По умолчанию</Badge>
 * <Badge status="success">Выполнено</Badge>
 * <Badge status="warning">Требует внимания</Badge>
 * <Badge status="error">Просрочено</Badge>
 * <Badge status="info">В процессе</Badge>
 */
export const Badge: React.FC<BadgeProps> = (props) => {
  const { status, colorScheme, ...rest } = props;

  // Маппинг статусов на colorScheme
  const statusColorScheme = status
    ? {
        success: "success",
        warning: "warning",
        error: "error",
        info: "info",
        default: "gray",
      }[status]
    : colorScheme;

  // Дополнительные стили для бейджа статуса
  const isStatusBadge = !!status;

  return (
    <ChakraBadge
      variant={isStatusBadge ? "subtle" : undefined}
      colorScheme={statusColorScheme || "gray"}
      textTransform="none"
      fontWeight="medium"
      px={isStatusBadge ? 2 : undefined}
      py={isStatusBadge ? 1 : undefined}
      borderRadius="full"
      {...rest}
    />
  );
};
