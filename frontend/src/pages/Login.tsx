import {
  Box,
  Heading,
  Text,
  VStack,
  Image,
  Checkbox,
  Link,
  Flex,
  Grid,
  GridItem,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authApi from "../api/auth";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { FiMail, FiLock, FiCheckCircle } from "react-icons/fi";
import { Button, Input, Alert, Form } from "../components/common";
import { spacing, margins, positioning } from "../theme/designTokens";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Если пользователь уже аутентифицирован, перенаправляем на dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      // Отправляем запрос на сервер для получения токенов
      const { access, refresh, user } = await authApi.login({
        email,
        password,
      });

      // Сохраняем токены и данные пользователя
      if (access && refresh && user) {
        login(access, refresh, user);
        toast.success("Вход выполнен успешно!");
        navigate("/dashboard");
      } else {
        setErrorMsg(
          "Произошла ошибка при входе. Пожалуйста, попробуйте снова."
        );
      }
    } catch (err) {
      let errorMessage = "Ошибка при входе. Проверьте учетные данные.";

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400 || err.response?.status === 401) {
          errorMessage =
            "Неверный email или пароль. Пожалуйста, попробуйте снова.";
        } else if (err.response?.status === 429) {
          errorMessage =
            "Слишком много попыток входа. Пожалуйста, попробуйте позже.";
        }
      }

      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex // Changed from Box to Flex
      position="relative"
      minHeight="100vh"
      width="100%" // Ensure Flex takes full width
      bgGradient="linear(to-br, brand.50, brand.100)"
      alignItems="center" // Center Grid vertically
      justifyContent="center" // Center Grid horizontally
      py={{ base: spacing.lg, md: spacing.xl }}
      // Add global padding here if needed, instead of on Grid/GridItem for centering purposes
      // px={{ base: spacing.md, md: spacing.lg }}
    >
      <Grid
        templateColumns={{
          base: "1fr",
          // md: "minmax(0, 450px) minmax(0, 480px)", // Let's try to make columns more balanced or rely on content width
          md: "1fr 1fr", // Simpler equal columns for testing centering
        }}
        w="full" // Grid will take full width of its content or maxW
        // maxW="container.xl" // Temporarily remove or adjust to see effect on centering
        maxW={{ base: "full", md: "calc(450px + 480px + 4rem)" }} // Approximate width of two columns + gap
        gap={{ base: spacing.lg, md: spacing.xl }} // Standard gap
        // px={{ base: spacing.md, md: spacing.lg }} // Removed padding from Grid
      >
        {/* Левая колонка: Информационный блок */}
        <GridItem
          display={{ base: "none", md: "flex" }}
          flexDirection="column"
          justifyContent="center"
          alignItems="center" // Center the VStack
          // px={spacing.xl} // Removed padding
          py={{ base: spacing.lg, md: spacing.xl }}
        >
          <VStack
            spacing={spacing.lg}
            align="flex-start"
            color="gray.700"
            // maxW={{ base: "full", sm: "80%", md: "450px" }} // Let VStack determine its own max width based on parent
            w="full" // Ensure VStack takes full width of GridItem
            // px={spacing.xl} // Old padding
            pl={0} // Set left padding to 0
            pr={spacing.xl} // Keep right padding as spacing.xl
          >
            <Heading as="h1" size="3xl" mb={spacing.sm} color="gray.600">
              OnboardPro
            </Heading>
            <Text
              fontSize="lg"
              color="gray.600"
              lineHeight="1.7"
              mb={spacing.lg}
            >
              Онбординг сотрудников стал проще с нашей платформой
            </Text>
            <List spacing={spacing.sm} fontSize="md" styleType="none" w="full">
              <ListItem display="flex" alignItems="center" py={spacing.xs}>
                <ListIcon
                  as={FiCheckCircle}
                  color="green.500" // Darker green for better contrast
                  mr={spacing.sm}
                  boxSize={5}
                />
                Снижение времени адаптации на 40%
              </ListItem>
              <ListItem display="flex" alignItems="center" py={spacing.xs}>
                <ListIcon
                  as={FiCheckCircle}
                  color="green.500" // Darker green
                  mr={spacing.sm}
                  boxSize={5}
                />
                Персонализированные программы для каждого сотрудника
              </ListItem>
              <ListItem display="flex" alignItems="center" py={spacing.xs}>
                <ListIcon
                  as={FiCheckCircle}
                  color="green.500" // Darker green
                  mr={spacing.sm}
                  boxSize={5}
                />
                Полная автоматизация HR-процессов
              </ListItem>
            </List>
          </VStack>
        </GridItem>

        {/* Правая колонка: Форма входа */}
        <GridItem
          display="flex" // Use flex to center content
          flexDirection="column" // Stack children vertically
          alignItems="center" // Center horizontally
          justifyContent="center" // Center vertically
          py={{ base: spacing.lg, md: spacing.xl }}
          // Removed {...positioning.center} as we are using Flexbox properties
        >
          <VStack
            spacing={spacing.lg}
            w="full"
            maxW="480px" // Max width for the form itself
            // px={{ base: spacing.md, md: 0 }} // Removed padding, will be handled by parent or Form component
          >
            {/* <Box w="180px" h="60px" mb={spacing.lg}>
              <Image
                src="/logo.png"
                alt="OnboardPro Logo"
                fallbackSrc="https://via.placeholder.com/180x60?text=OnboardPro"
              />
            </Box> */}

            <Box width="100%">
              <Form
                borderRadius="xl"
                boxShadow="xl"
                width="100%"
                title="Добро пожаловать"
                subtitle="Система для эффективного онбординга"
                onSubmit={handleLogin}
                submitButton={{
                  text: "Войти",
                  isLoading: isLoading,
                  isFullWidth: true, // Set button to full width
                }}
              >
                {errorMsg && (
                  <Alert
                    status="error"
                    title="Ошибка"
                    description={errorMsg}
                    onClose={() => setErrorMsg("")}
                  />
                )}

                <VStack
                  spacing={spacing.md}
                  align="stretch"
                  // pl={{ base: 0, md: spacing.md }} // Удалено для выравнивания с заголовком формы
                  // pr={spacing.md}                 // Удалено для выравнивания с заголовком формы
                >
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    isRequired
                    leftElement={<FiMail />}
                    autoComplete="username"
                  />

                  <Input
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    isRequired
                    leftElement={<FiLock />}
                    autoComplete="current-password"
                  />

                  <Flex
                    {...positioning.spaceBetween}
                    align="center"
                    mt={margins.sm}
                  >
                    <Checkbox
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      colorScheme="brand"
                      size="sm"
                    >
                      Запомнить меня
                    </Checkbox>

                    <Link
                      fontSize="sm"
                      color="brand.600"
                      href="#"
                      fontWeight="medium"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Забыли пароль?
                    </Link>
                  </Flex>
                </VStack>
              </Form>
            </Box>

            {/* <Text fontSize="sm" color="gray.500" mt={spacing.lg}>
              © created by magna_mentes 2025 OnboardPro. Все права защищены.
            </Text> */}
          </VStack>
        </GridItem>
      </Grid>
    </Flex>
  );
}

export default Login;
