import { FC, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Button,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { AIInsight } from "../../api/aiInsights";

interface AIInsightTableProps {
  data: AIInsight[] | null;
  isLoading: boolean;
}

const AIInsightTable: FC<AIInsightTableProps> = ({ data, isLoading }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  // Определяем цвет бейджа в зависимости от уровня риска
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  // Обработчик просмотра деталей
  const handleViewDetails = (insight: AIInsight) => {
    setSelectedInsight(insight);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Нет доступных данных AI-аналитики</Text>
      </Box>
    );
  }

  return (
    <>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Сотрудник</Th>
              <Th>Программа</Th>
              <Th>Уровень риска</Th>
              <Th>Дата анализа</Th>
              <Th>Действия</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((insight) => (
              <Tr key={insight.id}>
                <Td>
                  <Text fontWeight="medium">
                    {insight.user_full_name || insight.user_email}
                  </Text>
                </Td>
                <Td>{insight.program_name}</Td>
                <Td>
                  <Badge colorScheme={getRiskBadgeColor(insight.risk_level)}>
                    {insight.risk_level_display}
                  </Badge>
                </Td>
                <Td>
                  {new Date(insight.created_at).toLocaleDateString()}
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleViewDetails(insight)}
                  >
                    Подробнее
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Модальное окно с подробной информацией */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Детали AI-инсайта</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedInsight && (
              <Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Сотрудник:</Text>
                  <Text>{selectedInsight.user_full_name || selectedInsight.user_email}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Программа онбординга:</Text>
                  <Text>{selectedInsight.program_name}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Уровень риска:</Text>
                  <Badge colorScheme={getRiskBadgeColor(selectedInsight.risk_level)}>
                    {selectedInsight.risk_level_display}
                  </Badge>
                </Box>
                <Box mb={4}>
                  <Text fontWeight="bold">Причины:</Text>
                  <Text whiteSpace="pre-line">{selectedInsight.reason}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Дата анализа:</Text>
                  <Text>
                    {new Date(selectedInsight.created_at).toLocaleDateString()}{" "}
                    {new Date(selectedInsight.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Box>
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Закрыть</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AIInsightTable;
