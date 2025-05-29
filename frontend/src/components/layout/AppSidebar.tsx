import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Divider,
  Flex,
  BoxProps,
  CloseButton,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  FiHome,
  FiAward,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";

export interface NavItemProps {
  icon: any;
  label: string;
  to: string;
  isActive?: boolean;
}

export interface AppSidebarProps extends BoxProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, isActive }) => {
  return (
    <Flex
      as={RouterLink}
      to={to}
      align="center"
      px={4} // Внутренний горизонтальный отступ
      py={3} // Внутренний вертикальный отступ
      my={0.5} // Внешний вертикальный отступ между элементами (уменьшен для плотности)
      borderRadius="md"
      role="group"
      cursor="pointer"
      fontWeight={isActive ? "semibold" : "medium"}
      color={isActive ? "brand.700" : "gray.700"}
      bg={isActive ? "brand.50" : "transparent"}
      borderLeft="3px solid"
      borderColor={isActive ? "brand.500" : "transparent"}
      _hover={{
        bg: "gray.100",
        color: "brand.700",
        borderColor: isActive ? "brand.500" : "gray.300",
      }}
      transition="all 0.2s ease-out" // Плавный переход
    >
      <Icon
        as={icon}
        mr={4} // Отступ справа от иконки
        fontSize="18px" // Размер иконки
        color={isActive ? "brand.600" : "gray.500"}
        _groupHover={{
          color: "brand.600",
        }}
      />
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
};

/**
 * Компонент боковой панели приложения OnboardPro.
 * Содержит навигационное меню с разделами в зависимости от роли пользователя.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  ...rest
}) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin" || user?.role === "hr";

  return (
    <Box
      bg="white"
      w="250px"
      h="calc(100vh - 64px)"
      borderRightWidth="1px"
      borderRightColor="gray.200"
      overflowY="auto"
      {...rest}
    >
      <Flex h="auto" py={3} alignItems="center" px={4} justify="space-between">
        {onClose && (
          <CloseButton
            display={{ base: "flex", lg: "none" }}
            onClick={onClose}
          />
        )}
      </Flex>

      <VStack spacing={0} align="stretch" px={2}>
        <NavItem
          icon={FiHome}
          label="Главная"
          to="/dashboard"
          isActive={location.pathname === "/dashboard"}
        />

        <NavItem
          icon={FiCalendar}
          label="Мои встречи"
          to="/booking/meetings"
          isActive={location.pathname === "/booking/meetings"}
        />

        <NavItem
          icon={FiAward}
          label="Награды"
          to="/rewards"
          isActive={location.pathname === "/rewards"}
        />

        <NavItem
          icon={FiSettings}
          label="Настройки"
          to="/settings"
          isActive={location.pathname === "/settings"}
        />

        {isAdmin && (
          <>
            <Divider my={4} />

            <Text
              px={4} // Согласованный горизонтальный отступ
              py={2}
              // mt={4} // Управляется my у Divider
              mb={1.5} // Отступ снизу перед первым элементом админ. секции
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              АДМИНИСТРИРОВАНИЕ
            </Text>

            <NavItem
              icon={FiBarChart2}
              label="Панель управления"
              to="/admin/dashboard"
              isActive={location.pathname === "/admin/dashboard"}
            />

            <NavItem
              icon={FiUsers}
              label="Сотрудники"
              to="/admin/employees"
              isActive={location.pathname === "/admin/employees"}
            />

            <NavItem
              icon={FiBarChart2}
              label="Аналитика"
              to="/admin/analytics"
              isActive={location.pathname === "/admin/analytics"}
            />

            <NavItem
              icon={FiCalendar}
              label="Управление встречами"
              to="/admin/booking/manage"
              isActive={location.pathname === "/admin/booking/manage"}
            />
          </>
        )}
      </VStack>
    </Box>
  );
};
