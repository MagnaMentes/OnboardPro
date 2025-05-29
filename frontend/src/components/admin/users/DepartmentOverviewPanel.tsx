import { FC, useState, useEffect } from "react";
import {
  Box,
  Heading,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Switch,
  Flex,
  Stack,
} from "@chakra-ui/react";
import { DepartmentWithAnalytics } from "../../../types/department";
import adminUserApi from "../../../api/adminUserApi";

const DepartmentOverviewPanel: FC = () => {
  const [departments, setDepartments] = useState<DepartmentWithAnalytics[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const data = await adminUserApi.getDepartmentOverview();
        setDepartments(data as DepartmentWithAnalytics[]);
        setError(null);
      } catch (err) {
        console.error("Ошибка при загрузке данных о департаментах:", err);
        setError("Не удалось загрузить данные о департаментах");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) return <Spinner size="lg" />;

  if (error) return <Text color="red.500">{error}</Text>;

  const filteredDepartments = showInactive
    ? departments
    : departments.filter((dept) => dept.is_active);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Обзор департаментов</Heading>
        <Switch
          isChecked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
      </Flex>

      {/* Можно добавить метрики сверху по аналогии */}

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Департамент</Th>
              <Th>Руководитель</Th>
              <Th isNumeric>Сотрудники</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredDepartments.map((dept) => (
              <Tr key={dept.id}>
                <Td>{dept.name}</Td>
                <Td>{dept.manager_name}</Td>
                <Td isNumeric>{dept.employee_count}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DepartmentOverviewPanel;
