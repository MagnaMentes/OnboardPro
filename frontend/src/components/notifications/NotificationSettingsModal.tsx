import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Text,
  useToast,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import notificationApi, {
  NotificationSettings,
} from "../../api/notificationApi";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно настроек уведомлений пользователя
 */
const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Состояния для хранения настроек и статуса загрузки
  const [settings, setSettings] = useState<NotificationSettings>({
    info: true,
    warning: true,
    deadline: true,
    system: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Загрузка настроек при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  // Получение настроек с сервера
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await notificationApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Ошибка при загрузке настроек уведомлений:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки уведомлений",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчики изменения настроек
  const handleSwitchChange = (type: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Сохранение настроек
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notificationApi.updateSettings(settings);
      toast({
        title: "Успешно",
        description: "Настройки уведомлений сохранены",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("Ошибка при сохранении настроек уведомлений:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки уведомлений",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Настройки уведомлений</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <VStack spacing={6} align="stretch">
              <Text>
                Выберите типы уведомлений, которые вы хотите получать:
              </Text>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel htmlFor="info-notifications" mb={0}>
                  Информационные уведомления
                </FormLabel>
                <Switch
                  id="info-notifications"
                  colorScheme="blue"
                  isChecked={settings.info}
                  onChange={() => handleSwitchChange("info")}
                />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel htmlFor="warning-notifications" mb={0}>
                  Предупреждающие уведомления
                </FormLabel>
                <Switch
                  id="warning-notifications"
                  colorScheme="orange"
                  isChecked={settings.warning}
                  onChange={() => handleSwitchChange("warning")}
                />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel htmlFor="deadline-notifications" mb={0}>
                  Уведомления о дедлайнах
                </FormLabel>
                <Switch
                  id="deadline-notifications"
                  colorScheme="red"
                  isChecked={settings.deadline}
                  onChange={() => handleSwitchChange("deadline")}
                />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel htmlFor="system-notifications" mb={0}>
                  Системные уведомления
                </FormLabel>
                <Switch
                  id="system-notifications"
                  colorScheme="gray"
                  isChecked={settings.system}
                  onChange={() => handleSwitchChange("system")}
                />
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={isSaving}
          >
            Отмена
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Сохранение..."
          >
            Сохранить
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NotificationSettingsModal;
