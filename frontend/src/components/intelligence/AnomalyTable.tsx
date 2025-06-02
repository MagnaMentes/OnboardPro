import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import {
  OnboardingAnomaly,
  ResolveAnomalyRequest,
} from "../../types/intelligence";
import { getAnomalies, resolveAnomaly } from "../../api/intelligenceApi";

interface AnomalyTableProps {
  userId?: number;
  departmentId?: number;
  showResolved?: boolean;
  limit?: number;
  onAnomalyResolved?: () => void;
}

const AnomalyTable: React.FC<AnomalyTableProps> = ({
  userId,
  departmentId,
  showResolved = false,
  limit,
  onAnomalyResolved,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<OnboardingAnomaly[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState<{
    anomaly_type: string;
    resolved: boolean | null;
  }>({
    anomaly_type: "",
    resolved: showResolved ? null : false,
  });
  const theme = useTheme();

  // Диалог разрешения аномалии
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] =
    useState<OnboardingAnomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const fetchAnomalies = async () => {
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
          if (filters[key] === "" || filters[key] === null) {
            delete filters[key];
          }
        });

        const data = await getAnomalies(filters);
        setAnomalies(limit ? data.slice(0, limit) : data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch anomalies:", err);
        setError(
          "Не удалось загрузить данные аномалий. Попробуйте обновить страницу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalies();
  }, [userId, departmentId, filter, limit, showResolved]);

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFilter((prev) => ({
      ...prev,
      [name]:
        value === "all"
          ? null
          : value === "true"
          ? true
          : value === "false"
          ? false
          : value,
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenResolveDialog = (anomaly: OnboardingAnomaly) => {
    setSelectedAnomaly(anomaly);
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const handleCloseResolveDialog = () => {
    setResolveDialogOpen(false);
    setSelectedAnomaly(null);
  };

  const handleResolveAnomaly = async () => {
    if (!selectedAnomaly) return;

    try {
      setResolving(true);
      const data: ResolveAnomalyRequest = { resolution_notes: resolutionNotes };
      await resolveAnomaly(selectedAnomaly.id, data);

      // Обновляем локальный список аномалий
      setAnomalies((prev) =>
        prev.map((anomaly) =>
          anomaly.id === selectedAnomaly.id
            ? {
                ...anomaly,
                resolved: true,
                resolved_at: new Date().toISOString(),
                resolution_notes: resolutionNotes,
              }
            : anomaly
        )
      );

      // Вызываем колбэк если он предоставлен
      if (onAnomalyResolved) {
        onAnomalyResolved();
      }

      handleCloseResolveDialog();
    } catch (err) {
      console.error("Failed to resolve anomaly:", err);
      setError("Не удалось разрешить аномалию. Попробуйте еще раз.");
    } finally {
      setResolving(false);
    }
  };

  const getAnomalyTypeColor = (anomalyType: string) => {
    switch (anomalyType) {
      case "slow_progress":
        return theme.palette.warning.main;
      case "skipped_feedback":
        return theme.palette.info.main;
      case "test_failures":
        return theme.palette.error.main;
      case "mentor_reassignments":
        return theme.palette.secondary.main;
      case "unusual_activity":
        return theme.palette.warning.dark;
      default:
        return theme.palette.primary.main;
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
    <Box>
      {!limit && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Аномалии в онбординге
          </Typography>

          {/* Фильтры */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Тип аномалии</InputLabel>
                <Select
                  name="anomaly_type"
                  value={filter.anomaly_type}
                  label="Тип аномалии"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Все типы</MenuItem>
                  <MenuItem value="slow_progress">Медленный прогресс</MenuItem>
                  <MenuItem value="skipped_feedback">
                    Пропущенный фидбек
                  </MenuItem>
                  <MenuItem value="test_failures">Провалы в тестах</MenuItem>
                  <MenuItem value="mentor_reassignments">
                    Смены ментора
                  </MenuItem>
                  <MenuItem value="unusual_activity">
                    Необычная активность
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Статус</InputLabel>
                <Select
                  name="resolved"
                  value={
                    filter.resolved === null
                      ? "all"
                      : filter.resolved === true
                      ? "true"
                      : "false"
                  }
                  label="Статус"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">Все статусы</MenuItem>
                  <MenuItem value="false">Активные</MenuItem>
                  <MenuItem value="true">Разрешенные</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Таблица аномалий */}
      {anomalies.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Нет аномалий, соответствующих текущим фильтрам
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="table of anomalies">
              <TableHead>
                <TableRow>
                  <TableCell>Описание</TableCell>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Департамент</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Обнаружено</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? anomalies.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                  : anomalies
                ).map((anomaly) => (
                  <TableRow key={anomaly.id} hover>
                    <TableCell component="th" scope="row">
                      {anomaly.description}
                    </TableCell>
                    <TableCell>{anomaly.user_full_name}</TableCell>
                    <TableCell>{anomaly.department_name || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={anomaly.anomaly_type_display}
                        size="small"
                        sx={{
                          bgcolor: getAnomalyTypeColor(anomaly.anomaly_type),
                          color: "#fff",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(anomaly.detected_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {anomaly.resolved ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Разрешено"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<WarningIcon />}
                          label="Активно"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {!anomaly.resolved && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenResolveDialog(anomaly)}
                        >
                          Решить
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!limit && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
              component="div"
              count={anomalies.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} из ${count}`
              }
            />
          )}
        </>
      )}

      {/* Диалог разрешения аномалии */}
      <Dialog open={resolveDialogOpen} onClose={handleCloseResolveDialog}>
        <DialogTitle>Разрешение аномалии</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Опишите, как была решена аномалия:
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mt: 1 }}
            >
              {selectedAnomaly?.description}
            </Typography>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="resolution-notes"
            label="Заметки о решении"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResolveDialog} disabled={resolving}>
            Отмена
          </Button>
          <Button
            onClick={handleResolveAnomaly}
            color="primary"
            disabled={resolving}
            startIcon={resolving ? <CircularProgress size={20} /> : undefined}
          >
            {resolving ? "Сохранение..." : "Разрешить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnomalyTable;
