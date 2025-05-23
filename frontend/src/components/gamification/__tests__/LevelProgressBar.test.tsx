import { render } from "@testing-library/react";
import LevelProgressBar from "../LevelProgressBar";
import { UserLevel } from "../../../api/gamificationApi";

describe("LevelProgressBar", () => {
  const mockUserLevel: UserLevel = {
    level: 2,
    points: 150,
    points_to_next_level: 300,
    total_points: 450,
  };

  it("отображает текущий уровень пользователя", () => {
    const { getByText } = render(
      <LevelProgressBar userLevel={mockUserLevel} isLoading={false} />
    );
    expect(getByText(/Уровень 2/i)).toBeInTheDocument();
  });

  it("отображает прогресс-бар с правильным процентом заполнения", () => {
    const { getByRole } = render(
      <LevelProgressBar userLevel={mockUserLevel} isLoading={false} />
    );
    const progressBar = getByRole("progressbar");
    // 150 очков из 300 = 50%
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });

  it("отображает спиннер во время загрузки", () => {
    const { getByTestId } = render(
      <LevelProgressBar userLevel={null} isLoading={true} />
    );
    expect(getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("показывает сообщение об ошибке при отсутствии данных", () => {
    const { getByText } = render(
      <LevelProgressBar userLevel={null} isLoading={false} />
    );
    expect(getByText(/Не удалось загрузить данные/i)).toBeInTheDocument();
  });
});
