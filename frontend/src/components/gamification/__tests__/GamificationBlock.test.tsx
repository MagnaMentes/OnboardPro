import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import GamificationBlock from "../GamificationBlock";
import { UserLevel, UserReward } from "../../../api/gamificationApi";

describe("GamificationBlock", () => {
  const mockUserLevel: UserLevel = {
    level: 2,
    points: 150,
    points_to_next_level: 300,
    total_points: 450,
  };

  const mockRewards: UserReward[] = [
    {
      id: 1,
      title: "Первый шаг",
      description: "Завершен первый шаг онбординга",
      reward_type: "achievement",
      icon: "achievement_first_step",
      created_at: "2024-01-22T10:00:00Z",
    },
    {
      id: 2,
      title: "Уровень 2",
      description: "Достигнут второй уровень",
      reward_type: "level",
      icon: "level_2",
      created_at: "2024-01-22T11:00:00Z",
    },
  ];

  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("отображает прогресс-бар с уровнем", () => {
    const { getByText } = renderWithRouter(
      <GamificationBlock
        userLevel={mockUserLevel}
        userRewards={mockRewards}
        isLoading={false}
      />
    );
    expect(getByText(/Уровень 2/i)).toBeInTheDocument();
  });

  it("отображает последние награды", () => {
    const { getByText } = renderWithRouter(
      <GamificationBlock
        userLevel={mockUserLevel}
        userRewards={mockRewards}
        isLoading={false}
      />
    );
    expect(getByText("Последние награды")).toBeInTheDocument();
    expect(getByText("Первый шаг")).toBeInTheDocument();
    expect(getByText("Уровень 2")).toBeInTheDocument();
  });

  it("показывает спиннер во время загрузки", () => {
    const { getByTestId } = renderWithRouter(
      <GamificationBlock
        userLevel={mockUserLevel}
        userRewards={mockRewards}
        isLoading={true}
      />
    );
    expect(getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("отображает сообщение, если нет наград", () => {
    const { getByText } = renderWithRouter(
      <GamificationBlock
        userLevel={mockUserLevel}
        userRewards={[]}
        isLoading={false}
      />
    );
    expect(getByText(/У вас пока нет наград/i)).toBeInTheDocument();
  });

  it("содержит ссылку на страницу всех наград", () => {
    const { getByRole } = renderWithRouter(
      <GamificationBlock
        userLevel={mockUserLevel}
        userRewards={mockRewards}
        isLoading={false}
      />
    );
    const allRewardsLink = getByRole("link", { name: /все награды/i });
    expect(allRewardsLink).toBeInTheDocument();
    expect(allRewardsLink).toHaveAttribute("href", "/rewards");
  });
});
