import React from "react";
import {
  Box,
  CloseButton,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  useColorModeValue,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { QuestionIcon } from "@chakra-ui/icons";

export interface ClientHint {
  id: number;
  hint_text: string;
  step_name: string;
  program_name: string;
  generated_at: string;
  dismissed: boolean;
}

interface ClientHintPopoverProps {
  hint: ClientHint;
  onDismiss: (id: number) => void;
  position?: "top" | "right" | "bottom" | "left";
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Компонент для отображения ненавязчивых подсказок от AI-ассистента
 */
const ClientHintPopover: React.FC<ClientHintPopoverProps> = ({
  hint,
  onDismiss,
  position = "top",
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const bgColor = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("blue.200", "blue.700");
  const textColor = useColorModeValue("blue.800", "blue.100");
  const headerBg = useColorModeValue("blue.100", "blue.800");

  const handleOpen = () => {
    if (controlledOnOpen) {
      controlledOnOpen();
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    onDismiss(hint.id);
    handleClose();
  };

  const isControlled = controlledIsOpen !== undefined;
  const finalIsOpen = isControlled ? controlledIsOpen : isOpen;

  return (
    <Popover
      isOpen={finalIsOpen}
      onClose={handleClose}
      placement={position}
      closeOnBlur={false}
      autoFocus={false}
    >
      <PopoverTrigger>
        <Tooltip label="Подсказка ассистента" hasArrow>
          <IconButton
            icon={<QuestionIcon />}
            aria-label="Подсказка ассистента"
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={handleOpen}
            ml={2}
          />
        </Tooltip>
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          bg={bgColor}
          borderColor={borderColor}
          boxShadow="md"
          maxW="320px"
          className={`client-hint--${useColorModeValue("light", "dark")}`}
        >
          <PopoverArrow bg={bgColor} />
          <PopoverHeader
            bg={headerBg}
            borderBottomWidth="1px"
            fontWeight="medium"
            p={3}
          >
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="sm">Совет ассистента</Text>
              <CloseButton size="sm" onClick={handleClose} />
            </Flex>
          </PopoverHeader>
          <PopoverBody p={4}>
            <Text color={textColor} fontSize="md" mb={3}>
              {hint.hint_text}
            </Text>
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="xs" color="gray.500">
                {new Date(hint.generated_at).toLocaleString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Box>
                <IconButton
                  aria-label="Скрыть подсказку"
                  icon={<CloseButton />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={handleDismiss}
                />
              </Box>
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default ClientHintPopover;
