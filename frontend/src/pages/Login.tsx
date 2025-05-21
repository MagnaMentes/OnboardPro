import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authApi from "../api/auth";
import { useAuthStore } from "../store/authStore";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.error(
          "Произошла ошибка при входе. Пожалуйста, попробуйте снова."
        );
      }
    } catch (err) {
      let errorMessage = "Ошибка при входе. Проверьте учетные данные.";

      if (axios.isAxiosError(err)) {
        // Если ошибка 400, значит неверные учетные данные
        if (err.response?.status === 400) {
          errorMessage =
            "Неверный email или пароль. Пожалуйста, попробуйте снова.";
        } else if (err.response?.status === 401) {
          errorMessage =
            "Неверный email или пароль. Пожалуйста, попробуйте снова.";
        } else if (err.response?.status === 429) {
          errorMessage =
            "Слишком много попыток входа. Пожалуйста, попробуйте позже.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxW="lg"
      py={{ base: "12", md: "24" }}
      px={{ base: "0", sm: "8" }}
    >
      <VStack spacing="8">
        <Heading size="xl">OnboardPro</Heading>
        <Text>Современная платформа для онбординга сотрудников</Text>

        <Box
          py="8"
          px={{ base: "4", sm: "10" }}
          bg="white"
          boxShadow="lg"
          borderRadius="xl"
          w="full"
        >
          <form onSubmit={handleLogin}>
            <VStack spacing="6">
              <FormControl isRequired>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="password">Пароль</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
              >
                Войти
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}

export default Login;
