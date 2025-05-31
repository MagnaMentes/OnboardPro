import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Flex,
  Button,
  Text,
  InputGroup,
  Input,
  InputLeftElement,
  Spinner,
  Center,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { FiSearch, FiFilter, FiPlus, FiRefreshCw } from "react-icons/fi";
import FeedbackTrendRule from "./FeedbackTrendRule";
import { FeedbackTrendRule as FeedbackTrendRuleType } from "../../../types/dashboard";

interface FeedbackRuleListProps {
  rules: FeedbackTrendRuleType[];
  isLoading: boolean;
  onAddRule: () => void;
  onEditRule: (ruleId: number) => void;
  onDeleteRule: (ruleId: number) => Promise<void>;
  onToggleActive: (ruleId: number, isActive: boolean) => Promise<void>;
  onCheckAllRules: () => Promise<void>;
  isCheckingRules?: boolean;
}

const FeedbackRuleList: React.FC<FeedbackRuleListProps> = ({
  rules,
  isLoading,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleActive,
  onCheckAllRules,
  isCheckingRules = false,
}) => {
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Фильтруем правила
  const filteredRules = rules.filter((rule) => {
    // По статусу
    if (filter === "active" && !rule.is_active) return false;
    if (filter === "inactive" && rule.is_active) return false;

    // По типу правила
    if (
      filter !== "all" &&
      filter !== "active" &&
      filter !== "inactive" &&
      rule.rule_type !== filter
    )
      return false;

    // По поиску
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.templates?.some((t) =>
          t.name.toLowerCase().includes(searchLower)
        ) ||
        rule.departments?.some((d) =>
          d.name.toLowerCase().includes(searchLower)
        )
      );
    }

    return true;
  });

  // Сортировка: сначала активные, затем по дате создания
  const sortedRules = [...filteredRules].sort((a, b) => {
    // По статусу
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }

    // Затем по дате создания (новые выше)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleToggleActive = async (ruleId: number, isActive: boolean) => {
    try {
      await onToggleActive(ruleId, isActive);
    } catch (error) {
      console.error("Ошибка при изменении статуса правила:", error);
    }
  };

  const handleDelete = (ruleId: number) => {
    setRuleToDelete(ruleId);
    onOpen();
  };

  const confirmDelete = async () => {
    if (ruleToDelete !== null) {
      try {
        await onDeleteRule(ruleToDelete);
        onClose();
        setRuleToDelete(null);
      } catch (error) {
        console.error("Ошибка при удалении правила:", error);
      }
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Правила отслеживания трендов</Heading>

        <Flex gap={4}>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onAddRule}>
            Новое правило
          </Button>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={onCheckAllRules}
            isLoading={isCheckingRules}
          >
            Проверить правила
          </Button>
        </Flex>
      </Flex>

      <Flex justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Поиск правил..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </InputGroup>

        <Flex align="center">
          <FiFilter style={{ marginRight: "8px" }} />
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            minW="200px"
          >
            <option value="all">Все правила</option>
            <option value="active">Только активные</option>
            <option value="inactive">Только неактивные</option>
            <option value="sentiment_drop">Падение настроения</option>
            <option value="satisfaction_drop">Падение удовлетворенности</option>
            <option value="response_rate_drop">Снижение отзывов</option>
            <option value="issue_frequency_rise">Рост проблем</option>
            <option value="topic_shift">Смена тем</option>
          </Select>
        </Flex>
      </Flex>

      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      ) : sortedRules.length === 0 ? (
        <Box textAlign="center" py={10} color="gray.500">
          {searchText || filter !== "all"
            ? "Нет правил, соответствующих заданным критериям"
            : "Нет настроенных правил отслеживания трендов"}
        </Box>
      ) : (
        <VStack align="stretch" spacing={4}>
          {sortedRules.map((rule) => (
            <FeedbackTrendRule
              key={rule.id}
              rule={rule}
              onEdit={() => onEditRule(rule.id)}
              onDelete={() => handleDelete(rule.id)}
              onToggleActive={handleToggleActive}
            />
          ))}

          {filter === "all" && (
            <Text fontSize="sm" color="gray.500" textAlign="right">
              Показано {sortedRules.length} из {rules.length} правил
            </Text>
          )}
        </VStack>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Удаление правила
            </AlertDialogHeader>

            <AlertDialogBody>
              Вы уверены, что хотите удалить это правило? Это действие не может
              быть отменено.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Отмена
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default FeedbackRuleList;
