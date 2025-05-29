import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Text,
  Flex,
  IconButton,
  Heading,
  VStack,
  HStack,
  Divider,
  useToast,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  FormHelperText,
  Tooltip,
} from "@chakra-ui/react";
import { FiPlus, FiTrash2, FiMoveUp, FiMoveDown } from "react-icons/fi";
import { FeedbackTemplate, FeedbackQuestion } from "../../types/feedback";

interface FeedbackFormBuilderProps {
  initialTemplate?: FeedbackTemplate;
  onSave: (template: FeedbackTemplate) => void;
  isSubmitting?: boolean;
}

const FeedbackFormBuilder: React.FC<FeedbackFormBuilderProps> = ({
  initialTemplate,
  onSave,
  isSubmitting = false,
}) => {
  const [template, setTemplate] = useState<FeedbackTemplate>({
    id: initialTemplate?.id || 0,
    title: initialTemplate?.title || "",
    description: initialTemplate?.description || "",
    type: initialTemplate?.type || "manual",
    is_anonymous: initialTemplate?.is_anonymous || false,
    questions: initialTemplate?.questions || [],
  });

  const [errors, setErrors] = useState<{
    title?: string;
    questions?: string;
    general?: string;
  }>({});

  const toast = useToast();

  // Загрузка начальных данных
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Обработчики изменений
  const handleTemplateChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTemplate({
      ...template,
      [name]: value,
    });
  };

  const handleSwitchChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setTemplate({
        ...template,
        [name]: e.target.checked,
      });
    };

  const addQuestion = () => {
    const newQuestion: FeedbackQuestion = {
      id: 0, // Будет установлен сервером
      text: "",
      type: "text",
      order: template.questions.length,
      required: true,
      options: null,
    };

    setTemplate({
      ...template,
      questions: [...template.questions, newQuestion],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...template.questions];
    newQuestions.splice(index, 1);

    // Обновляем порядок вопросов
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      order: i,
    }));

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === template.questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...template.questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    // Меняем вопросы местами
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];

    // Обновляем порядок
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      order: i,
    }));

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = template.questions.map((q, i) => {
      if (i === index) {
        if (field === "type" && value !== "multiple_choice") {
          // Если тип изменен на не множественный выбор, сбрасываем options
          return {
            ...q,
            [field]: value,
            options: null,
          };
        }
        return {
          ...q,
          [field]: value,
        };
      }
      return q;
    });

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = template.questions.map((q, i) => {
      if (i === questionIndex) {
        const currentOptions = q.options || [];
        return {
          ...q,
          options: [...currentOptions, ""],
        };
      }
      return q;
    });

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = template.questions.map((q, i) => {
      if (i === questionIndex && q.options) {
        const newOptions = [...q.options];
        newOptions.splice(optionIndex, 1);
        return {
          ...q,
          options: newOptions,
        };
      }
      return q;
    });

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = template.questions.map((q, i) => {
      if (i === questionIndex && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return {
          ...q,
          options: newOptions,
        };
      }
      return q;
    });

    setTemplate({
      ...template,
      questions: updatedQuestions,
    });
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      questions?: string;
      general?: string;
    } = {};

    if (!template.title.trim()) {
      newErrors.title = "Название шаблона обязательно";
    }

    if (template.questions.length === 0) {
      newErrors.questions = "Добавьте хотя бы один вопрос";
    }

    // Проверяем каждый вопрос
    const hasEmptyQuestions = template.questions.some((q) => !q.text.trim());
    if (hasEmptyQuestions) {
      newErrors.questions = "Все вопросы должны иметь текст";
    }

    // Проверяем варианты ответов для множественного выбора
    const hasInvalidOptions = template.questions.some(
      (q) =>
        q.type === "multiple_choice" && (!q.options || q.options.length < 2)
    );
    if (hasInvalidOptions) {
      newErrors.questions =
        "Для вопросов с множественным выбором нужно минимум 2 варианта";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(template);
    } else {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, исправьте ошибки в форме",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Основная информация</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel>Название шаблона</FormLabel>
              <Input
                name="title"
                value={template.title}
                onChange={handleTemplateChange}
                placeholder="Например: Обратная связь по онбордингу"
              />
              {errors.title && (
                <FormHelperText color="red.500">{errors.title}</FormHelperText>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Описание</FormLabel>
              <Textarea
                name="description"
                value={template.description}
                onChange={handleTemplateChange}
                placeholder="Опишите назначение этой формы обратной связи"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Тип шаблона</FormLabel>
              <Select
                name="type"
                value={template.type}
                onChange={handleTemplateChange}
              >
                <option value="manual">Ручной (создается пользователем)</option>
                <option value="automatic">
                  Автоматический (генерируется системой)
                </option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is_anonymous" mb="0">
                Анонимный отзыв
              </FormLabel>
              <Switch
                id="is_anonymous"
                name="is_anonymous"
                isChecked={template.is_anonymous}
                onChange={handleSwitchChange("is_anonymous")}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      <Card mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Вопросы</Heading>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={addQuestion}
            >
              Добавить вопрос
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {errors.questions && (
            <Text color="red.500" mb={4}>
              {errors.questions}
            </Text>
          )}

          {template.questions.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Text color="gray.500">
                Нет вопросов. Нажмите "Добавить вопрос", чтобы создать новый.
              </Text>
            </Box>
          ) : (
            <VStack spacing={6} align="stretch">
              {template.questions.map((question, index) => (
                <Box
                  key={index}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor="gray.200"
                >
                  <Flex justify="space-between" mb={4}>
                    <Heading size="sm">Вопрос {index + 1}</Heading>
                    <HStack>
                      <Tooltip label="Переместить вверх">
                        <IconButton
                          aria-label="Переместить вверх"
                          icon={<FiMoveUp />}
                          size="sm"
                          onClick={() => moveQuestion(index, "up")}
                          isDisabled={index === 0}
                        />
                      </Tooltip>
                      <Tooltip label="Переместить вниз">
                        <IconButton
                          aria-label="Переместить вниз"
                          icon={<FiMoveDown />}
                          size="sm"
                          onClick={() => moveQuestion(index, "down")}
                          isDisabled={index === template.questions.length - 1}
                        />
                      </Tooltip>
                      <Tooltip label="Удалить вопрос">
                        <IconButton
                          aria-label="Удалить вопрос"
                          icon={<FiTrash2 />}
                          colorScheme="red"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>

                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Текст вопроса</FormLabel>
                      <Input
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(index, "text", e.target.value)
                        }
                        placeholder="Введите текст вопроса"
                      />
                    </FormControl>

                    <HStack>
                      <FormControl>
                        <FormLabel>Тип вопроса</FormLabel>
                        <Select
                          value={question.type}
                          onChange={(e) =>
                            handleQuestionChange(index, "type", e.target.value)
                          }
                        >
                          <option value="text">Текстовый ответ</option>
                          <option value="scale">Шкала (от 0 до 10)</option>
                          <option value="multiple_choice">
                            Множественный выбор
                          </option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Обязательный</FormLabel>
                        <Switch
                          isChecked={question.required}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "required",
                              e.target.checked
                            )
                          }
                        />
                      </FormControl>
                    </HStack>

                    {question.type === "multiple_choice" && (
                      <Box mt={2}>
                        <Flex justify="space-between" mb={2}>
                          <FormLabel mb={0}>Варианты ответа</FormLabel>
                          <Button
                            size="sm"
                            leftIcon={<FiPlus />}
                            onClick={() => addOption(index)}
                          >
                            Добавить вариант
                          </Button>
                        </Flex>

                        {!question.options || question.options.length === 0 ? (
                          <Text color="red.500" fontSize="sm">
                            Добавьте хотя бы два варианта ответа
                          </Text>
                        ) : (
                          <VStack spacing={2} align="stretch">
                            {question.options.map((option, optIdx) => (
                              <Flex key={optIdx} gap={2}>
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      index,
                                      optIdx,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Вариант ${optIdx + 1}`}
                                />
                                <IconButton
                                  aria-label="Удалить вариант"
                                  icon={<FiTrash2 />}
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() => removeOption(index, optIdx)}
                                />
                              </Flex>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>

      <Flex justify="flex-end" mt={6}>
        <Button
          type="submit"
          colorScheme="green"
          isLoading={isSubmitting}
          loadingText="Сохранение..."
        >
          Сохранить шаблон
        </Button>
      </Flex>
    </Box>
  );
};

export default FeedbackFormBuilder;
