import { render, screen, fireEvent } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import HRTrendChart from "../HRTrendChart";
import { useMetricHistory } from "../../../../api/useHRDashboard";

// Мокаем хук useMetricHistory
jest.mock("../../../../api/useHRDashboard", () => ({
  useMetricHistory: jest.fn(),
}));

const mockMetricData = [
  { timestamp: "2024-02-01T00:00:00Z", metric_value: 75.5 },
  { timestamp: "2024-02-02T00:00:00Z", metric_value: 78.2 },
  { timestamp: "2024-02-03T00:00:00Z", metric_value: 80.1 },
];

const renderWithChakra = (component: React.ReactNode) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe("HRTrendChart", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
  });

  it("отображает график с правильным заголовком", () => {
    (useMetricHistory as jest.Mock).mockReturnValue({
      data: mockMetricData,
      isLoading: false,
    });

    renderWithChakra(
      <HRTrendChart
        metricKey="avg_completion_rate"
        title="Прогресс онбординга"
        color="#3182ce"
        valueFormatter={(value) => `${value.toFixed(1)}%`}
      />
    );

    expect(screen.getByText("Прогресс онбординга")).toBeInTheDocument();
  });

  it("отображает селектор периода", () => {
    (useMetricHistory as jest.Mock).mockReturnValue({
      data: mockMetricData,
      isLoading: false,
    });

    renderWithChakra(
      <HRTrendChart
        metricKey="avg_completion_rate"
        title="Прогресс онбординга"
      />
    );

    const periodSelect = screen.getByRole("combobox");
    expect(periodSelect).toBeInTheDocument();

    // Проверяем опции периода
    expect(screen.getByText("7 дней")).toBeInTheDocument();
    expect(screen.getByText("30 дней")).toBeInTheDocument();
    expect(screen.getByText("90 дней")).toBeInTheDocument();
  });

  it("отображает спиннер во время загрузки", () => {
    (useMetricHistory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithChakra(
      <HRTrendChart
        metricKey="avg_completion_rate"
        title="Прогресс онбординга"
      />
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("обновляет данные при изменении периода", () => {
    (useMetricHistory as jest.Mock).mockReturnValue({
      data: mockMetricData,
      isLoading: false,
    });

    renderWithChakra(
      <HRTrendChart
        metricKey="avg_completion_rate"
        title="Прогресс онбординга"
      />
    );

    const periodSelect = screen.getByRole("combobox");
    fireEvent.change(periodSelect, { target: { value: "90" } });

    // Проверяем, что хук был вызван с новым периодом
    expect(useMetricHistory).toHaveBeenCalledWith(
      "avg_completion_rate",
      undefined,
      90
    );
  });
});
