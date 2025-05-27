import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Button,
  IconButton,
  Text,
  Box,
  useColorModeValue,
  useDisclosure,
  HStack,
} from "@chakra-ui/react";
import { FaLightbulb } from "react-icons/fa";
import { clientAssistantApi, ClientAIInsight } from "../../api/clientAssistant";

interface ClientHintPopoverProps {
  stepId: number;
  hint?: string | ClientAIInsight;
  onDismiss: () => void;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  position?: "top" | "right" | "bottom" | "left";
}

const ClientHintPopover: React.FC<ClientHintPopoverProps> = ({
  stepId,
  hint,
  onDismiss,
  isOpen: propIsOpen,
  onOpen: propOnOpen,
  onClose: propOnClose,
  position = "right", // По умолчанию справа
}) => {
  // Используем пропсы isOpen/onOpen/onClose, если они переданы,
  // иначе используем собственное состояние
  const {
    isOpen: internalIsOpen,
    onOpen: internalOnOpen,
    onClose: internalOnClose,
  } = useDisclosure({ defaultIsOpen: !!hint });

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const onOpen = propOnOpen || internalOnOpen;
  const onClose = propOnClose || internalOnClose;

  // Цвета для светлой/темной темы
  const bgColor = useColorModeValue("yellow.50", "yellow.900");
  const borderColor = useColorModeValue("yellow.300", "yellow.700");
  const headerBgColor = useColorModeValue("yellow.100", "yellow.800");

  // Обработчик скрытия подсказки
  const handleDismiss = async () => {
    try {
      await onDismiss();
      onClose();
    } catch (error) {
      console.error("Ошибка при скрытии подсказки:", error);
    }
  };

  if (!hint) return null;

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement={position}
      closeOnBlur={false}
    >
      <PopoverTrigger>
        <IconButton
          icon={<FaLightbulb />}
          aria-label="Подсказка"
          colorScheme="yellow"
          size="sm"
          borderRadius="full"
          isDisabled={!hint}
        />
      </PopoverTrigger>
      <PopoverContent
        bg={bgColor}
        borderColor={borderColor}
        boxShadow="lg"
        maxW="300px"
      >
        <PopoverArrow bg={headerBgColor} />
        <PopoverCloseButton />
        <PopoverHeader
          bg={headerBgColor}
          fontWeight="bold"
          borderTopRadius="md"
        >
          Совет от ассистента
        </PopoverHeader>
        <PopoverBody py={3}>
          <Text>{typeof hint === "string" ? hint : hint?.hint_text || ""}</Text>
        </PopoverBody>
        <PopoverFooter>
          <HStack justifyContent="flex-end">
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Скрыть подсказку
            </Button>
          </HStack>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};

export default ClientHintPopover;
