// OnboardPro Design System - Theme Configuration
import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

// Конфигурация темы
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Расширенная тема
export const theme = extendTheme({
  config,
  // Цветовая палитра
  colors: {
    brand: {
      50: "#e6f7ff",
      100: "#b3e0ff",
      200: "#80cbff",
      300: "#4db6ff",
      400: "#1aa0ff",
      500: "#0088e6", // Основной цвет бренда
      600: "#006bb4",
      700: "#004e82",
      800: "#003050",
      900: "#00131f",
    },
    purple: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#6B46C1", // Вторичный цвет бренда
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
    },
    success: {
      50: "#f0fff4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#48BB78", // Основной цвет успеха
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    warning: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#ED8936", // Основной цвет предупреждения
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#E53E3E", // Основной цвет ошибки
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    info: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#4299E1", // Основной информационный цвет
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
  },

  // Типографика
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },

  // Размеры шрифта
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },

  // Веса шрифтов
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Система отступов
  space: {
    px: "1px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },

  // Радиусы границ
  radii: {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },

  // Тени
  shadows: {
    xs: "0 0 0 1px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    outline: "0 0 0 3px rgba(66, 153, 225, 0.6)",
    none: "none",
  },

  // Компонентные стили
  components: {
    // Стили Кнопок
    Button: {
      baseStyle: {
        fontWeight: "medium",
        borderRadius: "md",
        _focus: {
          boxShadow: "outline",
        },
      },
      sizes: {
        xs: {
          fontSize: "xs",
          px: 2,
          py: 1,
          height: "auto",
          minWidth: "auto",
        },
        sm: {
          fontSize: "sm",
          px: 3,
          py: 1.5,
        },
        md: {
          fontSize: "md",
          px: 4,
          py: 2,
        },
        lg: {
          fontSize: "lg",
          px: 6,
          py: 3,
        },
      },
      variants: {
        primary: {
          bg: "brand.500",
          color: "white",
          _hover: { bg: "brand.600" },
          _active: { bg: "brand.700" },
        },
        secondary: {
          bg: "purple.500",
          color: "white",
          _hover: { bg: "purple.600" },
          _active: { bg: "purple.700" },
        },
        tertiary: {
          bg: "transparent",
          color: "brand.500",
          border: "1px solid",
          borderColor: "brand.500",
          _hover: { bg: "brand.50" },
        },
        ghost: {
          color: "gray.600",
          _hover: { bg: "gray.100" },
        },
        link: {
          color: "brand.500",
          padding: 0,
          height: "auto",
          lineHeight: "normal",
          verticalAlign: "baseline",
          _hover: {
            textDecoration: "underline",
            color: "brand.600",
          },
        },
        danger: {
          bg: "error.500",
          color: "white",
          _hover: { bg: "error.600" },
          _active: { bg: "error.700" },
        },
        success: {
          bg: "success.500",
          color: "white",
          _hover: { bg: "success.600" },
          _active: { bg: "success.700" },
        },
      },
      defaultProps: {
        variant: "primary",
        size: "md",
      },
    },

    // Карточки
    Card: {
      parts: ["container", "header", "body", "footer"],
      baseStyle: {
        container: {
          borderRadius: "lg",
          boxShadow: "base",
          background: "white",
          overflow: "hidden",
          transition: "all 0.2s",
        },
        header: {
          padding: 6,
        },
        body: {
          padding: 6,
        },
        footer: {
          padding: 6,
        },
      },
      variants: {
        elevated: {
          container: {
            boxShadow: "lg",
          },
        },
        outline: {
          container: {
            boxShadow: "none",
            borderWidth: "1px",
            borderColor: "gray.200",
          },
        },
        filled: {
          container: {
            bg: "gray.50",
          },
        },
        unstyled: {
          container: {
            bg: "none",
            boxShadow: "none",
            borderRadius: "none",
          },
          header: {
            padding: 0,
          },
          body: {
            padding: 0,
          },
          footer: {
            padding: 0,
          },
        },
      },
      defaultProps: {
        variant: "outline",
      },
    },

    // Поля ввода
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: "gray.300",
            bg: "white",
            _hover: {
              borderColor: "gray.400",
            },
            _focus: {
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            },
          },
        },
        filled: {
          field: {
            bg: "gray.50",
            borderColor: "transparent",
            _hover: {
              bg: "gray.100",
            },
            _focus: {
              bg: "white",
              borderColor: "brand.500",
            },
          },
        },
      },
      defaultProps: {
        variant: "outline",
        size: "md",
      },
    },

    // Таблицы
    Table: {
      variants: {
        simple: {
          th: {
            borderBottom: "1px",
            borderColor: "gray.200",
            fontWeight: "semibold",
            padding: "3",
            fontSize: "sm",
            textTransform: "none",
          },
          td: {
            borderBottom: "1px",
            borderColor: "gray.100",
            padding: "3",
          },
          tbody: {
            tr: {
              _hover: {
                bg: "gray.50",
              },
            },
          },
        },
        striped: {
          th: {
            borderBottom: "1px",
            borderColor: "gray.200",
            fontWeight: "semibold",
            padding: "3",
            fontSize: "sm",
            textTransform: "none",
          },
          td: {
            borderBottom: "1px",
            borderColor: "gray.100",
            padding: "3",
          },
          tbody: {
            tr: {
              _odd: {
                bg: "gray.50",
              },
              _hover: {
                bg: "gray.100",
              },
            },
          },
        },
      },
      defaultProps: {
        variant: "simple",
        size: "md",
        colorScheme: "gray",
      },
    },

    // Бейджи
    Badge: {
      baseStyle: {
        textTransform: "none",
        fontWeight: "medium",
        borderRadius: "full",
      },
      variants: {
        solid: {
          bg: "gray.500",
          color: "white",
        },
        subtle: (props: { colorScheme: string }): Record<string, any> => ({
          bg: `${props.colorScheme}.100`,
          color: `${props.colorScheme}.800`,
        }),
        outline: (props: { colorScheme: string }): Record<string, any> => ({
          borderWidth: "1px",
          borderColor: `${props.colorScheme}.500`,
          color: `${props.colorScheme}.500`,
        }),
        status: {
          // Для статусов
          borderRadius: "full",
          px: 2,
          py: 1,
          fontSize: "xs",
        },
      },
    },

    // Вкладки
    Tabs: {
      variants: {
        line: {
          tab: {
            fontWeight: "medium",
            color: "gray.600",
            _selected: {
              color: "brand.500",
              borderColor: "brand.500",
            },
            _active: {
              bg: "gray.50",
            },
          },
        },
        enclosed: {
          tab: {
            fontWeight: "medium",
            _selected: {
              color: "brand.500",
              bg: "white",
            },
          },
        },
        "soft-rounded": {
          tab: {
            borderRadius: "full",
            fontWeight: "medium",
            color: "gray.600",
            _selected: {
              color: "white",
              bg: "brand.500",
            },
          },
        },
        "solid-rounded": {
          tab: {
            borderRadius: "full",
            fontWeight: "medium",
            color: "gray.600",
            _selected: {
              color: "white",
              bg: "brand.500",
            },
          },
        },
      },
    },

    // Хлебные крошки
    Breadcrumb: {
      baseStyle: {
        link: {
          color: "gray.500",
          fontWeight: "medium",
          _hover: {
            textDecoration: "none",
            color: "brand.500",
          },
        },
      },
    },

    // Оповещения
    Alert: {
      baseStyle: {
        container: {
          borderRadius: "md",
        },
      },
    },

    // Формы
    Form: {
      baseStyle: {
        helperText: {
          color: "gray.500",
          mt: 1,
          fontSize: "sm",
        },
        errorMessage: {
          color: "error.500",
          mt: 1,
          fontSize: "sm",
        },
      },
    },
  },

  // Глобальные стили
  styles: {
    global: (props: Record<string, any>): Record<string, any> => ({
      body: {
        bg: mode("gray.50", "gray.900")(props),
        color: mode("gray.800", "white")(props),
      },
      // Другие глобальные стили
      "*, *::before, *::after": {
        borderColor: mode("gray.200", "gray.700")(props),
      },
      // Стили для плавного скроллинга
      html: {
        scrollBehavior: "smooth",
      },
      // Улучшение отображения фокуса для клавиатурной навигации
      ":focus-visible": {
        outline: `2px solid ${mode("brand.500", "brand.400")(props)}`,
        outlineOffset: "2px",
      },
    }),
  },
});
