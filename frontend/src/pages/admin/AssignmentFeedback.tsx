import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import feedbackApi, { AssignmentFeedback } from "../../api/feedback";
import FeedbackList from "../../components/feedback/FeedbackList";

const AssignmentFeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [feedbackData, setFeedbackData] = useState<AssignmentFeedback | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await feedbackApi.getAssignmentFeedback(parseInt(id, 10));
        setFeedbackData(data);
      } catch (error) {
        console.error("Error fetching feedback data:", error);
        toast({
          title: "Ошибка загрузки данных",
          description: "Не удалось загрузить данные по отзывам",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackData();
  }, [id, toast]);

  return (
    <Container maxW="container.xl" py={6}>
      <Breadcrumb mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate("/admin/analytics")}>
            Аналитика
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Отзывы по назначению</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex align="center" mb={6}>
        <Button
          leftIcon={<Icon as={FiArrowLeft} />}
          variant="outline"
          onClick={() => navigate(-1)}
          mr={4}
        >
          Назад
        </Button>
        <Box>
          <Heading as="h1" size="lg">
            Отзывы по назначению
          </Heading>
          {feedbackData && (
            <Text color="gray.500">
              Программа: {feedbackData.program_name} | Сотрудник:{" "}
              {feedbackData.user_email}
            </Text>
          )}
        </Box>
      </Flex>

      <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
        <Tabs isLazy>
          <TabList>
            <Tab>Отзывы по шагам</Tab>
            <Tab>Записи о настроении</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <FeedbackList
                feedbacks={feedbackData?.step_feedbacks || []}
                isLoading={isLoading}
              />
            </TabPanel>
            <TabPanel>
              <Text>Функционал записей о настроении будет добавлен позже.</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default AssignmentFeedbackPage;
