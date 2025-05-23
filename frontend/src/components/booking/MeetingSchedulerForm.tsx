import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  VStack,
  Heading,
  useToast,
  Text,
} from "@chakra-ui/react";
import bookingApi from "../../api/bookingApi";
import { useForm } from "react-hook-form";
import { OnboardingStep, User } from "../../types/apiTypes";

interface MeetingSchedulerFormProps {
  onSuccess?: () => void;
  programSteps?: OnboardingStep[];
  users?: User[];
}

interface FormValues {
  step: number;
  assigned_user: number;
  start_time: string;
  end_time: string;
  meeting_link: string;
}

/**
 * Компонент формы для создания виртуального слота встречи
 * Доступен только для HR и Admin
 */
const MeetingSchedulerForm: React.FC<MeetingSchedulerFormProps> = ({
  onSuccess,
  programSteps = [],
  users = [],
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [filteredSteps, setFilteredSteps] = useState<OnboardingStep[]>([]);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      meeting_link: "",
    },
  });

  // Фильтруем только шаги с поддержкой виртуальных встреч
  useEffect(() => {
    setFilteredSteps(programSteps.filter((step) => step.is_virtual_meeting));
  }, [programSteps]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      await bookingApi.createMeeting(values);

      toast({
        title: "Встреча создана",
        description: "Виртуальная встреча успешно запланирована",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Ошибка при создании встречи:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось создать встречу",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем наличие доступных шагов для встреч
  if (filteredSteps.length === 0) {
    return (
      <Box bg="white" p={5} borderRadius="lg" shadow="md">
        <Heading size="md" mb={4}>
          Планирование виртуальных встреч
        </Heading>
        <Text>
          Нет доступных шагов с поддержкой виртуальных встреч. Создайте шаг
          онбординга с флагом "Виртуальная встреча".
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="white" p={5} borderRadius="lg" shadow="md">
      <Heading size="md" mb={4}>
        Планирование виртуальных встреч
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.step} isRequired>
            <FormLabel>Шаг онбординга</FormLabel>
            <Select
              placeholder="Выберите шаг онбординга"
              {...register("step", { required: "Выберите шаг онбординга" })}
            >
              {filteredSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.name}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.step?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.assigned_user} isRequired>
            <FormLabel>Участник</FormLabel>
            <Select
              placeholder="Выберите участника"
              {...register("assigned_user", { required: "Выберите участника" })}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email} ({user.full_name})
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.assigned_user?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.start_time} isRequired>
            <FormLabel>Дата и время начала</FormLabel>
            <Input
              type="datetime-local"
              {...register("start_time", {
                required: "Укажите время начала встречи",
              })}
            />
            <FormErrorMessage>{errors.start_time?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.end_time} isRequired>
            <FormLabel>Дата и время окончания</FormLabel>
            <Input
              type="datetime-local"
              {...register("end_time", {
                required: "Укажите время окончания встречи",
              })}
            />
            <FormErrorMessage>{errors.end_time?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.meeting_link}>
            <FormLabel>Ссылка на встречу (опционально)</FormLabel>
            <Input
              type="url"
              placeholder="https://meet.example.com/room-id"
              {...register("meeting_link")}
            />
            <FormErrorMessage>{errors.meeting_link?.message}</FormErrorMessage>
          </FormControl>

          <Button
            mt={4}
            colorScheme="purple"
            type="submit"
            isLoading={isLoading}
          >
            Создать встречу
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default MeetingSchedulerForm;
