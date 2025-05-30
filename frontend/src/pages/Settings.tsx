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
import { PageHeader } from "../components/layout/PageHeader";

const SettingsPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Настройки"
        subtitle="Управление персональными настройками и предпочтениями"
      />
      <VStack spacing={8} align="stretch">
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
    </>
  );
};

export default SettingsPage;
