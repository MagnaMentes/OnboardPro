import React from "react";
import {
  Table as ChakraTable,
  TableProps as ChakraTableProps,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import { Button } from "./Button";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import designTokens, {
  spacing,
  margins,
  positioning,
  zIndex,
} from "../../theme/designTokens";

export interface Column {
  key: string;
  label: string;
  isSortable?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps extends Omit<ChakraTableProps, "children"> {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  emptyStateMessage?: string;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  pagination?: PaginationProps;
  actions?: (row: any) => React.ReactNode;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <Flex {...positioning.center} mt={margins.md}>
      <Button
        variant="tertiary"
        size="sm"
        leftIcon={<ChevronLeftIcon />}
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage <= 1}
        aria-label="Предыдущая страница"
      >
        Назад
      </Button>

      <Text mx={spacing.md} fontSize="sm" fontWeight="medium">
        Страница {currentPage} из {totalPages}
      </Text>

      <Button
        variant="tertiary"
        size="sm"
        rightIcon={<ChevronRightIcon />}
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage >= totalPages}
        aria-label="Следующая страница"
      >
        Вперед
      </Button>
    </Flex>
  );
};

/**
 * Компонент таблицы данных OnboardPro согласно дизайн-системе.
 * Поддерживает сортировку, поиск, пагинацию и кастомные действия.
 *
 * @example
 * const columns = [
 *   { key: 'name', label: 'Имя' },
 *   { key: 'email', label: 'Email' },
 *   { key: 'department', label: 'Отдел' }
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={employees}
 *   isLoading={loading}
 *   onSearch={handleSearch}
 *   pagination={{
 *     currentPage: page,
 *     totalPages: totalPages,
 *     onPageChange: handlePageChange
 *   }}
 *   actions={(row) => (
 *     <Button size="sm">Просмотр</Button>
 *   )}
 * />
 */
export const DataTable: React.FC<DataTableProps> = (props) => {
  const {
    columns,
    data,
    isLoading,
    emptyStateMessage = "Нет данных для отображения",
    searchPlaceholder = "Поиск...",
    onSearch,
    sortField,
    sortOrder,
    onSort,
    pagination,
    actions,
    ...tableProps
  } = props;

  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (onSearch) {
      onSearch(value);
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const filterBgColor = useColorModeValue("gray.50", "gray.700");

  return (
    <Box bg={bgColor} borderRadius="lg" boxShadow="md" overflow="hidden">
      {/* Поиск и фильтры */}
      {onSearch && (
        <Box
          px={spacing.xl}
          py={spacing.md}
          borderBottomWidth="1px"
          borderColor={borderColor}
          bg={filterBgColor}
        >
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              size="sm"
              variant="filled"
              _focus={{ bg: "white", borderColor: "blue.500" }}
            />
          </InputGroup>
        </Box>
      )}

      {/* Таблица */}
      <TableContainer>
        <ChakraTable variant="simple" colorScheme="gray" {...tableProps}>
          <Thead bg={filterBgColor}>
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  cursor={column.isSortable ? "pointer" : undefined}
                  onClick={
                    column.isSortable && onSort
                      ? () => onSort(column.key)
                      : undefined
                  }
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.600"
                  p={spacing.md}
                >
                  <Flex {...positioning.centerVertical}>
                    <Text>{column.label}</Text>
                    {sortField === column.key && (
                      <Text ml={spacing.xs}>
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Text>
                    )}
                  </Flex>
                </Th>
              ))}
              {actions && <Th width="100px">Действия</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={columns.length + (actions ? 1 : 0)}>
                  <Center py={spacing.xl}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                  </Center>
                </Td>
              </Tr>
            ) : data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (actions ? 1 : 0)}>
                  <Center py={spacing.xl}>
                    <Text color="gray.500" fontSize="md" fontWeight="medium">
                      {emptyStateMessage}
                    </Text>
                  </Center>
                </Td>
              </Tr>
            ) : (
              data.map((row, i) => (
                <Tr
                  key={i}
                  _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                >
                  {columns.map((column) => (
                    <Td key={`${i}-${column.key}`} p={spacing.md}>
                      {column.renderCell
                        ? column.renderCell(row[column.key], row)
                        : row[column.key]}
                    </Td>
                  ))}
                  {actions && <Td p={spacing.md}>{actions(row)}</Td>}
                </Tr>
              ))
            )}
          </Tbody>
        </ChakraTable>
      </TableContainer>

      {/* Пагинация */}
      {pagination && data.length > 0 && !isLoading && (
        <Box
          px={spacing.xl}
          py={spacing.md}
          borderTopWidth="1px"
          borderColor={borderColor}
          bg={filterBgColor}
        >
          <Pagination {...pagination} />
        </Box>
      )}
    </Box>
  );
};
