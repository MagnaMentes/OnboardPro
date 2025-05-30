import {
  Box,
  Flex,
  Heading,
  Button,
  Divider,
  useColorModeValue,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useState } from "react";
import UserTable from "../../components/admin/users/UserTable";
import DepartmentOverviewPanel from "../../components/admin/users/DepartmentOverviewPanel";

const UsersListPage = () => {
  const [showDepartments, setShowDepartments] = useState(false);
  const bg = useColorModeValue("white", "gray.700");

  return (
    <>
      <PageHeader title="Управление сотрудниками" />
      <Box p={6} maxW="1200px" mx="auto" bg={bg} borderRadius="md">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">Управление сотрудниками</Heading>
          <Button
            size="sm"
            onClick={() => setShowDepartments(!showDepartments)}
          >
            {showDepartments ? "Список сотрудников" : "Обзор по департаментам"}
          </Button>
        </Flex>
        <Divider mb={4} />
        {showDepartments ? <DepartmentOverviewPanel /> : <UserTable />}
      </Box>
    </>
  );
};

export default UsersListPage;
