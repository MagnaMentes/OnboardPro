import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  Heading,
  Divider,
  Switch,
  FormHelperText,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiSave, FiX } from "react-icons/fi";
import MultiSelect from "../../common/MultiSelect";

interface Template {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface RuleFormData {
  id?: number;
  name: string;
  description: string;
  rule_type: string;
  threshold: number;
  measurement_period_days: number;
  is_active: boolean;
  templates: number[];
  departments: number[];
}

interface FeedbackRuleFormProps {
  rule?: {
    id: number;
    name: string;
    description: string;
    rule_type: string;
    threshold: number;
    measurement_period_days: number;
    is_active: boolean;
    templates?: { id: number; name: string }[];
    departments?: { id: number; name: string }[];
    created_at: string;
  };
  templates: Template[];
  departments: Department[];
  onSubmit: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ruleTypeOptions = [
  { value: "sentiment_drop", label: "Падение настроения" },
  { value: "satisfaction_drop", label: "Падение удовлетворенности" },
  { value: "response_rate_drop", label: "Снижение активности ответов" },
  { value: "issue_frequency_rise", label: "Увеличение частоты проблем" },
  { value: "topic_shift", label: "Резкая смена тематик" },
];

const FeedbackRuleForm: React.FC<FeedbackRuleFormProps> = ({
  rule,
  templates,
  departments,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    rule_type: "sentiment_drop",
    threshold: 10,
    measurement_period_days: 7,
    is_active: true,
    templates: [],
    departments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (rule) {
      setFormData({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        rule_type: rule.rule_type,
        threshold: rule.threshold,
        measurement_period_days: rule.measurement_period_days,
        is_active: rule.is_active,
        templates: rule.templates?.map((t) => t.id) || [],
        departments: rule.departments?.map((d) => d.id) || [],
      });
    }
  }, [rule]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelectChange = (name: string, values: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название правила обязательно";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Описание правила обязательно";
    }

    if (!formData.rule_type) {
      newErrors.rule_type = "Тип правила обязателен";
    }

    if (formData.threshold <= 0) {
      newErrors.threshold = "Пороговое значение должно быть больше нуля";
    }

    if (formData.measurement_period_days <= 0) {
      newErrors.measurement_period_days =
        "Период измерения должен быть больше нуля";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, исправьте ошибки в форме",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting rule:", error);
      toast({
        title: "Ошибка сохранения",
        description:
          "Не удалось сохранить правило. Пожалуйста, попробуйте снова.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} bg={bgColor} borderRadius="md" p={6}>
      <Heading size="md" mb={4}>
        {rule ? "Редактирование правила" : "Новое правило тренда"}
      </Heading>
      <Divider mb={6} />

      <Stack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel>Название правила</FormLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Например: Критическое падение удовлетворенности"
          />
          {errors.name && (
            <FormHelperText color="red.500">{errors.name}</FormHelperText>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.description}>
          <FormLabel>Описание</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите, что отслеживает это правило и какие действия следует предпринять при срабатывании"
            rows={3}
          />
          {errors.description && (
            <FormHelperText color="red.500">
              {errors.description}
            </FormHelperText>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.rule_type}>
          <FormLabel>Тип правила</FormLabel>
          <Select
            name="rule_type"
            value={formData.rule_type}
            onChange={handleChange}
          >
            {ruleTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.rule_type && (
            <FormHelperText color="red.500">{errors.rule_type}</FormHelperText>
          )}
          <FormHelperText>
            Выберите тип метрики, которую будет отслеживать это правило
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!errors.threshold}>
          <FormLabel>Пороговое значение (%)</FormLabel>
          <NumberInput
            value={formData.threshold}
            onChange={(_, value) => handleNumberChange("threshold", value)}
            min={1}
            max={100}
            step={1}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          {errors.threshold && (
            <FormHelperText color="red.500">{errors.threshold}</FormHelperText>
          )}
          <FormHelperText>
            Процент изменения метрики, при котором будет срабатывать алерт
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!errors.measurement_period_days}>
          <FormLabel>Период измерения (дней)</FormLabel>
          <NumberInput
            value={formData.measurement_period_days}
            onChange={(_, value) =>
              handleNumberChange("measurement_period_days", value)
            }
            min={1}
            max={90}
            step={1}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          {errors.measurement_period_days && (
            <FormHelperText color="red.500">
              {errors.measurement_period_days}
            </FormHelperText>
          )}
          <FormHelperText>
            Количество дней, за которые анализируется изменение метрики
          </FormHelperText>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="is_active" mb="0">
            Правило активно
          </FormLabel>
          <Switch
            id="is_active"
            name="is_active"
            isChecked={formData.is_active}
            onChange={handleSwitchChange}
            colorScheme="blue"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Шаблоны обратной связи (опционально)</FormLabel>
          <MultiSelect
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
            selectedValues={formData.templates}
            onChange={(values) => handleMultiSelectChange("templates", values)}
            placeholder="Выберите шаблоны для отслеживания"
          />
          <FormHelperText>
            Оставьте пустым для отслеживания всех шаблонов
          </FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Департаменты (опционально)</FormLabel>
          <MultiSelect
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            selectedValues={formData.departments}
            onChange={(values) =>
              handleMultiSelectChange("departments", values)
            }
            placeholder="Выберите департаменты для отслеживания"
          />
          <FormHelperText>
            Оставьте пустым для отслеживания всех департаментов
          </FormHelperText>
        </FormControl>
      </Stack>

      <Divider my={6} />

      <Stack direction="row" spacing={4} justify="flex-end">
        <Button
          leftIcon={<FiX />}
          variant="outline"
          onClick={onCancel}
          isDisabled={isLoading}
        >
          Отмена
        </Button>
        <Button
          leftIcon={<FiSave />}
          colorScheme="blue"
          type="submit"
          isLoading={isLoading}
        >
          {rule ? "Сохранить изменения" : "Создать правило"}
        </Button>
      </Stack>
    </Box>
  );
};

export default FeedbackRuleForm;
