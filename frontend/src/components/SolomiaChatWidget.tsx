import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Avatar,
  Spinner,
  useColorModeValue,
  Heading,
  Icon,
} from "@chakra-ui/react";
import { ChatMessage, SolomiaChatApi } from "../api/solomiaChatApi";
import { FaPaperPlane, FaRobot } from "react-icons/fa";

interface SolomiaChatWidgetProps {
  stepId: number;
  isStepActive?: boolean;
  stepSupportsAI?: boolean;
}

/**
 * Компонент виджета AI-чата Solomia
 */
const SolomiaChatWidget: React.FC<SolomiaChatWidgetProps> = ({
  stepId,
  isStepActive = true,
  stepSupportsAI = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const humanMsgBg = useColorModeValue("blue.50", "blue.900");
  const assistantMsgBg = useColorModeValue("gray.50", "gray.700");

  // Получение истории чата при загрузке компонента
  useEffect(() => {
    if (stepId && isStepActive && stepSupportsAI) {
      fetchChatHistory();
    }
  }, [stepId]);

  // Прокрутка к последнему сообщению при появлении новых
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const history = await SolomiaChatApi.getChatHistory(stepId);
      setMessages(history);
    } catch (error) {
      console.error("Ошибка загрузки истории чата:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Временное отображение сообщения пользователя до получения ответа
    const userMessageTemp: ChatMessage = {
      id: Date.now(), // временный ID
      role: "human",
      message: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessageTemp]);
    setNewMessage("");
    setIsLoading(true);

    try {
      // Отправка сообщения в API
      const response = await SolomiaChatApi.sendMessage(stepId, newMessage);

      // Обновление сообщений с учетом ответа от сервера
      // Удаляем временное сообщение и добавляем актуальные
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== userMessageTemp.id);
        return [...withoutTemp, ...response];
      });
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Если шаг не активен или не поддерживает AI, не показываем чат
  if (!isStepActive || !stepSupportsAI) {
    return null;
  }

  return (
    <Box
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      boxShadow="md"
      overflow="hidden"
      width="100%"
    >
      <Box p={3} bg="purple.600" color="white">
        <Flex align="center">
          <Icon as={FaRobot} mr={2} />
          <Heading size="sm">Solomia AI Chat</Heading>
        </Flex>
      </Box>

      <Box p={4} height="400px" overflowY="auto" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <Flex
            height="100%"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            color="gray.500"
          >
            <Icon as={FaRobot} boxSize={12} mb={4} />
            <Text fontWeight="medium">Добро пожаловать в чат с Solomia!</Text>
            <Text fontSize="sm" textAlign="center" mt={2}>
              Задайте вопрос об этом шаге и я постараюсь вам помочь.
            </Text>
          </Flex>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg, index) => (
              <HStack
                key={index}
                alignSelf={msg.role === "human" ? "flex-end" : "flex-start"}
                bg={msg.role === "human" ? humanMsgBg : assistantMsgBg}
                p={3}
                borderRadius="lg"
                maxW="80%"
              >
                {msg.role === "assistant" && (
                  <Avatar
                    size="sm"
                    icon={<FaRobot />}
                    bg="purple.500"
                    color="white"
                    mr={2}
                  />
                )}
                <VStack
                  align={msg.role === "human" ? "flex-end" : "flex-start"}
                  spacing={1}
                >
                  <Text fontWeight="medium">
                    {msg.role === "human" ? "Вы" : "Solomia"}
                  </Text>
                  <Text>{msg.message}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      <Box p={3} borderTop="1px" borderColor={borderColor}>
        <HStack>
          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            colorScheme="purple"
            onClick={handleSendMessage}
            isLoading={isLoading}
            loadingText="Отправка"
            leftIcon={<FaPaperPlane />}
            disabled={!newMessage.trim() || isLoading}
          >
            Отправить
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default SolomiaChatWidget;
