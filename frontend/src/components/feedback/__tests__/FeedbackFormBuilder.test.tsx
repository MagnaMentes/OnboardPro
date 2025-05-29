import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChakraProvider } from "@chakra-ui/react";
import { FeedbackFormBuilder } from "../FeedbackFormBuilder";
import { FeedbackTemplate, QuestionType } from "../../../types/feedback";

// Моковый колбэк для сохранения шаблона
const mockSave = jest.fn();

// Мок шаблона для тестирования
const mockTemplate: FeedbackTemplate = {
  id: 1,
  title: "Тестовый шаблон",
  description: "Описание тестового шаблона",
  type: "manual",
  is_anonymous: false,
  created_at: "2025-05-01T10:00:00Z",
  updated_at: "2025-05-01T10:00:00Z",
  questions: [
    {
      id: 1,
      text: "Текстовый вопрос",
      type: "text",
      order: 1,
      required: true,
    },
    {
      id: 2,
      text: "Оцените от 1 до 10",
      type: "scale",
      order: 2,
      required: true,
    },
  ],
};

describe("FeedbackFormBuilder", () => {
  beforeEach(() => {
    mockSave.mockClear();
  });

  test("renders form builder with empty template", () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder onSave={mockSave} />
      </ChakraProvider>
    );

    // Проверяем наличие полей для заголовка и описания
    expect(screen.getByLabelText(/название шаблона/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/описание/i)).toBeInTheDocument();

    // Проверяем наличие кнопки добавления вопроса
    expect(screen.getByText(/добавить вопрос/i)).toBeInTheDocument();

    // Проверяем наличие переключателя анонимности
    expect(screen.getByText(/анонимная форма/i)).toBeInTheDocument();
  });

  test("renders form builder with existing template", () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder initialTemplate={mockTemplate} onSave={mockSave} />
      </ChakraProvider>
    );

    // Проверяем, что поля заполнены значениями из шаблона
    expect(screen.getByDisplayValue("Тестовый шаблон")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Описание тестового шаблона")
    ).toBeInTheDocument();

    // Проверяем, что вопросы отображаются
    expect(screen.getByText("Текстовый вопрос")).toBeInTheDocument();
    expect(screen.getByText("Оцените от 1 до 10")).toBeInTheDocument();
  });

  test("allows adding a new question", async () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder onSave={mockSave} />
      </ChakraProvider>
    );

    // Клик на кнопку добавления вопроса
    fireEvent.click(screen.getByText(/добавить вопрос/i));

    // Ожидаем появления поля ввода для нового вопроса
    const questionInput = await screen.findByPlaceholderText(/введите вопрос/i);
    expect(questionInput).toBeInTheDocument();

    // Вводим текст вопроса
    await userEvent.type(questionInput, "Новый тестовый вопрос");
    expect(questionInput).toHaveValue("Новый тестовый вопрос");
  });

  test("allows changing question type", async () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder initialTemplate={mockTemplate} onSave={mockSave} />
      </ChakraProvider>
    );

    // Находим селекты типа вопроса
    const typeSelects = screen.getAllByRole("combobox");
    const firstQuestionTypeSelect = typeSelects[0];

    // Изменяем тип первого вопроса на множественный выбор
    fireEvent.change(firstQuestionTypeSelect, {
      target: { value: QuestionType.MULTIPLE_CHOICE },
    });

    // Проверяем, что появилось поле для вариантов выбора
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/добавьте вариант/i)
      ).toBeInTheDocument();
    });
  });

  test("saves form when submit button is clicked", async () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder initialTemplate={mockTemplate} onSave={mockSave} />
      </ChakraProvider>
    );

    // Изменяем заголовок
    const titleInput = screen.getByDisplayValue("Тестовый шаблон");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Обновленный шаблон");

    // Нажимаем кнопку сохранения
    fireEvent.click(screen.getByText(/сохранить шаблон/i));

    // Проверяем, что функция сохранения была вызвана с обновленными данными
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Проверяем, что в аргументах вызова есть обновленный заголовок
    const saveArg = mockSave.mock.calls[0][0];
    expect(saveArg.title).toBe("Обновленный шаблон");
  });

  test("allows removing a question", async () => {
    render(
      <ChakraProvider>
        <FeedbackFormBuilder initialTemplate={mockTemplate} onSave={mockSave} />
      </ChakraProvider>
    );

    // Получаем количество вопросов до удаления
    const initialQuestions = screen.getAllByText(/обязательный вопрос/i);
    const initialCount = initialQuestions.length;

    // Находим и нажимаем на кнопку удаления первого вопроса
    const deleteButtons = screen.getAllByLabelText(/удалить вопрос/i);
    fireEvent.click(deleteButtons[0]);

    // Проверяем, что количество вопросов уменьшилось
    await waitFor(() => {
      const remainingQuestions = screen.getAllByText(/обязательный вопрос/i);
      expect(remainingQuestions.length).toBe(initialCount - 1);
    });
  });
});
