import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      50: "#e6f7ff",
      100: "#b3e0ff",
      200: "#80cbff",
      300: "#4db6ff",
      400: "#1aa0ff",
      500: "#0088e6",
      600: "#006bb4",
      700: "#004e82",
      800: "#003050",
      900: "#00131f",
    },
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
});
