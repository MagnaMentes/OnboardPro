import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import { OnboardingRiskPrediction } from "../../types/intelligence";
import { getRiskPredictions } from "../../api/intelligenceApi";

interface RiskPredictionPanelProps {
  userId?: number;
  departmentId?: number;
}

const RiskPredictionPanel: React.FC<RiskPredictionPanelProps> = ({
  userId,
  departmentId,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<OnboardingRiskPrediction[]>([]);
  const [filter, setFilter] = useState<{
    risk_type: string;
    severity: string;
  }>({
    risk_type: "",
    severity: "",
  });
  const theme = useTheme();

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const filters: any = {
          ...filter,
        };

        if (userId) {
          filters.user = userId;
        }

        if (departmentId) {
          filters.department = departmentId;
        }

        // Очищаем пустые фильтры
        Object.keys(filters).forEach((key) => {
          if (filters[key] === "") {
            delete filters[key];
          }
        });

        const data = await getRiskPredictions(filters);
        setRisks(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch risks data:", err);
        setError(
          "Не удалось загрузить данные рисков. Попробуйте обновить страницу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [userId, departmentId, filter]);

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return theme.palette.error.main;
      case "medium":
        return theme.palette.warning.main;
      case "low":
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <ErrorIcon />;
      case "medium":
        return <WarningIcon />;
      case "low":
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Прогнозируемые риски
        </Typography>

        {/* Фильтры */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Тип риска</InputLabel>
              <Select
                name="risk_type"
                value={filter.risk_type}
                label="Тип риска"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Все типы</MenuItem>
                <MenuItem value="completion">Риск незавершения</MenuItem>
                <MenuItem value="delay">Риск задержки</MenuItem>
                <MenuItem value="engagement">
                  Риск низкой вовлеченности
                </MenuItem>
                <MenuItem value="knowledge">
                  Риск недостаточного усвоения
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Серьезность</InputLabel>
              <Select
                name="severity"
                value={filter.severity}
                label="Серьезность"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Все уровни</MenuItem>
                <MenuItem value="high">Высокая</MenuItem>
                <MenuItem value="medium">Средняя</MenuItem>
                <MenuItem value="low">Низкая</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Список рисков */}
        {risks.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Нет рисков, соответствующих текущим фильтрам
          </Alert>
        ) : (
          risks.map((risk) => (
            <Accordion key={risk.id} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      mr: 2,
                      color: getSeverityColor(risk.severity),
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {getSeverityIcon(risk.severity)}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">
                      {risk.risk_type_display}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {risk.user_full_name} •{" "}
                      {risk.department_name || "Без департамента"}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${(risk.probability * 100).toFixed(0)}%`}
                  color={
                    risk.severity === "high"
                      ? "error"
                      : risk.severity === "medium"
                      ? "warning"
                      : "success"
                  }
                  size="small"
                />
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Факторы риска:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {Object.entries(risk.factors).map(
                      ([factorName, factorValue]) => (
                        <Box
                          key={factorName}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2">{factorName}:</Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {(factorValue * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Возможное влияние:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {risk.estimated_impact}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Рекомендации:
                  </Typography>
                  <Typography variant="body2">{risk.recommendation}</Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 2,
                      color: "text.secondary",
                      fontSize: "0.75rem",
                    }}
                  >
                    Обновлено: {new Date(risk.created_at).toLocaleString()}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Container>
  );
};

export default RiskPredictionPanel;
