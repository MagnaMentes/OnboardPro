import { render, screen, fireEvent } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import HRAlertTable from "../HRAlertTable";
import { HRAlert } from "../../../../types/hr-dashboard";

const mockAlerts: HRAlert[] = [
  {
    id: 1,
    title: "Высокий риск оттока",
    description:
      "Сотрудник показывает признаки недовольства процессом онбординга",
    severity: "high",
    created_at: "2024-02-19T10:00:00Z",
    status: "open",
    metric_key: "satisfaction_score",
    metric_value: 2.1,
    employee_id: 123,
    employee_name: "Иван Петров",
  },
  {
    id: 2,
    title: "Задержка в обучении",
    description: "Сотрудник отстает от графика обучения",
    severity: "medium",
    created_at: "2024-02-19T11:00:00Z",
    status: "open",
    metric_key: "completion_rate",
    metric_value: 45.5,
    employee_id: 124,
    employee_name: "Мария Сидорова",
  },
];

const renderWithChakra = (component: React.ReactNode) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe("HRAlertTable", () => {
  it("отображает все алерты с правильной информацией", () => {
    renderWithChakra(<HRAlertTable alerts={mockAlerts} isLoading={false} />);

    // Проверяем заголовки алертов
    expect(screen.getByText("Высокий риск оттока")).toBeInTheDocument();
    expect(screen.getByText("Задержка в обучении")).toBeInTheDocument();

    // Проверяем имена сотрудников
    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
    expect(screen.getByText("Мария Сидорова")).toBeInTheDocument();

    // Проверяем бейджи с уровнем важности
    const severityBadges = screen.getAllByTestId("severity-badge");
    expect(severityBadges).toHaveLength(2);
    expect(severityBadges[0]).toHaveTextContent("Высокий");
    expect(severityBadges[1]).toHaveTextContent("Средний");
  });

  it("отображает спиннер во время загрузки", () => {
    renderWithChakra(<HRAlertTable alerts={[]} isLoading={true} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("отображает сообщение когда нет алертов", () => {
    renderWithChakra(<HRAlertTable alerts={[]} isLoading={false} />);
    expect(screen.getByText("Нет активных алертов")).toBeInTheDocument();
  });

  it("позволяет фильтровать алерты по статусу", () => {
    renderWithChakra(<HRAlertTable alerts={mockAlerts} isLoading={false} />);

    const statusFilter = screen.getByTestId("status-filter");
    fireEvent.change(statusFilter, { target: { value: "open" } });

    // Проверяем, что отображаются только открытые алерты
    expect(screen.getAllByTestId("alert-row")).toHaveLength(2);
  });
});
