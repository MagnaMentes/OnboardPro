import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Select,
  Badge,
  Spinner,
  Text,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";
import { Assignment } from "../../types/assignment";
import adminApi from "../../api/adminApi";

const AssignmentsOverview: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const params: any = {};

        if (statusFilter) params.status = statusFilter;

        const data = await adminApi.getAssignments(params);
        setAssignments(data);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке данных о назначениях");
        console.error("Error fetching assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [statusFilter]);

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge>Не указан</Badge>;
    }

    switch (status) {
      case "COMPLETED":
        return <Badge colorScheme="green">Завершено</Badge>;
      case "IN_PROGRESS":
        return <Badge colorScheme="blue">В процессе</Badge>;
      case "NOT_STARTED":
        return <Badge colorScheme="yellow">Не начато</Badge>;
      case "OVERDUE":
        return <Badge colorScheme="red">Просрочено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Box
      bg={bgColor}
      p={5}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="md" mb={4}>
        Назначения онбординга
      </Heading>
      <Box mb={4}>
        <Select
          placeholder="Все статусы"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="COMPLETED">Завершено</option>
          <option value="IN_PROGRESS">В процессе</option>
          <option value="NOT_STARTED">Не начато</option>
          <option value="OVERDUE">Просрочено</option>
        </Select>
      </Box>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner />
          <Text mt={3}>Загрузка данных...</Text>
        </Box>
      ) : error ? (
        <Box textAlign="center" py={10}>
          <Text color="red.500">{error}</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Сотрудник</Th>
                <Th>Программа</Th>
                <Th>Прогресс</Th>
                <Th>Статус</Th>
                <Th>Дата начала</Th>
                <Th>Дата окончания</Th>
              </Tr>
            </Thead>
            <Tbody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <Tr key={assignment.id}>
                    <Td>{assignment.id}</Td>
                    <Td>{`${assignment.user.first_name} ${assignment.user.last_name}`}</Td>
                    <Td>{assignment.program.title}</Td>
                    <Td>
                      <Box>
                        <Progress
                          value={assignment.progress}
                          size="sm"
                          colorScheme="blue"
                          borderRadius="full"
                        />
                        <Text fontSize="xs" mt={1}>
                          {assignment.progress}%
                        </Text>
                      </Box>
                    </Td>
                    <Td>{getStatusBadge(assignment.status)}</Td>
                    <Td>
                      {new Date(assignment.start_date).toLocaleDateString()}
                    </Td>
                    <Td>
                      {assignment.end_date
                        ? new Date(assignment.end_date).toLocaleDateString()
                        : "—"}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    Нет данных для отображения
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default AssignmentsOverview;
