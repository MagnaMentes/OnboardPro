import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { User } from "../../../types/user";
import adminUserApi from "../../../api/adminUserApi";

const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await adminUserApi.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
        setError(
          "Не удалось загрузить список пользователей. Пожалуйста, попробуйте позже."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = (userId: number) => {
    navigate(`/admin/employees/${userId}`);
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Сотрудники
      </Heading>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Email</Th>
                <Th>Имя</Th>
                <Th>Роль</Th>
                <Th>Статус</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr
                  key={u.id}
                  onClick={() => handleUserClick(u.id)}
                  cursor="pointer"
                >
                  <Td>{u.email}</Td>
                  <Td>{u.full_name}</Td>
                  <Td>{u.role}</Td>
                  <Td>{u.is_active ? "Активен" : "Не активен"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UserTable;
