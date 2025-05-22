import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react";
import { StepFeedback } from "../../api/feedback";
import FeedbackList from "../../components/feedback/FeedbackList";

// Моковые данные для демонстрации функционала
const mockFeedbacks: StepFeedback[] = [
  {
    id: 1,
    user_email: "user1@example.com",
    step_name: "Знакомство с командой",
    comment: "Отличное знакомство! Все было понятно и интересно.",
    auto_tag: "positive",
    auto_tag_display: "Позитивный",
    sentiment_score: 0.8,
    created_at: "2025-05-20T10:30:00Z",
  },
  {
    id: 2,
    user_email: "user2@example.com",
    step_name: "Настройка рабочего места",
    comment: "Было сложно разобраться с инструкциями по настройке VPN.",
    auto_tag: "unclear_instruction",
    auto_tag_display: "Неясная инструкция",
    sentiment_score: -0.3,
    created_at: "2025-05-19T15:20:00Z",
  },
  {
    id: 3,
    user_email: "user3@example.com",
    step_name: "Изучение корпоративной культуры",
    comment: "Не успеваю пройти все материалы вовремя, нужно больше дней.",
    auto_tag: "delay_warning",
    auto_tag_display: "Предупреждение о задержке",
    sentiment_score: -0.4,
    created_at: "2025-05-18T09:45:00Z",
  },
  {
    id: 4,
    user_email: "user1@example.com",
    step_name: "Обучение по продукту",
    comment: "Нормальное обучение, но можно было сделать более интерактивным.",
    auto_tag: "neutral",
    auto_tag_display: "Нейтральный",
    sentiment_score: 0.1,
    created_at: "2025-05-17T14:15:00Z",
  },
];

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<StepFeedback[]>(mockFeedbacks);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="lg" mb={6}>
        Smart Feedback Loop - Отзывы
      </Heading>

      <Grid templateColumns={{ base: "1fr", lg: "250px 1fr" }} gap={6}>
        <GridItem>
          <Card>
            <CardHeader>
              <Heading size="md">Фильтры</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={2}>Сортировка по меткам:</Text>
              <Select mb={4}>
                <option value="all">Все метки</option>
                <option value="positive">Позитивные</option>
                <option value="negative">Негативные</option>
                <option value="unclear_instruction">Неясные инструкции</option>
                <option value="delay_warning">Задержки</option>
                <option value="neutral">Нейтральные</option>
              </Select>

              <Text mb={2}>Сортировка по оценке:</Text>
              <Select>
                <option value="all">Все оценки</option>
                <option value="high">Высокая (0.6-1)</option>
                <option value="medium">Средняя (0.2-0.6)</option>
                <option value="low">Низкая (-0.2-0.2)</option>
                <option value="negative">Негативная (-1-(-0.2))</option>
              </Select>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardHeader>
              <Heading size="md">Отзывы сотрудников</Heading>
            </CardHeader>
            <CardBody>
              <FeedbackList feedbacks={feedbacks} isLoading={isLoading} />
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default FeedbackPage;
