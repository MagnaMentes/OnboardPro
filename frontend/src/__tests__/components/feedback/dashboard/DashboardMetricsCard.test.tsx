import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardMetricsCard from "../../../../components/feedback/dashboard/DashboardMetricsCard";

describe("DashboardMetricsCard Component", () => {
  const mockMetrics = {
    sentiment: 0.75,
    previousSentiment: 0.65,
    satisfaction: 85,
    previousSatisfaction: 80,
    responseCount: 150,
    previousResponseCount: 120,
    responseRate: 75,
    previousResponseRate: 70,
  };

  test("renders all four metric cards", () => {
    render(<DashboardMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText("Настроение")).toBeInTheDocument();
    expect(screen.getByText("Удовлетворенность")).toBeInTheDocument();
    expect(screen.getByText("Количество отзывов")).toBeInTheDocument();
    expect(screen.getByText("Активность отзывов")).toBeInTheDocument();
  });

  test("formats sentiment values correctly", () => {
    render(<DashboardMetricsCard metrics={mockMetrics} />);

    // Sentiment is multiplied by 10 and displayed with 1 decimal place
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  test("calculates and displays percentage changes", () => {
    render(<DashboardMetricsCard metrics={mockMetrics} />);

    // For sentiment: (0.75-0.65)/0.65 ≈ 15.4%
    // The exact value displayed may vary slightly due to rounding
    expect(screen.getByText(/15.4%/)).toBeInTheDocument();
  });

  test("displays satisfaction percentage correctly", () => {
    render(<DashboardMetricsCard metrics={mockMetrics} />);

    // Satisfaction is displayed as a percentage
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  test("displays appropriate help text for sentiment values", () => {
    // High sentiment
    const highSentiment = { ...mockMetrics, sentiment: 0.85 };
    const { rerender } = render(
      <DashboardMetricsCard metrics={highSentiment} />
    );
    expect(screen.getByText(/позитивное настроение/i)).toBeInTheDocument();

    // Medium sentiment
    const mediumSentiment = { ...mockMetrics, sentiment: 0.45 };
    rerender(<DashboardMetricsCard metrics={mediumSentiment} />);
    expect(screen.getByText(/нейтральное настроение/i)).toBeInTheDocument();

    // Low sentiment
    const lowSentiment = { ...mockMetrics, sentiment: 0.15 };
    rerender(<DashboardMetricsCard metrics={lowSentiment} />);
    expect(screen.getByText(/тревожное настроение/i)).toBeInTheDocument();
  });

  test("handles missing previous values gracefully", () => {
    const metricsWithoutPrevious = {
      sentiment: 0.75,
      satisfaction: 85,
      responseCount: 150,
      responseRate: 75,
    };

    render(<DashboardMetricsCard metrics={metricsWithoutPrevious} />);

    // All metrics should still render without previous values
    expect(screen.getByText("7.5")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
