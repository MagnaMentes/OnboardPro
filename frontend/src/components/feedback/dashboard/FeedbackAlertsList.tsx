import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Flex,
  Select,
  Text,
  InputGroup,
  Input,
  InputLeftElement,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { FiSearch, FiFilter } from "react-icons/fi";
import FeedbackTrendAlert from "./FeedbackTrendAlert";

interface FeedbackAlertData {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  is_resolved: boolean;
  rule_type: string;
  percentage_change: number | null;
  template_name?: string;
  department_name?: string;
}

interface FeedbackAlertsListProps {
  alerts: FeedbackAlertData[];
  isLoading: boolean;
  onResolveAlert: (alertId: number, comment: string) => void;
}

const FeedbackAlertsList: React.FC<FeedbackAlertsListProps> = ({
  alerts,
  isLoading,
  onResolveAlert,
}) => {
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Фильтрация алертов
  const filteredAlerts = alerts.filter((alert) => {
    // По статусу
    if (filter === "active" && alert.is_resolved) return false;
    if (filter === "resolved" && !alert.is_resolved) return false;

    // По поиску
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        alert.title.toLowerCase().includes(searchLower) ||
        alert.description.toLowerCase().includes(searchLower) ||
        (alert.template_name &&
          alert.template_name.toLowerCase().includes(searchLower)) ||
        (alert.department_name &&
          alert.department_name.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Сортировка: сначала по приоритету (критические), затем по дате
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    // Приоритет сортировки по статусу: нерешенные выше решенных
    if (a.is_resolved !== b.is_resolved) {
      return a.is_resolved ? 1 : -1;
    }

    // Затем по приоритету
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (a.severity !== b.severity) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }

    // Затем по дате (новые выше)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleShowDetails = (alertId: number) => {
    // Можно добавить логику для отображения подробных данных по алерту
    console.log(`Show details for alert ${alertId}`);
  };

  const handleResolveAlert = (alertId: number) => {
    setSelectedAlertId(alertId);
    setResolutionComment("");
    onOpen();
  };

  const confirmResolveAlert = () => {
    if (selectedAlertId) {
      onResolveAlert(selectedAlertId, resolutionComment);
      onClose();
      setSelectedAlertId(null);
      setResolutionComment("");
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Алерты трендов обратной связи</Heading>

        <Flex gap={4}>
          <InputGroup w="250px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Поиск алертов..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </InputGroup>

          <Flex align="center">
            <FiFilter style={{ marginRight: "8px" }} />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              minW="140px"
            >
              <option value="all">Все алерты</option>
              <option value="active">Активные</option>
              <option value="resolved">Решенные</option>
            </Select>
          </Flex>
        </Flex>
      </Flex>

      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      ) : sortedAlerts.length === 0 ? (
        <Box textAlign="center" py={10} color="gray.500">
          {searchText || filter !== "all"
            ? "Нет алертов, соответствующих заданным критериям"
            : "Нет активных алертов по трендам обратной связи"}
        </Box>
      ) : (
        <VStack align="stretch" spacing={4}>
          {sortedAlerts.map((alert) => (
            <FeedbackTrendAlert
              key={alert.id}
              alert={alert}
              onResolve={!alert.is_resolved ? handleResolveAlert : undefined}
              onShowDetails={() => handleShowDetails(alert.id)}
            />
          ))}

          {filter === "all" && (
            <Text fontSize="sm" color="gray.500" textAlign="right">
              Показано {sortedAlerts.length} из {alerts.length} алертов
            </Text>
          )}
        </VStack>
      )}

      {/* Модальное окно для разрешения алерта */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Разрешение алерта</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Комментарий к разрешению</FormLabel>
              <Textarea
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Опишите, какие действия были предприняты для разрешения этого алерта..."
                rows={4}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmResolveAlert}
              isDisabled={!resolutionComment.trim()}
            >
              Подтвердить разрешение
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FeedbackAlertsList;
