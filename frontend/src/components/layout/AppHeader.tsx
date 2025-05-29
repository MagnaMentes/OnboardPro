import React from "react";
import {
  Box,
  Flex,
  Image,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  useColorMode,
  useColorModeValue,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { HamburgerIcon, MoonIcon, SunIcon, BellIcon } from "@chakra-ui/icons";
import NotificationCounter from "../notifications/NotificationCounter";
import { useAuthStore } from "../../store/authStore";

export interface AppHeaderProps {
  onMenuToggle?: () => void;
}

/**
 * Компонент шапки приложения OnboardPro.
 * Содержит логотип, меню навигации и пользовательские действия.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuToggle }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  const handleLogout = () => {
    logout();
    // После выхода пользователь будет перенаправлен на страницу входа
    // благодаря ProtectedRoute
  };

  return (
    <Box
      as="header"
      bg={bgColor}
      boxShadow="sm"
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      position="sticky"
      top={0}
      zIndex="sticky"
      height="64px"
    >
      <Flex
        h="100%"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6 }}
        maxW="1400px"
        mx="auto"
      >
        <HStack spacing={4}>
          {onMenuToggle && (
            <IconButton
              aria-label="Меню"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onMenuToggle}
              display={{ base: "flex", lg: "none" }}
            />
          )}

          <Link as={RouterLink} to="/dashboard">
            <HStack spacing={2}>
              <Text
                fontWeight="bold"
                fontSize="xl"
                bgGradient="linear(to-r, brand.500, purple.500)"
                bgClip="text"
              >
                OnboardPro
                <Text
                  as="span"
                  fontWeight="normal"
                  fontSize="md"
                  ml={1}
                  color="gray.500"
                >
                  - AI-driven onboarding
                </Text>
              </Text>
            </HStack>
          </Link>
        </HStack>

        <HStack spacing={4}>
          <Box position="relative">
            <Tooltip label="Центр уведомлений">
              <IconButton
                aria-label="Уведомления"
                icon={<BellIcon />}
                variant="ghost"
                size="md"
                as={RouterLink}
                to="/notifications"
              />
            </Tooltip>
            <NotificationCounter />
          </Box>

          <IconButton
            aria-label={`Переключить на ${
              colorMode === "light" ? "темную" : "светлую"
            } тему`}
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />

          {user && (
            <Menu>
              <MenuButton>
                <HStack spacing={3} cursor="pointer">
                  <Avatar
                    size="sm"
                    name={user.full_name || user.username}
                    src={user.avatar}
                  />
                  <Text
                    display={{ base: "none", md: "block" }}
                    fontWeight="medium"
                  >
                    {user.full_name || user.username}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">
                  Мой профиль
                </MenuItem>
                <MenuItem as={RouterLink} to="/settings">
                  Настройки
                </MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </MenuList>
            </Menu>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};
