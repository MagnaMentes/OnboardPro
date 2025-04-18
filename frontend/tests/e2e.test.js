describe("Login Page", () => {
  beforeEach(() => {
    // Загружаем страницу входа перед каждым тестом
    document.body.innerHTML = require("../src/login.html");
    require("../src/login.js");
  });

  it("should submit form with valid credentials", async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access: "fake-token" }),
      })
    );

    // Заполняем форму
    document.getElementById("email").value = "test@example.com";
    document.getElementById("password").value = "password123";

    // Отправляем форму
    await document.getElementById("login-form").submit();

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test@example.com",
        password: "password123",
      }),
    });
  });

  it("should handle login failure", async () => {
    // Mock fetch для неудачного входа
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: "Invalid credentials" }),
      })
    );

    // Mock alert
    global.alert = jest.fn();

    document.getElementById("email").value = "wrong@example.com";
    document.getElementById("password").value = "wrongpass";

    await document.getElementById("login-form").submit();

    // Проверяем, что было показано сообщение об ошибке
    expect(global.alert).toHaveBeenCalledWith("Login failed");
  });

  it("should validate required fields", () => {
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Проверяем, что поля обязательны
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);

    // Проверяем тип поля email
    expect(emailInput.type).toBe("email");
  });
});
