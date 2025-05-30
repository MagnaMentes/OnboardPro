import React, { ReactNode } from "react";
import { Box, Flex, useBreakpointValue, useDisclosure } from "@chakra-ui/react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import AppFooter from "./AppFooter"; // Импортируем футер
import designTokens from "../../theme/designTokens";

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
        width="100%"
        pt={designTokens.layout.header.height}
        pb={designTokens.layout.footer.height}
        bg="gray.50"
      >
        <AppSidebar
          isOpen={isOpen}
          onClose={onClose}
          display={{ base: "none", lg: "block" }}
          position="fixed"
          top={designTokens.layout.header.height}
          bottom={designTokens.layout.footer.height}
          zIndex={{ base: "modal", lg: "docked" }}
          width={designTokens.layout.sidebar.width}
          height={`calc(100vh - ${designTokens.layout.header.height} - ${designTokens.layout.footer.height})`}
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
          ml={{ base: 0, lg: designTokens.layout.sidebar.width }}
          bg="gray.50"
          overflowY="auto"
        >
          <Box
            p={{
              base: designTokens.spacing.md,
              md: designTokens.spacing.lg,
              lg: designTokens.spacing.lg,
            }}
            maxW={designTokens.grid.containerMaxWidth}
            mx="auto"
          >
            {children}
          </Box>
        </Box>
      </Flex>
      <AppFooter />
    </Flex>
  );
};
