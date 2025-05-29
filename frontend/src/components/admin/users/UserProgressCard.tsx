import { FC } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  styled,
  Tooltip,
} from "@mui/material";
import {
  Verified,
  Warning,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  Badge,
  School,
} from "@mui/icons-material";
import { UserAnalytics } from "../../../types/userAnalytics";
import { UserRole } from "../../../types/user";

interface UserProgressCardProps {
  analytics: UserAnalytics;
}

const StyledProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
}));

const StyledRiskIndicator = styled(Box)<{ risk: number }>(
  ({ theme, risk }) => ({
    display: "flex",
    alignItems: "center",
    color:
      risk > 70
        ? theme.palette.error.main
        : risk > 40
        ? theme.palette.warning.main
        : theme.palette.success.main,
  })
);

const UserProgressCard: FC<UserProgressCardProps> = ({ analytics }) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Администратор";
      case UserRole.HR:
        return "HR-менеджер";
      case UserRole.MANAGER:
        return "Руководитель";
      case UserRole.EMPLOYEE:
        return "Сотрудник";
      default:
        return role;
    }
  };

  // Расчет процента прогресса, чтобы избежать ошибок
  const progressPercent = analytics.onboarding_progress?.progress || 0;
  const completedDate = analytics.onboarding_progress?.completed_date
    ? new Date(
        analytics.onboarding_progress.completed_date
      ).toLocaleDateString()
    : null;

  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            src={analytics.avatar}
            alt={`${analytics.first_name} ${analytics.last_name}`}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {analytics.first_name} {analytics.last_name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Chip
                label={getRoleLabel(analytics.role)}
                size="small"
                color="primary"
              />
              <Typography variant="body2" color="textSecondary">
                {analytics.position || "Позиция не указана"}
              </Typography>
              {analytics.department && (
                <Typography variant="body2" color="textSecondary">
                  · {analytics.department.name}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Прогресс онбординга
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ width: "100%", mr: 1 }}>
                <StyledProgressBar
                  variant="determinate"
                  value={progressPercent}
                  color={progressPercent === 100 ? "success" : "primary"}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="textSecondary">
                  {Math.round(progressPercent)}%
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
            >
              <Typography variant="caption" color="textSecondary">
                {analytics.completed_steps_count} из{" "}
                {analytics.total_steps_count} шагов выполнено
              </Typography>
              {completedDate && (
                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Verified fontSize="small" sx={{ mr: 0.5 }} /> Завершено{" "}
                  {completedDate}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Tooltip title="Средний балл тестирования">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <School color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Тесты:{" "}
                  {analytics.avg_test_score
                    ? `${Math.round(analytics.avg_test_score)}%`
                    : "Нет данных"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Tooltip title="Количество полученных отзывов">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Badge color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Отзывы: {analytics.feedback_count || 0}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Tooltip title="Дата последней активности">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarToday color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Активность:{" "}
                  {analytics.last_activity
                    ? new Date(analytics.last_activity).toLocaleDateString()
                    : "Нет данных"}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledRiskIndicator risk={analytics.risk_score}>
              <Warning sx={{ mr: 1 }} />
              <Typography variant="body2">
                Риск ухода: {Math.round(analytics.risk_score)}%
              </Typography>
            </StyledRiskIndicator>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color:
                  analytics.engagement_score > 70
                    ? "success.main"
                    : analytics.engagement_score > 40
                    ? "warning.main"
                    : "error.main",
              }}
            >
              {analytics.engagement_score > 50 ? (
                <TrendingUp sx={{ mr: 1 }} />
              ) : (
                <TrendingDown sx={{ mr: 1 }} />
              )}
              <Typography variant="body2">
                Вовлеченность: {Math.round(analytics.engagement_score)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default UserProgressCard;
