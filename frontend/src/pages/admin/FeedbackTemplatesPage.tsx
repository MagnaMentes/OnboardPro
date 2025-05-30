import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Flex,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  IconButton,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiCopy } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import FeedbackFormBuilder from "../../components/feedback/FeedbackFormBuilder";
import { FeedbackTemplate, TemplateType } from "../../types/feedback";
import axios from "axios";

// Временные моковые данные для демонстрации
const mockTemplates: FeedbackTemplate[] = [
  {
    id: 1,
    title: "Оценка прохождения онбординга",
    description:
      "Форма для оценки качества прохождения процесса онбординга новыми сотрудниками",
    type: TemplateType.MANUAL,
    creator_id: 1,
    creator_name: "Анна Смирнова",
    is_anonymous: false,
    created_at: "2025-04-15T10:30:00Z",
    updated_at: "2025-04-15T10:30:00Z",
    questions: [
      {
        id: 1,
        text: "Оцените качество материалов онбординга",
        type: "scale",
        order: 1,
        required: true,
      },
      {
        id: 2,
        text: "Что можно улучшить в процессе онбординга?",
        type: "text",
        order: 2,
        required: false,
      },
    ],
  },
  {
    id: 2,
    title: "Отзыв о наставнике",
    description: "Анонимная форма для оценки работы наставника",
    type: TemplateType.AUTOMATIC,
    creator_id: 2,
    creator_name: "Иван Петров",
    is_anonymous: true,
    created_at: "2025-04-10T14:20:00Z",
    updated_at: "2025-04-12T11:15:00Z",
    questions: [
      {
        id: 3,
        text: "Насколько наставник был полезен?",
        type: "scale",
        order: 1,
        required: true,
      },
      {
        id: 4,
        text: "Какие качества вы цените в вашем наставнике?",
        type: "multiple_choice",
        order: 2,
        required: true,
        options: [
          "Профессионализм",
          "Коммуникабельность",
          "Терпение",
          "Доступность",
          "Другое",
        ],
      },
    ],
  },
];

const FeedbackTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<FeedbackTemplate[]>(mockTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTemplate, setCurrentTemplate] =
    useState<FeedbackTemplate | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  // В реальном приложении здесь будет запрос на получение шаблонов
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        // Раскомментировать для реальной реализации
        // const response = await axios.get('/api/feedback/templates/');
        // setTemplates(response.data);

        // Временно используем моковые данные
        setTimeout(() => {
          setTemplates(mockTemplates);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Ошибка при загрузке шаблонов:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить шаблоны обратной связи",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  const handleCreateTemplate = () => {
    setCurrentTemplate(null); // Сбросить текущий шаблон для создания нового
    onOpen();
  };

  const handleEditTemplate = (template: FeedbackTemplate) => {
    setCurrentTemplate(template);
    onOpen();
  };

  const handleViewResults = (templateId: number) => {
    navigate(`/admin/feedback/results?template=${templateId}`);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот шаблон?")) {
      try {
        // Раскомментировать для реальной реализации
        // await axios.delete(`/api/feedback/templates/${templateId}/`);

        // Обновляем локальное состояние
        setTemplates(templates.filter((t) => t.id !== templateId));

        toast({
          title: "Шаблон удален",
          description: "Шаблон обратной связи успешно удален",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Ошибка при удалении шаблона:", error);
        toast({
          title: "Ошибка удаления",
          description: "Не удалось удалить шаблон обратной связи",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleSaveTemplate = async (template: FeedbackTemplate) => {
    try {
      let savedTemplate;
      if (template.id) {
        // Обновление существующего шаблона
        // Раскомментировать для реальной реализации
        // const response = await axios.put(`/api/feedback/templates/${template.id}/`, template);
        // savedTemplate = response.data;

        // Временно обновляем локальное состояние
        savedTemplate = { ...template, updated_at: new Date().toISOString() };
        setTemplates(
          templates.map((t) => (t.id === template.id ? savedTemplate : t))
        );
      } else {
        // Создание нового шаблона
        // Раскомментировать для реальной реализации
        // const response = await axios.post('/api/feedback/templates/', template);
        // savedTemplate = response.data;

        // Временно добавляем в локальное состояние
        savedTemplate = {
          ...template,
          id: Math.max(...templates.map((t) => t.id), 0) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTemplates([...templates, savedTemplate]);
      }

      toast({
        title: template.id ? "Шаблон обновлен" : "Шаблон создан",
        description: template.id
          ? "Шаблон обратной связи успешно обновлен"
          : "Новый шаблон обратной связи успешно создан",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении шаблона:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить шаблон обратной связи",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDuplicateTemplate = (template: FeedbackTemplate) => {
    const duplicateTemplate = {
      ...template,
      id: 0, // Сбрасываем ID для создания нового
      title: `Копия - ${template.title}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: template.questions?.map((q) => ({ ...q, id: undefined })),
    };
    setCurrentTemplate(duplicateTemplate);
    onOpen();
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">
          Шаблоны обратной связи
        </Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleCreateTemplate}
        >
          Создать шаблон
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="300px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Загрузка шаблонов...</Text>
          </VStack>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {templates.map((template) => (
            <Card key={template.id} variant="outline">
              <CardHeader>
                <Flex justify="space-between" align="flex-start">
                  <VStack align="start" spacing={1}>
                    <Heading size="md">{template.title}</Heading>
                    <Badge
                      colorScheme={
                        template.type === TemplateType.AUTOMATIC
                          ? "purple"
                          : "green"
                      }
                    >
                      {template.type === TemplateType.AUTOMATIC
                        ? "Автоматический"
                        : "Ручной"}
                    </Badge>
                  </VStack>
                </Flex>
              </CardHeader>
              <CardBody>
                <Text noOfLines={2}>{template.description}</Text>
                <VStack align="start" spacing={1} mt={3}>
                  <Text fontSize="sm">
                    Вопросов: {template.questions?.length || 0}
                  </Text>
                  <Text fontSize="sm">
                    Создан:{" "}
                    {new Date(template.created_at).toLocaleDateString("ru-RU")}
                  </Text>
                  {template.is_anonymous && (
                    <Badge colorScheme="orange">Анонимный</Badge>
                  )}
                </VStack>
              </CardBody>
              <CardFooter>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Редактировать шаблон"
                    icon={<FiEdit />}
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  />
                  <IconButton
                    aria-label="Дублировать шаблон"
                    icon={<FiCopy />}
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  />
                  <IconButton
                    aria-label="Посмотреть результаты"
                    icon={<FiEye />}
                    size="sm"
                    onClick={() => handleViewResults(template.id)}
                  />
                  <IconButton
                    aria-label="Удалить шаблон"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteTemplate(template.id)}
                  />
                </HStack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {currentTemplate ? "Редактирование шаблона" : "Создание шаблона"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FeedbackFormBuilder
              initialTemplate={currentTemplate || undefined}
              onSave={handleSaveTemplate}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default FeedbackTemplatesPage;
