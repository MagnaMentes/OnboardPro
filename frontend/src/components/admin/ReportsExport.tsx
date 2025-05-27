import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  useToast,
  HStack,
  VStack,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import reportsApi from "../../api/reportsApi";

// Хелпер для скачивания файла
const downloadFile = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const ReportsExport: React.FC = () => {
  const toast = useToast();
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);

  // Обработчик скачивания PDF отчета
  const handleDownloadPdf = async () => {
    try {
      setIsLoadingPdf(true);
      const data = await reportsApi.getAssignmentsPdfReport();
      downloadFile(data, "onboarding_assignments_report.pdf");
      toast({
        title: "Отчет успешно скачан",
        description: "PDF отчет по назначениям программ онбординга скачан",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Ошибка при скачивании PDF отчета:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать PDF отчет. Попробуйте позже.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Обработчик скачивания CSV отчета
  const handleDownloadCsv = async () => {
    try {
      setIsLoadingCsv(true);
      const data = await reportsApi.getAssignmentsCsvReport();
      downloadFile(data, "onboarding_assignments_report.csv");
      toast({
        title: "Отчет успешно скачан",
        description: "CSV отчет по назначениям программ онбординга скачан",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Ошибка при скачивании CSV отчета:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать CSV отчет. Попробуйте позже.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoadingCsv(false);
    }
  };

  return (
    <Card boxShadow="lg" borderRadius="lg" overflow="hidden" width="100%">
      <CardHeader bg="blue.600" color="white">
        <Heading size="md">Экспорт отчетов</Heading>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Text>
            Экспорт данных о назначениях программ онбординга и прогрессе
            сотрудников
          </Text>
          <HStack spacing={4} mt={2} justifyContent="center">
            <Tooltip label="Скачать отчет в формате PDF">
              <Button
                colorScheme="blue"
                leftIcon={<DownloadIcon />}
                onClick={handleDownloadPdf}
                isLoading={isLoadingPdf}
                loadingText="Загрузка..."
              >
                Скачать PDF
              </Button>
            </Tooltip>
            <Tooltip label="Скачать отчет в формате CSV">
              <Button
                colorScheme="green"
                leftIcon={<DownloadIcon />}
                onClick={handleDownloadCsv}
                isLoading={isLoadingCsv}
                loadingText="Загрузка..."
                variant="outline"
              >
                Скачать CSV
              </Button>
            </Tooltip>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ReportsExport;
