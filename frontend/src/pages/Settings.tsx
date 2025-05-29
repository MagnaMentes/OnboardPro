import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { AppLayout } from "../components/layout/AppLayout";

const SettingsPage: React.FC = () => {
  return (
    <AppLayout>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2} color="brand.700">
            Настройки
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Управление персональными настройками и предпочтениями
          </Text>
        </Box>

        <VStack align="stretch" spacing={6}>
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="dark-mode-toggle" mb="0">
              Темная тема
            </FormLabel>
            <Switch id="dark-mode-toggle" />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="email-notifications-toggle" mb="0">
              Email уведомления
            </FormLabel>
            <Switch id="email-notifications-toggle" defaultChecked />
          </FormControl>
        </VStack>
      </VStack>
    </AppLayout>
  );
};

export default SettingsPage;
