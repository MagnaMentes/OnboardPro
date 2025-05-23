import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RewardCard from "../RewardCard";
import { UserReward } from "../../../api/gamificationApi";

describe("RewardCard", () => {
  const mockReward: UserReward = {
    id: 1,
    title: "Первый шаг",
    description: "Завершен первый шаг онбординга",
    reward_type: "achievement", // или 'level'
    icon: "achievement_first_step",
    created_at: "2024-01-22T10:00:00Z",
  };

  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("отображает заголовок награды", () => {
    const { getByText } = renderWithRouter(<RewardCard reward={mockReward} />);
    expect(getByText("Первый шаг")).toBeInTheDocument();
  });

  it("отображает описание награды", () => {
    const { getByText } = renderWithRouter(<RewardCard reward={mockReward} />);
    expect(getByText("Завершен первый шаг онбординга")).toBeInTheDocument();
  });

  it("отображает иконку награды", () => {
    const { getByRole } = renderWithRouter(<RewardCard reward={mockReward} />);
    const icon = getByRole("img", { name: /reward icon/i });
    expect(icon).toHaveAttribute(
      "src",
      expect.stringContaining(mockReward.icon ?? "")
    );
  });

  it("отображает дату получения награды", () => {
    const { getByText } = renderWithRouter(<RewardCard reward={mockReward} />);
    expect(getByText(/2024/)).toBeInTheDocument();
  });

  it("показывает правильный тип награды", () => {
    const { getByText } = renderWithRouter(<RewardCard reward={mockReward} />);
    expect(getByText(/достижение/i)).toBeInTheDocument();
  });
});
