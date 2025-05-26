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
  Input,
  HStack,
  Badge,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { User } from "../../types/user";
import adminApi from "../../api/adminApi";

const EmployeesTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params: any = {};

        if (roleFilter) params.role = roleFilter;
        if (statusFilter) params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;

        const data = await adminApi.getUsers(params);
        setUsers(data);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке данных о пользователях");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter, statusFilter, searchTerm]);

  const getRoleBadge = (role?: string) => {
    if (!role) {
      return <Badge>Не указана</Badge>;
    }

    switch (role) {
      case "ADMIN":
        return <Badge colorScheme="red">Администратор</Badge>;
      case "HR":
        return <Badge colorScheme="purple">HR</Badge>;
      case "MANAGER":
        return <Badge colorScheme="blue">Руководитель</Badge>;
      case "EMPLOYEE":
        return <Badge colorScheme="green">Сотрудник</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge>Не указан</Badge>;
    }

    switch (status) {
      case "ACTIVE":
        return <Badge colorScheme="green">Активен</Badge>;
      case "PENDING":
        return <Badge colorScheme="yellow">Ожидает</Badge>;
      case "INACTIVE":
        return <Badge colorScheme="red">Неактивен</Badge>;
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
        Сотрудники
      </Heading>
      <HStack spacing={4} mb={4}>
        <Select
          placeholder="Все роли"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="ADMIN">Администратор</option>
          <option value="HR">HR</option>
          <option value="MANAGER">Руководитель</option>
          <option value="EMPLOYEE">Сотрудник</option>
        </Select>
        <Select
          placeholder="Все статусы"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="ACTIVE">Активен</option>
          <option value="PENDING">Ожидает</option>
          <option value="INACTIVE">Неактивен</option>
        </Select>
        <Input
          placeholder="Поиск по имени или email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="sm"
          w="300px"
        />
      </HStack>

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
                <Th>Имя</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Статус</Th>
                <Th>Дата регистрации</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <Tr key={user.id}>
                    <Td>{user.id}</Td>
                    <Td>{`${user.first_name} ${user.last_name}`}</Td>
                    <Td>{user.email}</Td>
                    <Td>{getRoleBadge(user.role)}</Td>
                    <Td>{getStatusBadge(user.status)}</Td>
                    <Td>
                      {user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString()
                        : "-"}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign="center">
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

export default EmployeesTable;
