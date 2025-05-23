import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  useToast,
  SimpleGrid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Flex,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiArrowLeft, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import bookingApi, { VirtualMeetingSlot } from "../../api/bookingApi";
import MeetingCard from "../../components/booking/MeetingCard";
import MeetingSchedulerForm from "../../components/booking/MeetingSchedulerForm";
import { User, OnboardingStep } from "../../types/apiTypes";
import { useRef } from "react";

// Моки для пользователей и шагов (в реальном приложении должны загружаться из API)
const mockUsers: User[] = [
  {
    id: 1,
    email: "user1@example.com",
    full_name: "Пользователь 1",
    role: "employee",
  },
  {
    id: 2,
    email: "user2@example.com",
    full_name: "Пользователь 2",
    role: "employee",
  },
  {
    id: 3,
    email: "user3@example.com",
    full_name: "Пользователь 3",
    role: "employee",
  },
];

const mockSteps: OnboardingStep[] = [
  {
    id: 1,
    name: "Знакомство с командой",
    description: "Знакомство с коллегами и командой",
    step_type: "meeting",
    order: 1,
    program: 1,
    is_required: true,
    is_virtual_meeting: true,
    deadline_days: 3,
  },
  {
    id: 2,
    name: "Встреча с HR",
    description: "Обсуждение рабочих вопросов",
    step_type: "meeting",
    order: 2,
    program: 1,
    is_required: true,
    is_virtual_meeting: true,
    deadline_days: 5,
  },
  {
    id: 3,
    name: "Техническое обучение",
    description: "Изучение технических аспектов",
    step_type: "training",
    order: 3,
    program: 1,
    is_required: true,
    is_virtual_meeting: true,
    deadline_days: 7,
  },
];

const ManageMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<VirtualMeetingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Загрузка всех встреч
  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await bookingApi.getUserMeetings();
      setMeetings(data);
    } catch (err) {
      console.error("Ошибка при загрузке встреч:", err);
      setError("Не удалось загрузить данные о встречах");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Обработчик создания новой встречи
  const handleMeetingCreated = () => {
    fetchMeetings();
    toast({
      title: "Встреча создана",
      description: "Виртуальная встреча успешно запланирована",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Диалог подтверждения удаления
  const openDeleteDialog = (meetingId: number) => {
    setSelectedMeeting(meetingId);
    onOpen();
  };

  // Удаление встречи
  const handleDeleteMeeting = async () => {
    if (selectedMeeting === null) return;

    try {
      await bookingApi.deleteMeeting(selectedMeeting);
      setMeetings(meetings.filter((m) => m.id !== selectedMeeting));
      toast({
        title: "Встреча удалена",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при удалении встречи:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить встречу",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedMeeting(null);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justifyContent="space-between">
          <Button
            as={RouterLink}
            to="/dashboard"
            leftIcon={<FiArrowLeft />}
            variant="outline"
          >
            Назад
          </Button>
          <Heading as="h1" size="xl">
            Управление виртуальными встречами
          </Heading>
          <Box></Box>
        </HStack>

        <Tabs isFitted variant="enclosed" colorScheme="purple">
          <TabList mb="1em">
            <Tab>Все встречи</Tab>
            <Tab>Создать встречу</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box bg="white" p={5} borderRadius="lg" shadow="md">
                <Heading as="h2" size="lg" mb={4}>
                  Список виртуальных встреч
                </Heading>

                {isLoading ? (
                  <Flex justify="center" my={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : error ? (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                ) : meetings.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {meetings.map((meeting) => (
                      <Box key={meeting.id} position="relative">
                        <Button
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          size="sm"
                          onClick={() => openDeleteDialog(meeting.id)}
                          zIndex={1}
                        >
                          <FiTrash2 />
                        </Button>
                        <MeetingCard meeting={meeting} />
                      </Box>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    Нет запланированных виртуальных встреч
                  </Alert>
                )}
              </Box>
            </TabPanel>
            <TabPanel>
              <MeetingSchedulerForm
                onSuccess={handleMeetingCreated}
                programSteps={mockSteps}
                users={mockUsers}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Диалог подтверждения удаления */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Удалить встречу
            </AlertDialogHeader>

            <AlertDialogBody>
              Вы уверены? Это действие нельзя отменить. Участники встречи
              получат уведомление об отмене.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Отмена
              </Button>
              <Button colorScheme="red" onClick={handleDeleteMeeting} ml={3}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default ManageMeetingsPage;
