import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  useAlertRules,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from "../../../api/useHRDashboard";
import type { HRAlertRule } from "../../../types/hr-dashboard";

const HRAlertRulesPage: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingRule, setEditingRule] = React.useState<HRAlertRule | null>(
    null
  );
  const toast = useToast();

  const { data: rules = [] } = useAlertRules();
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    severity: "medium",
    metric_key: "",
    threshold_value: 0,
    comparison: "gt",
    notify_hr: true,
    notify_admin: true,
    is_active: true,
  });

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const tableBgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleOpenModal = (rule?: HRAlertRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        name: "",
        description: "",
        severity: "medium",
        metric_key: "",
        threshold_value: 0,
        comparison: "gt",
        notify_hr: true,
        notify_admin: true,
        is_active: true,
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          data: formData,
        });
        toast({
          title: "Правило обновлено",
          status: "success",
          duration: 3000,
        });
      } else {
        await createRule.mutateAsync(formData);
        toast({
          title: "Правило создано",
          status: "success",
          duration: 3000,
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить правило",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRule.mutateAsync(id);
      toast({
        title: "Правило удалено",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить правило",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "yellow";
      default:
        return "gray";
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>
              Настройка правил алертов
            </Heading>
            <Text color="gray.500">
              Управление правилами генерации HR-алертов
            </Text>
          </Box>

          <Box>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => handleOpenModal()}
              mb={6}
            >
              Добавить правило
            </Button>

            <Box
              bg={tableBgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="sm"
              overflowX="auto"
            >
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Название</Th>
                    <Th>Метрика</Th>
                    <Th>Условие</Th>
                    <Th>Важность</Th>
                    <Th>Статус</Th>
                    <Th>Действия</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rules.map((rule) => (
                    <Tr key={rule.id}>
                      <Td>
                        <Text fontWeight="medium">{rule.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {rule.description}
                        </Text>
                      </Td>
                      <Td>{rule.metric_key}</Td>
                      <Td>
                        {rule.comparison === "gt"
                          ? ">"
                          : rule.comparison === "lt"
                          ? "<"
                          : "="}{" "}
                        {rule.threshold_value}
                      </Td>
                      <Td>
                        <Badge colorScheme={getSeverityColor(rule.severity)}>
                          {rule.severity.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        <Switch
                          isChecked={rule.is_active}
                          onChange={async () => {
                            await updateRule.mutateAsync({
                              id: rule.id,
                              data: { is_active: !rule.is_active },
                            });
                          }}
                        />
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Edit rule"
                          icon={<EditIcon />}
                          size="sm"
                          mr={2}
                          onClick={() => handleOpenModal(rule)}
                        />
                        <IconButton
                          aria-label="Delete rule"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(rule.id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingRule ? "Редактировать правило" : "Новое правило"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Название</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Описание</FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Метрика</FormLabel>
                <Input
                  value={formData.metric_key}
                  onChange={(e) =>
                    setFormData({ ...formData, metric_key: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Условие</FormLabel>
                <Select
                  value={formData.comparison}
                  onChange={(e) =>
                    setFormData({ ...formData, comparison: e.target.value })
                  }
                >
                  <option value="gt">Больше чем</option>
                  <option value="lt">Меньше чем</option>
                  <option value="eq">Равно</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Пороговое значение</FormLabel>
                <NumberInput
                  value={formData.threshold_value}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      threshold_value: parseFloat(value),
                    })
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Важность</FormLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                >
                  <option value="low">Низкая</option>
                  <option value="medium">Средняя</option>
                  <option value="high">Высокая</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Уведомления</FormLabel>
                <VStack align="start">
                  <Switch
                    isChecked={formData.notify_hr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notify_hr: e.target.checked,
                      })
                    }
                  >
                    Уведомлять HR
                  </Switch>
                  <Switch
                    isChecked={formData.notify_admin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notify_admin: e.target.checked,
                      })
                    }
                  >
                    Уведомлять администраторов
                  </Switch>
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={createRule.isLoading || updateRule.isLoading}
            >
              {editingRule ? "Сохранить" : "Создать"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HRAlertRulesPage;
