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
  IconButton,
  Text,
  HStack,
  Tag,
  TagCloseButton,
  TagLabel,
  VStack,
} from "@chakra-ui/react";
import { FiFilter, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import {
  SmartInsightType,
  InsightLevel,
  InsightStatus,
  InsightFilters,
  InsightTag,
} from "@/types/aiInsights";
import { SmartInsightsService } from "@/services/aiInsights";

interface InsightFiltersPanelProps {
  onFilterChange: (filters: InsightFilters) => void;
}

const InsightFiltersPanel = ({ onFilterChange }: InsightFiltersPanelProps) => {
  const { isOpen, onToggle } = useDisclosure();
  const [filters, setFilters] = useState<InsightFilters>({});
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
  const handleFilterUpdate = (field: keyof InsightFilters, value: any) => {
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

    if (filters.insight_type && filters.insight_type.length) {
      labels.push(`Тип: ${filters.insight_type.length}`);
    }

    if (filters.level && filters.level.length) {
      labels.push(`Уровень: ${filters.level.length}`);
    }

    if (filters.status && filters.status.length) {
      labels.push(`Статус: ${filters.status.length}`);
    }

    if (filters.source && filters.source.length) {
      labels.push(`Источник: ${filters.source.length}`);
    }

    if (filters.tag_id && filters.tag_id.length) {
      labels.push(`Теги: ${filters.tag_id.length}`);
    }

    if (filters.search) {
      labels.push(`Поиск: ${filters.search}`);
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
      delete newFilters.insight_type;
    } else if (label.startsWith("Уровень:")) {
      delete newFilters.level;
    } else if (label.startsWith("Статус:")) {
      delete newFilters.status;
    } else if (label.startsWith("Источник:")) {
      delete newFilters.source;
    } else if (label.startsWith("Теги:")) {
      delete newFilters.tag_id;
      delete newFilters.tag_slug;
    } else if (label.startsWith("Поиск:")) {
      delete newFilters.search;
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
          {/* Тип инсайта */}
          <FormControl>
            <FormLabel fontSize="sm">Тип инсайта</FormLabel>
            <Select
              placeholder="Все типы"
              value={filters.insight_type?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "insight_type",
                  e.target.value ? [e.target.value as SmartInsightType] : []
                )
              }
              size="sm"
            >
              <option value={SmartInsightType.TRAINING}>Обучение</option>
              <option value={SmartInsightType.FEEDBACK}>Обратная связь</option>
              <option value={SmartInsightType.SCHEDULE}>Расписание</option>
              <option value={SmartInsightType.ANALYTICS}>Аналитика</option>
              <option value={SmartInsightType.RECOMMENDATION}>
                Рекомендация
              </option>
            </Select>
          </FormControl>

          {/* Уровень важности */}
          <FormControl>
            <FormLabel fontSize="sm">Уровень важности</FormLabel>
            <Select
              placeholder="Все уровни"
              value={filters.level?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "level",
                  e.target.value ? [e.target.value as InsightLevel] : []
                )
              }
              size="sm"
            >
              <option value={InsightLevel.CRITICAL}>Критический</option>
              <option value={InsightLevel.HIGH}>Высокий</option>
              <option value={InsightLevel.MEDIUM}>Средний</option>
              <option value={InsightLevel.LOW}>Низкий</option>
              <option value={InsightLevel.INFORMATIONAL}>Информационный</option>
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
                  e.target.value ? [e.target.value as InsightStatus] : []
                )
              }
              size="sm"
            >
              <option value={InsightStatus.NEW}>Новый</option>
              <option value={InsightStatus.ACKNOWLEDGED}>Подтвержден</option>
              <option value={InsightStatus.IN_PROGRESS}>В обработке</option>
              <option value={InsightStatus.RESOLVED}>Решен</option>
              <option value={InsightStatus.DISMISSED}>Отклонен</option>
            </Select>
          </FormControl>

          {/* Источник */}
          <FormControl>
            <FormLabel fontSize="sm">Источник</FormLabel>
            <Select
              placeholder="Все источники"
              value={filters.source?.[0] || ""}
              onChange={(e) =>
                handleFilterUpdate(
                  "source",
                  e.target.value ? [e.target.value] : []
                )
              }
              size="sm"
            >
              <option value="training">Обучение</option>
              <option value="feedback">Обратная связь</option>
              <option value="scheduler">Планировщик</option>
              <option value="analytics">Аналитика</option>
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
              placeholder="Поиск по заголовку и описанию"
              value={filters.search || ""}
              onChange={(e) =>
                handleFilterUpdate("search", e.target.value || undefined)
              }
              size="sm"
            />
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

export default InsightFiltersPanel;
