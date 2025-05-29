import { FC, useState, SyntheticEvent } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Chip,
  Paper,
  useTheme,
} from "@mui/material";
import {
  InsertChart,
  Psychology,
  Description,
  EmojiEvents,
  Insights,
  Extension,
  AccountCircle,
} from "@mui/icons-material";
import { UserAnalytics } from "../../../types/userAnalytics";

interface UserAnalyticsTabsProps {
  analytics: UserAnalytics;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    "aria-controls": `analytics-tabpanel-${index}`,
  };
}

const UserAnalyticsTabs: FC<UserAnalyticsTabsProps> = ({ analytics }) => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="user analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InsertChart />} label="Прогресс" {...a11yProps(0)} />
          <Tab icon={<Description />} label="Тесты" {...a11yProps(1)} />
          <Tab icon={<Psychology />} label="Фидбек" {...a11yProps(2)} />
          <Tab icon={<Insights />} label="AI-инсайты" {...a11yProps(3)} />
          <Tab icon={<EmojiEvents />} label="Геймификация" {...a11yProps(4)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Шаги онбординга
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Завершено {analytics.completed_steps_count} из{" "}
                  {analytics.total_steps_count} шагов
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    analytics.total_steps_count > 0
                      ? (analytics.completed_steps_count /
                          analytics.total_steps_count) *
                        100
                      : 0
                  }
                  sx={{ mt: 1, height: 10, borderRadius: 5 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Временные показатели
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Дата начала:
                  </Typography>
                  <Typography variant="body1">
                    {analytics.onboarding_progress?.start_date
                      ? new Date(
                          analytics.onboarding_progress.start_date
                        ).toLocaleDateString()
                      : "Не начат"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Плановая дата завершения:
                  </Typography>
                  <Typography variant="body1">
                    {analytics.onboarding_progress?.estimated_end_date
                      ? new Date(
                          analytics.onboarding_progress.estimated_end_date
                        ).toLocaleDateString()
                      : "Не определена"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Анализ вовлеченности</Typography>
                <Chip
                  label={
                    analytics.risk_score > 70
                      ? "Высокий риск"
                      : analytics.risk_score > 40
                      ? "Средний риск"
                      : "Низкий риск"
                  }
                  color={
                    analytics.risk_score > 70
                      ? "error"
                      : analytics.risk_score > 40
                      ? "warning"
                      : "success"
                  }
                />
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AccountCircle
                      color={
                        analytics.engagement_score > 50 ? "success" : "error"
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Вовлеченность"
                    secondary={`${Math.round(analytics.engagement_score)}% - ${
                      analytics.engagement_score > 70
                        ? "Высокая"
                        : analytics.engagement_score > 40
                        ? "Средняя"
                        : "Низкая"
                    }`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Extension
                      color={
                        analytics.avg_test_score > 80
                          ? "success"
                          : analytics.avg_test_score > 60
                          ? "primary"
                          : "error"
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Усвоение материала"
                    secondary={`${Math.round(analytics.avg_test_score)}% - ${
                      analytics.avg_test_score > 80
                        ? "Отличное"
                        : analytics.avg_test_score > 60
                        ? "Хорошее"
                        : "Требует внимания"
                    }`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Psychology
                      color={
                        analytics.feedback_count > 0 ? "primary" : "action"
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Обратная связь"
                    secondary={`${analytics.feedback_count} отзывов получено`}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2}>
          <List>
            {analytics.test_results && analytics.test_results.length > 0 ? (
              analytics.test_results.map((test) => (
                <ListItem key={test.id} divider>
                  <ListItemText
                    primary={test.test_name}
                    secondary={`Попытка: ${test.attempt} | Дата: ${new Date(
                      test.completion_date
                    ).toLocaleDateString()}`}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                    <Box sx={{ width: 100, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={test.score}
                        color={test.passed ? "success" : "error"}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {test.score}%
                    </Typography>
                    <Chip
                      label={test.passed ? "Пройден" : "Не пройден"}
                      color={test.passed ? "success" : "error"}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="Тесты не пройдены" />
              </ListItem>
            )}
          </List>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          Раздел фидбека находится в разработке
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2}>
          {analytics.ai_insights && analytics.ai_insights.length > 0 ? (
            analytics.ai_insights.map((insight) => (
              <Grid item xs={12} key={insight.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderLeft: `4px solid ${
                      insight.importance > 7
                        ? theme.palette.error.main
                        : insight.importance > 5
                        ? theme.palette.warning.main
                        : theme.palette.success.main
                    }`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1">{insight.type}</Typography>
                    <Chip
                      label={
                        insight.importance > 7
                          ? "Критично"
                          : insight.importance > 5
                          ? "Важно"
                          : "Информационно"
                      }
                      size="small"
                      color={
                        insight.importance > 7
                          ? "error"
                          : insight.importance > 5
                          ? "warning"
                          : "success"
                      }
                    />
                  </Box>
                  <Typography variant="body1">{insight.content}</Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    {new Date(insight.generated_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography align="center" color="textSecondary">
                Нет доступных AI-инсайтов для этого пользователя
              </Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Награды
              </Typography>
              <List>
                {analytics.badges && analytics.badges.length > 0 ? (
                  analytics.badges.map((badge) => (
                    <ListItem key={badge.id}>
                      <ListItemIcon>
                        <img
                          src={badge.badge_icon || "/icons/badge-default.svg"}
                          alt={badge.badge_name}
                          width={32}
                          height={32}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={badge.badge_name}
                        secondary={`Получено: ${new Date(
                          badge.acquired_date
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Пользователь пока не получил наград" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Достижения
              </Typography>
              <List>
                {analytics.achievements && analytics.achievements.length > 0 ? (
                  analytics.achievements.map((achievement) => (
                    <ListItem key={achievement.id}>
                      <ListItemText
                        primary={achievement.achievement_name}
                        secondary={achievement.achievement_description}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(
                          achievement.acquired_date
                        ).toLocaleDateString()}
                      </Typography>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Пользователь пока не получил достижений" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default UserAnalyticsTabs;
