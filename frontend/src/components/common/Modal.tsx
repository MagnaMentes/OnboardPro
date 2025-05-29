import React, { ReactNode } from "react";
import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { Button } from "./Button";
import designTokens, { spacing, zIndex } from "../../theme/designTokens";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "full";
  primaryAction?: {
    text: string;
    onClick: () => void;
    isLoading?: boolean;
    loadingText?: string;
    isDisabled?: boolean;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
    isDisabled?: boolean;
  };
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  isCentered?: boolean;
  scrollBehavior?: "inside" | "outside";
}

/**
 * Компонент модального окна OnboardPro согласно дизайн-системе.
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Подтверждение действия"
 *   primaryAction={{
 *     text: "Подтвердить",
 *     onClick: handleConfirm,
 *     isLoading: isSubmitting,
 *   }}
 *   secondaryAction={{
 *     text: "Отмена",
 *     onClick: onClose,
 *   }}
 * >
 *   <Text>Вы уверены, что хотите выполнить это действие?</Text>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    primaryAction,
    secondaryAction,
    footer,
    closeOnOverlayClick = true,
    isCentered = false,
    scrollBehavior = "outside",
  } = props;

  const headerBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.700");

  return (
    <ChakraModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      isCentered={isCentered}
      scrollBehavior={scrollBehavior}
      blockScrollOnMount={true}
      motionPreset="slideInBottom"
    >
      <ModalOverlay
        bg="blackAlpha.600"
        backdropFilter="blur(2px)"
        zIndex={zIndex.modalBackdrop}
      />
      <ModalContent
        borderRadius="md"
        overflow="hidden"
        boxShadow="lg"
        zIndex={zIndex.modal}
        mx={spacing.md}
      >
        <ModalHeader
          bg={headerBg}
          py={spacing.md}
          px={spacing.xl}
          borderBottomWidth="1px"
          borderBottomColor={useColorModeValue("gray.200", "gray.600")}
          fontSize="lg"
          fontWeight="medium"
        >
          {title}
        </ModalHeader>
        <ModalCloseButton mt={spacing.xs} mr={spacing.xs} />
        <ModalBody p={spacing.xl}>{children}</ModalBody>

        {(primaryAction || secondaryAction || footer) && (
          <ModalFooter
            bg={footerBg}
            borderTopWidth="1px"
            borderTopColor={useColorModeValue("gray.200", "gray.600")}
            px={spacing.xl}
            py={spacing.md}
            display="flex"
            justifyContent="flex-end"
          >
            {footer || (
              <>
                {secondaryAction && (
                  <Button
                    variant="secondary"
                    mr={spacing.md}
                    onClick={secondaryAction.onClick}
                    isDisabled={secondaryAction.isDisabled}
                    size="md"
                  >
                    {secondaryAction.text}
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    variant="primary"
                    onClick={primaryAction.onClick}
                    isLoading={primaryAction.isLoading}
                    loadingText={primaryAction.loadingText}
                    isDisabled={primaryAction.isDisabled}
                    size="md"
                  >
                    {primaryAction.text}
                  </Button>
                )}
              </>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </ChakraModal>
  );
};
