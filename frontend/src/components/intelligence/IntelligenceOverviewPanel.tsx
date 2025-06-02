import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { Alert, AlertTitle } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IntelligenceDashboardOverview } from "../../types/intelligence";
import { getIntelligenceDashboardOverview } from "../../api/intelligenceApi";

// Цвета для графиков
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const RISK_COLORS = {
  high: "#f44336",
  medium: "#ff9800",
  low: "#4caf50",
};

const IntelligenceOverviewPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] =
    useState<IntelligenceDashboardOverview | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getIntelligenceDashboardOverview();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(
          "Не удалось загрузить данные дашборда. Попробуйте обновить страницу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Ошибка</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="warning">
        <AlertTitle>Нет данных</AlertTitle>
        Данные дашборда недоступны. Попробуйте обновить страницу или проверьте
        настройки.
      </Alert>
    );
  }

  // Подготавливаем данные для графиков
  const departmentProgressData = dashboardData.department_progress || [];
  const riskDistributionData = dashboardData.risk_distribution || [];
  const anomalyDistributionData = dashboardData.anomaly_distribution || [];

  return (
    <Container maxWidth="xl">
      <Box mt={3} mb={5}>
        <Typography variant="h4" gutterBottom>
          AI Onboarding Intelligence Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" mb={4}>
          Аналитика, риски и инсайты об онбординге сотрудников
        </Typography>

        {/* Общий обзор */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Пользователей
                </Typography>
                <Typography variant="h4">
                  {dashboardData.summary.total_users}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Активные онбординги
                </Typography>
                <Typography variant="h4">
                  {dashboardData.summary.active_onboardings}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Средний прогресс
                </Typography>
                <Typography variant="h4">
                  {dashboardData.summary.avg_progress.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: theme.palette.error.light }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="white">
                  Высокие риски
                </Typography>
                <Typography variant="h4" color="white">
                  {dashboardData.summary.high_risks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: theme.palette.warning.light }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="white">
                  Активные аномалии
                </Typography>
                <Typography variant="h4" color="white">
                  {dashboardData.summary.active_anomalies}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4} mb={4}>
          {/* Графики */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Прогресс по департаментам
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={departmentProgressData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <XAxis
                    dataKey="department__name"
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Прогресс"]} />
                  <Bar
                    dataKey="completion_percentage"
                    name="Прогресс"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Распределение рисков
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  height: 300,
                }}
              >
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="risk_type"
                      label={(entry) => entry.risk_type}
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} шт.`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box>
                  {riskDistributionData.map((entry, index) => (
                    <Box
                      key={index}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: COLORS[index % COLORS.length],
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2">
                        {entry.risk_type} ({entry.count})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Департаменты с высоким риском */}
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Департаменты с высоким риском
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.departments_at_risk.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{dept.department_name}</Typography>
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">Фактор риска:</Typography>
                        <Typography
                          variant="body2"
                          color={
                            dept.risk_factor > 0.6
                              ? "error"
                              : dept.risk_factor > 0.3
                              ? "warning.main"
                              : "success.main"
                          }
                          fontWeight="bold"
                        >
                          {(dept.risk_factor * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Активные онбординги:
                        </Typography>
                        <Typography variant="body2">
                          {dept.active_onboardings}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">
                          Средний прогресс:
                        </Typography>
                        <Typography variant="body2">
                          {dept.avg_completion_percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Подробнее
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Последние обнаруженные аномалии */}
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Последние обнаруженные аномалии
          </Typography>
          {dashboardData.recent_anomalies.map((anomaly) => (
            <Paper key={anomaly.id} sx={{ p: 2, mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {anomaly.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {anomaly.user_full_name} ({anomaly.user_email})
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {anomaly.department_name || "Нет отдела"} •{" "}
                    {anomaly.program_name}
                  </Typography>
                </Box>
                <Button variant="contained" color="primary" size="small">
                  Решить
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Обнаружено: {new Date(anomaly.detected_at).toLocaleString()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: theme.palette.warning.light,
                    color: theme.palette.warning.contrastText,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {anomaly.anomaly_type_display}
                </Typography>
              </Box>
            </Paper>
          ))}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button variant="outlined">Показать все аномалии</Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default IntelligenceOverviewPanel;
