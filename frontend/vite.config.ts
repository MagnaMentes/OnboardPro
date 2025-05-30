import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: "0.0.0.0",
      port: 5173,
      clientPort: 5173,
      protocol: "ws",
    },
    watch: {
      usePolling: true, // Использование polling для обнаружения изменений файлов
      interval: 100, // Более частая проверка для быстрого отклика
    },
    proxy: {
      "/api": {
        // Используем разные имена для запросов внутри Docker с именем контейнера
        target:
          process.env.DOCKER_ENV === "true"
            ? "http://onboardpro-backend:8000"
            : "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path, // Сохраняем полные пути без изменений
        // Добавляем отладочную информацию для каждого запроса
        onProxyReq: (proxyReq, req) => {
          console.log(
            `Прокси запрос на: ${req.method} ${req.url} -> ${proxyReq.path}`
          );
        },
        // Не удаляем префикс /api, так как он используется на бэкенде
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
            // Не меняем заголовок Host, чтобы избежать конфликтов с CORS
            console.log("Original Host header:", req.headers.host);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
});
