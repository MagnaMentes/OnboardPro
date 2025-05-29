import React, { ReactNode } from "react";
import { Box, Flex, useBreakpointValue, useDisclosure } from "@chakra-ui/react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Основной макет приложения OnboardPro.
 * Содержит шапку, боковую панель и основной контент.
 * Адаптивен под мобильные устройства.
 *
 * @example
 * <AppLayout>
 *   <Box as="section" mb={6}>
 *     <Heading>Заголовок страницы</Heading>
 *   </Box>
 *   <Box>
 *     Содержимое страницы...
 *   </Box>
 * </AppLayout>
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex direction="column" minHeight="100vh">
      <AppHeader
        onMenuToggle={isMobile ? (isOpen ? onClose : onOpen) : undefined}
      />

      {/* Обертка для сайдбара и контента с ограничением ширины и центрированием */}
      <Flex
        flex={1}
        mx="auto" // Центрируем эту Flex-обертку
        width="100%" // Занимаем всю доступную ширину до maxWidth
        maxWidth={{ base: "100%", xl: "1400px" }} // Ограничиваем максимальную ширину на xl и больше
      >
        <AppSidebar
          isOpen={isOpen}
          onClose={onClose}
          display={{ base: "none", lg: "block" }}
          position={{ base: "fixed", lg: "sticky" }} // lg: "sticky" чтобы прилипал при прокрутке
          top={{ base: undefined, lg: "64px" }} // Отступ сверху, равный высоте хедера
          height={{ base: "100vh", lg: "calc(100vh - 64px)" }} // Высота с учетом хедера
          zIndex={{ base: "modal", lg: "docked" }} // zIndex, чтобы был под модальными окнами, но над контентом
        />

        {isOpen && isMobile && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex="overlay"
            onClick={onClose}
          />
        )}

        <Box
          flex={1}
          p={{ base: 4, md: 6, lg: 6 }}
          // ml убираем, так как сайдбар теперь часть этого же Flex-контейнера
          // или устанавливаем его в 0, если сайдбар не отображается
          ml={{ base: 0, lg: isOpen && !isMobile ? "250px" : 0 }} // Отступ слева, если сайдбар открыт и это не мобильная версия
          bg="gray.50"
          transition="margin-left 0.2s"
          minHeight="calc(100vh - 64px)"
          overflowY="auto"
          // maxWidth убираем отсюда, так как родительский Flex теперь управляет общей шириной
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};
