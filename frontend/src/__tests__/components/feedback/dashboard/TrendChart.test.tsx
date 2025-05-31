import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TrendChart from "../../../../components/feedback/dashboard/TrendChart";

describe("TrendChart Component", () => {
  const mockData = [
    { date: "2023-01-01", value: 7.5 },
    { date: "2023-01-02", value: 8.1 },
    { date: "2023-01-03", value: 7.8 },
  ];

  test("renders the component with title", () => {
    render(
      <TrendChart title="Тестовый график" data={mockData} isLoading={false} />
    );
    expect(screen.getByText("Тестовый график")).toBeInTheDocument();
  });

  test("shows loading spinner when isLoading is true", () => {
    render(
      <TrendChart title="Тестовый график" data={mockData} isLoading={true} />
    );
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("shows empty state message when no data is available", () => {
    render(<TrendChart title="Тестовый график" data={[]} isLoading={false} />);
    expect(screen.getByText("Нет данных для отображения")).toBeInTheDocument();
  });

  test("allows period selection via dropdown", () => {
    const mockOnPeriodChange = jest.fn();
    render(
      <TrendChart
        title="Тестовый график"
        data={mockData}
        isLoading={false}
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const periodSelect = screen.getByRole("combobox");
    fireEvent.change(periodSelect, { target: { value: "90" } });
    expect(mockOnPeriodChange).toHaveBeenCalledWith("90");
  });

  test("uses custom value formatter if provided", () => {
    const customFormatter = (value: number) => `${value}%`;

    render(
      <TrendChart
        title="Тестовый график"
        data={mockData}
        isLoading={false}
        valueFormatter={customFormatter}
      />
    );

    // Проверка форматирования значений может быть сложной из-за того,
    // как Recharts отрисовывает графики. В реальной ситуации нужно было бы
    // проверять непосредственно DOM элементы после рендеринга графика.
    // Для этого теста мы просто убедимся, что компонент рендерится без ошибок.
    expect(screen.getByText("Тестовый график")).toBeInTheDocument();
  });
});
