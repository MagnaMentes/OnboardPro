import React, { useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Textarea,
  Select,
  Stack,
  HStack,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { HRAlert } from "../../../types/hr-dashboard";
import { useResolveAlert } from "../../../api/useHRDashboard";

interface HRAlertTableProps {
  alerts: HRAlert[];
  isLoading: boolean;
}

const HRAlertTable: React.FC<HRAlertTableProps> = ({ alerts, isLoading }) => {
  const [selectedAlert, setSelectedAlert] = useState<HRAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const resolveAlert = useResolveAlert();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleResolve = async () => {
    if (selectedAlert) {
      try {
        await resolveAlert.mutateAsync({
          id: selectedAlert.id,
          notes: resolutionNotes,
        });
        setSelectedAlert(null);
        setResolutionNotes("");
      } catch (error) {
        console.error("Error resolving alert:", error);
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "yellow";
      default:
        return "gray";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "red";
      case "in_progress":
        return "blue";
      case "resolved":
        return "green";
      case "dismissed":
        return "gray";
      default:
        return "gray";
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" data-testid="loading-spinner" />
      </Flex>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text>Нет активных алертов</Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        shadow="sm"
        w="100%"
        overflow="hidden"
      >
        <Stack p={4} spacing={4}>
          <HStack spacing={4}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              w="200px"
              data-testid="status-filter"
            >
              <option value="all">Все статусы</option>
              <option value="open">Открытые</option>
              <option value="in_progress">В работе</option>
              <option value="resolved">Решённые</option>
              <option value="dismissed">Отклонённые</option>
            </Select>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              w="200px"
            >
              <option value="all">Все уровни важности</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </Select>
          </HStack>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Важность</Th>
                  <Th>Заголовок</Th>
                  <Th>Статус</Th>
                  <Th>Департамент</Th>
                  <Th>Создан</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAlerts.map((alert) => (
                  <Tr key={alert.id} data-testid="alert-row">
                    <Td>
                      <Badge
                        colorScheme={getSeverityColor(alert.severity)}
                        data-testid="severity-badge"
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">{alert.title}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {alert.rule_name}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(alert.status)}>
                        {alert.status === "open"
                          ? "Открыт"
                          : alert.status === "in_progress"
                          ? "В работе"
                          : alert.status === "resolved"
                          ? "Решён"
                          : "Отклонён"}
                      </Badge>
                    </Td>
                    <Td>{alert.department_name || "-"}</Td>
                    <Td>
                      {format(new Date(alert.created_at), "dd MMM yyyy HH:mm", {
                        locale: ru,
                      })}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        isDisabled={
                          alert.status === "resolved" ||
                          alert.status === "dismissed"
                        }
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Решить
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Stack>
      </Box>

      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Решение алерта</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAlert && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold">Заголовок:</Text>
                  <Text>{selectedAlert.title}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Сообщение:</Text>
                  <Text>{selectedAlert.message}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Комментарий к решению:
                  </Text>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Опишите, как был решён алерт..."
                    rows={4}
                  />
                </Box>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setSelectedAlert(null)}
            >
              Отмена
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleResolve}
              isLoading={resolveAlert.isLoading}
            >
              Подтвердить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HRAlertTable;
