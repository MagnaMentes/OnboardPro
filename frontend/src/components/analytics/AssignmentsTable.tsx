import { FC, useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Select,
  Button,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import { AssignmentAnalytics } from "../../api/analytics";
import { FiSearch, FiMessageSquare } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface AssignmentsTableProps {
  data: AssignmentAnalytics[] | null;
  isLoading: boolean;
}

const AssignmentsTable: FC<AssignmentsTableProps> = ({ data, isLoading }) => {
  const [filteredData, setFilteredData] = useState<AssignmentAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] =
    useState<keyof AssignmentAnalytics>("assigned_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  // Функция для сортировки данных
  const sortData = useCallback(
    (
      data: AssignmentAnalytics[],
      field: keyof AssignmentAnalytics,
      direction: "asc" | "desc"
    ) => {
      return [...data].sort((a, b) => {
        if (field === "progress_percentage" || field === "id") {
          return direction === "asc"
            ? (a[field] as number) - (b[field] as number)
            : (b[field] as number) - (a[field] as number);
        }

        const aValue = a[field]?.toString().toLowerCase() || "";
        const bValue = b[field]?.toString().toLowerCase() || "";

        if (direction === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    },
    []
  );

  // Функция для применения фильтрации и сортировки
  useEffect(() => {
    if (!data) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // Применяем фильтр по статусу
    if (statusFilter !== "all") {
      result = result.filter(
        (item) => item.status.toLowerCase() === statusFilter
      );
    }

    // Применяем поиск
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.full_name.toLowerCase().includes(lowerSearchTerm) ||
          item.position.toLowerCase().includes(lowerSearchTerm) ||
          item.program.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Применяем сортировку
    result = sortData(result, sortField, sortDirection);

    setFilteredData(result);
  }, [data, searchTerm, sortField, sortDirection, statusFilter, sortData]);

  // Функция для переключения сортировки
  const handleSort = (field: keyof AssignmentAnalytics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Функция для определения цвета бейджа статуса
  const getStatusColor = (status?: string) => {
    if (!status) return "gray";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("activ") || statusLower === "активен")
      return "blue";
    if (statusLower.includes("complet") || statusLower === "завершен")
      return "green";
    return "gray";
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // Если нет данных
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        Нет данных для отображения
      </Box>
    );
  }

  return (
    <Card shadow="md" borderRadius="lg">
      <CardHeader>
        <Heading size="md">Таблица назначений</Heading>
        <Stack direction={{ base: "column", md: "row" }} mt={4} spacing={4}>
          <InputGroup>
            <InputLeftElement>
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Поиск по имени, должности или программе"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxWidth={{ base: "full", md: "200px" }}
          >
            <option value="all">Все статусы</option>
            <option value="активен">Активные</option>
            <option value="завершен">Завершенные</option>
          </Select>
        </Stack>
      </CardHeader>
      <CardBody overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort("full_name")}>
                Имя{" "}
                {sortField === "full_name" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("position")}>
                Должность{" "}
                {sortField === "position" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("program")}>
                Программа{" "}
                {sortField === "program" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("status")}>
                Статус{" "}
                {sortField === "status" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
              <Th
                cursor="pointer"
                onClick={() => handleSort("progress_percentage")}
              >
                Прогресс{" "}
                {sortField === "progress_percentage" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("assigned_at")}>
                Дата начала{" "}
                {sortField === "assigned_at" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredData.map((item) => (
              <Tr key={item.id}>
                <Td>{item.full_name}</Td>
                <Td>{item.position}</Td>
                <Td>{item.program}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </Td>
                <Td>
                  <Box w="100%">
                    <Progress
                      value={item.progress_percentage}
                      colorScheme={
                        item.progress_percentage === 100 ? "green" : "blue"
                      }
                      size="sm"
                      borderRadius="full"
                    />
                    <Box textAlign="right" fontSize="xs" mt={1}>
                      {Math.round(item.progress_percentage)}%
                    </Box>
                  </Box>
                </Td>
                <Td>{formatDate(item.assigned_at)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default AssignmentsTable;
