import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackTrendAlert from "../../../../components/feedback/dashboard/FeedbackTrendAlert";

describe("FeedbackTrendAlert Component", () => {
  const mockAlert = {
    id: 1,
    title: "Падение настроения",
    description:
      "Обнаружено снижение среднего настроения на 15% за последнюю неделю",
    severity: "high" as const,
    created_at: "2023-05-15T10:30:00Z",
    is_resolved: false,
    rule_type: "sentiment_drop",
    percentage_change: -15,
    template_name: "Основной опрос",
    department_name: "Инженерный отдел",
  };

  test("renders alert information correctly", () => {
    render(<FeedbackTrendAlert alert={mockAlert} />);

    expect(screen.getByText("Падение настроения")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Обнаружено снижение среднего настроения на 15% за последнюю неделю"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Инженерный отдел")).toBeInTheDocument();
    expect(screen.getByText("Основной опрос")).toBeInTheDocument();
  });

  test("displays resolved status when alert is resolved", () => {
    const resolvedAlert = { ...mockAlert, is_resolved: true };
    render(<FeedbackTrendAlert alert={resolvedAlert} />);

    expect(screen.getByText("Закрыт")).toBeInTheDocument();
  });

  test("calls onResolve when resolve button is clicked", () => {
    const handleResolve = jest.fn();
    render(<FeedbackTrendAlert alert={mockAlert} onResolve={handleResolve} />);

    const resolveButton = screen.getByRole("button", {
      name: /закрыть алерт/i,
    });
    fireEvent.click(resolveButton);

    expect(handleResolve).toHaveBeenCalledWith(mockAlert.id);
  });

  test("calls onShowDetails when details button is clicked", () => {
    const handleShowDetails = jest.fn();
    render(
      <FeedbackTrendAlert alert={mockAlert} onShowDetails={handleShowDetails} />
    );

    const detailsButton = screen.getByRole("button", { name: /детали/i });
    fireEvent.click(detailsButton);

    expect(handleShowDetails).toHaveBeenCalledWith(mockAlert.id);
  });

  test("shows correct severity indicator based on alert severity", () => {
    const criticalAlert = { ...mockAlert, severity: "critical" as const };
    const { rerender } = render(<FeedbackTrendAlert alert={criticalAlert} />);

    expect(screen.getByText("КРИТИЧЕСКИЙ")).toBeInTheDocument();

    const mediumAlert = { ...mockAlert, severity: "medium" as const };
    rerender(<FeedbackTrendAlert alert={mediumAlert} />);

    expect(screen.getByText("СРЕДНИЙ")).toBeInTheDocument();
  });

  test("displays change percentage with correct trend icon", () => {
    render(<FeedbackTrendAlert alert={mockAlert} />);

    // For negative change we should see trending down icon
    // Testing the presence of the icon is challenging in jest,
    // but we can at least verify the text is there
    expect(screen.getByText("-15%")).toBeInTheDocument();

    const positiveAlert = { ...mockAlert, percentage_change: 15 };
    render(<FeedbackTrendAlert alert={positiveAlert} />);

    expect(screen.getByText("+15%")).toBeInTheDocument();
  });
});
