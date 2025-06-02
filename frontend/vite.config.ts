import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path"; // Добавляем import path

export default ({ mode }: { mode: string }) => {
  // Загружаем env-переменные
  const env = loadEnv(mode, process.cwd(), "");
  const apiPrefix = env.VITE_API_PREFIX || "/api";
  const apiUrl = env.VITE_API_URL || "http://localhost:8000";

  // Определяем хост прокси в зависимости от среды
  const useDocker =
    process.env.DOCKER_ENV === "true" || env.VITE_DOCKER_ENV === "true";

  // В Docker-среде используем имя сервиса как хост
  let proxyTarget = useDocker ? "http://backend:8000" : apiUrl;

  // Для локальной разработки убедимся, что proxyTarget корректный
  if (!useDocker && !proxyTarget.startsWith("http")) {
    proxyTarget = `http://${proxyTarget}`;
  }

  // Для большей диагностики запишем конфигурацию в файл
  const configInfo = {
    mode,
    env: {
      VITE_API_URL: env.VITE_API_URL,
      VITE_API_PREFIX: env.VITE_API_PREFIX,
      VITE_DOCKER_ENV: env.VITE_DOCKER_ENV,
    },
    process_env: {
      DOCKER_ENV: process.env.DOCKER_ENV,
    },
    useDocker,
    apiUrl,
    apiPrefix,
    proxyTarget,
  };

  try {
    // Пытаемся записать отладочную информацию в файл
    fs.writeFileSync(
      "./vite-config-debug.json",
      JSON.stringify(configInfo, null, 2)
    );
  } catch (error) {
    console.error("Не удалось записать файл отладки:", error);
  }

  console.log(
    `Vite proxy configuration: ${apiPrefix} -> ${proxyTarget} (Docker: ${useDocker})`
  );

  return defineConfig({
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      cors: true, // Разрешаем CORS
      hmr: {
        protocol: "ws",
        host: "0.0.0.0",
        port: 24678,
      },
      proxy: {
        [apiPrefix]: {
          target: proxyTarget,
          changeOrigin: true,
          timeout: 120000, // 2 минуты
          secure: false,
          ws: true, // Поддерживаем WebSockets
          // Логируем детали запросов для отладки
          configure: (proxy, _options) => {
            proxy.on("error", (err, req, res) => {
              console.log("Proxy error:", err);
              console.log("Request path:", req.url);
              console.log("Request headers:", req.headers);
              // Отправляем ответ 502 Bad Gateway, чтобы предотвратить зависание страницы
              if (!res.headersSent) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "Proxy Error", message: err.message })
                );
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "Proxy request:",
                req.method,
                req.url,
                "→",
                proxyReq.host + proxyReq.path
              );
              console.log("Request headers:", req.headers);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              const statusCode = proxyRes.statusCode || 0;
              const statusClass = Math.floor(statusCode / 100);
              if (statusClass === 4 || statusClass === 5) {
                console.log("Proxy error response:", statusCode, req.url);
                console.log("Response headers:", proxyRes.headers);
              } else {
                console.log("Proxy success response:", statusCode, req.url);
              }
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Делаем переменные окружения доступными в коде клиента
      "import.meta.env.VITE_DOCKER_ENV": JSON.stringify(
        useDocker ? "true" : "false"
      ),
    },
  });
};
