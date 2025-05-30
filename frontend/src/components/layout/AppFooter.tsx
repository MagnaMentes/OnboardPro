import React from "react";
import { Box, Text } from "@chakra-ui/react";

const AppFooter: React.FC = () => {
  return (
    <Box
      as="footer"
      py={4}
      px={8}
      bg="gray.100"
      textAlign="center"
      position="sticky"
      bottom="0"
      zIndex="sticky"
    >
      <Text fontSize="sm" color="gray.600">
        created by magna_mentes
      </Text>
    </Box>
  );
};

export default AppFooter;
