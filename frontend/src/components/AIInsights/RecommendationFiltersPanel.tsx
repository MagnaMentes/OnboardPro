import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Select,
  Input,
  Collapse,
  useDisclosure,
  SimpleGrid,
  FormControl,
  FormLabel,
  Switch,
  Text,
  HStack,
  Tag,
  TagCloseButton,
  TagLabel,
  VStack,
} from "@chakra-ui/react";
import { FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationFilters,
  InsightTag,
} from "@/types/aiInsights";
import { SmartInsightsService } from "@/services/aiInsights";

interface RecommendationFiltersPanelProps {
  onFilterChange: (filters: RecommendationFilters) => void;
}

const RecommendationFiltersPanel = ({
  onFilterChange,
}: RecommendationFiltersPanelProps) => {
  const { isOpen, onToggle } = useDisclosure();
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [availableTags, setAvailableTags] = useState<InsightTag[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  // Загрузка доступных тегов
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await SmartInsightsService.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

  // Обновление фильтров
  const handleFilterUpdate = (
    field: keyof RecommendationFilters,
    value: any
  ) => {
    const updatedFilters = { ...filters, [field]: value };

    // Если значение пустое, удаляем поле из фильтров
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete updatedFilters[field];
    }

    setFilters(updatedFilters);
  };

  // Применение фильтров
  const applyFilters = () => {
    onFilterChange(filters);
    updateAppliedFiltersLabels();
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({});
    setAppliedFilters([]);
    onFilterChange({});
  };

  // Обновление отображаемых примененных фильтров
  const updateAppliedFiltersLabels = () => {
    const labels: string[] = [];

    if (filters.recommendation_type && filters.recommendation_type.length) {
      labels.push(`Тип: ${filters.recommendation_type.length}`);
    }

    if (filters.priority && filters.priority.length) {
      labels.push(`Приоритет: ${filters.priority.length}`);
    }

    if (filters.status && filters.status.length) {
      labels.push(`Статус: ${filters.status.length}`);
    }

    if (filters.tag_id && filters.tag_id.length) {
      labels.push(`Теги: ${filters.tag_id.length}`);
    }

    if (filters.search) {
      labels.push(`Поиск: ${filters.search}`);
    }

    if (filters.show_all) {
      labels.push("Все рекомендации");
    }

    if (filters.dateFrom || filters.dateTo) {
      labels.push("Период");
    }

    setAppliedFilters(labels);
  };

  // Удаление фильтра по метке
  const removeFilterByLabel = (label: string) => {
    const newFilters = { ...filters };

    if (label.startsWith("Тип:")) {
      delete newFilters.recommendation_type;
    } else if (label.startsWith("Приоритет:")) {
      delete newFilters.priority;
    } else if (label.startsWith("Статус:")) {
      delete newFilters.status;
    } else if (label.startsWith("Теги:")) {
      delete newFilters.tag_id;
      delete newFilters.tag_slug;
    } else if (label.startsWith("Поиск:")) {
      delete newFilters.search;
    } else if (label === "Все рекомендации") {
      delete newFilters.show_all;
    } else if (label === "Период") {
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
    updateAppliedFiltersLabels();
  };

  return (
    <Box bg="white" p={4} borderRadius="md" shadow="sm">
      {/* Кнопка открытия/закрытия панели фильтров */}
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
        <Button
          leftIcon={<FiFilter />}
          rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
          variant="outline"
          onClick={onToggle}
          size="sm"
        >
          Фильтры
        </Button>

        {/* Отображение активных фильтров */}
        {appliedFilters.length > 0 && (
          <HStack spacing={2} overflow="auto" maxW="70%">
            {appliedFilters.map((label) => (
              <Tag
                key={label}
                size="sm"
                borderRadius="full"
                variant="subtle"
                colorScheme="blue"
              >
                <TagLabel>{label}</TagLabel>
                <TagCloseButton onClick={() => removeFilterByLabel(label)} />
              </Tag>
            ))}
            <Button size="xs" variant="ghost" onClick={resetFilters}>
              Сбросить все
            </Button>
          </HStack>
        )}
      </Flex>

      {/* Раскрывающаяся панель фильтров */}
      <Collapse in={isOpen} animateOpacity>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {/* Тип рекомендации */}
          <FormControl>
            <FormLabel fontSize="sm">Тип рекомендации</FormLabel>
            <Select
              placeholder="Все типы"
              value={filters.recommendation_type?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "recommendation_type",
                  e.target.value ? [e.target.value as RecommendationType] : []
                )
              }
              size="sm"
            >
              <option value={RecommendationType.TRAINING}>Обучение</option>
              <option value={RecommendationType.FEEDBACK}>
                Обратная связь
              </option>
              <option value={RecommendationType.PROGRESS}>Прогресс</option>
              <option value={RecommendationType.GENERAL}>Общая</option>
            </Select>
          </FormControl>

          {/* Приоритет */}
          <FormControl>
            <FormLabel fontSize="sm">Приоритет</FormLabel>
            <Select
              placeholder="Все приоритеты"
              value={filters.priority?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "priority",
                  e.target.value
                    ? [e.target.value as RecommendationPriority]
                    : []
                )
              }
              size="sm"
            >
              <option value={RecommendationPriority.HIGH}>Высокий</option>
              <option value={RecommendationPriority.MEDIUM}>Средний</option>
              <option value={RecommendationPriority.LOW}>Низкий</option>
            </Select>
          </FormControl>

          {/* Статус */}
          <FormControl>
            <FormLabel fontSize="sm">Статус</FormLabel>
            <Select
              placeholder="Все статусы"
              value={filters.status?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "status",
                  e.target.value ? [e.target.value as RecommendationStatus] : []
                )
              }
              size="sm"
            >
              <option value={RecommendationStatus.ACTIVE}>Активная</option>
              <option value={RecommendationStatus.ACCEPTED}>Принята</option>
              <option value={RecommendationStatus.REJECTED}>Отклонена</option>
              <option value={RecommendationStatus.EXPIRED}>Просрочена</option>
            </Select>
          </FormControl>

          {/* Теги */}
          <FormControl>
            <FormLabel fontSize="sm">Теги</FormLabel>
            <Select
              placeholder="Выберите теги"
              value={""}
              onChange={(e) => {
                if (e.target.value) {
                  const tagId = parseInt(e.target.value);
                  const currentTagIds = filters.tag_id || [];
                  if (!currentTagIds.includes(tagId)) {
                    handleFilterUpdate("tag_id", [...currentTagIds, tagId]);
                  }
                }
              }}
              size="sm"
            >
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>

            {/* Выбранные теги */}
            {filters.tag_id && filters.tag_id.length > 0 && (
              <Box mt={2}>
                <HStack spacing={2} flexWrap="wrap">
                  {filters.tag_id.map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId);
                    return tag ? (
                      <Tag
                        key={tagId}
                        size="sm"
                        colorScheme={tag.color}
                        borderRadius="full"
                      >
                        <TagLabel>{tag.name}</TagLabel>
                        <TagCloseButton
                          onClick={() => {
                            const newTags = filters.tag_id!.filter(
                              (id) => id !== tagId
                            );
                            handleFilterUpdate(
                              "tag_id",
                              newTags.length ? newTags : undefined
                            );
                          }}
                        />
                      </Tag>
                    ) : null;
                  })}
                </HStack>
              </Box>
            )}
          </FormControl>

          {/* Поиск */}
          <FormControl>
            <FormLabel fontSize="sm">Поиск</FormLabel>
            <Input
              placeholder="Поиск по заголовку и тексту"
              value={filters.search || ""}
              onChange={(e) =>
                handleFilterUpdate("search", e.target.value || undefined)
              }
              size="sm"
            />
          </FormControl>

          {/* Показать все рекомендации */}
          <FormControl display="flex" alignItems="center">
            <Switch
              id="show-all"
              isChecked={!!filters.show_all}
              onChange={(e) => handleFilterUpdate("show_all", e.target.checked)}
              mr={2}
            />
            <FormLabel htmlFor="show-all" fontSize="sm" mb={0}>
              Показать все рекомендации
            </FormLabel>
          </FormControl>
        </SimpleGrid>

        <Flex justifyContent="flex-end" mt={4}>
          <Button variant="outline" mr={2} onClick={resetFilters} size="sm">
            Сбросить
          </Button>
          <Button colorScheme="blue" onClick={applyFilters} size="sm">
            Применить
          </Button>
        </Flex>
      </Collapse>
    </Box>
  );
};

export default RecommendationFiltersPanel;
