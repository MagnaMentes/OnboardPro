from locust import HttpUser, task, between
import json
import random

class OnboardProUser(HttpUser):
    wait_time = between(1, 3)  # Время ожидания между запросами (1-3 секунды)
    token = None
    user_id = None
    plan_id = None
    task_id = None
    
    def on_start(self):
        # Авторизация пользователя
        credentials = {
            "username": "hr@onboardpro.com",
            "password": "hr123"
        }
        response = self.client.post("/login", data=credentials)
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            # Получаем информацию о текущем пользователе
            headers = {"Authorization": f"Bearer {self.token}"}
            user_response = self.client.get("/users/me", headers=headers)
            if user_response.status_code == 200:
                self.user_id = user_response.json()["id"]
            # Получаем или создаем план
            plans_response = self.client.get("/plans", headers=headers)
            if plans_response.status_code == 200 and plans_response.json():
                self.plan_id = plans_response.json()[0]["id"]
            else:
                plan_data = {
                    "role": "employee",
                    "title": "Load Test Plan"
                }
                plan_response = self.client.post("/plans", json=plan_data, headers=headers)
                if plan_response.status_code == 200:
                    self.plan_id = plan_response.json()["id"]
    
    @task(3)
    def get_users(self):
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/users", headers=headers, name="/users - Получение списка пользователей")
    
    @task(5)
    def get_tasks(self):
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/tasks", headers=headers, name="/tasks - Получение списка задач")
    
    @task(2)
    def get_plans(self):
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/plans", headers=headers, name="/plans - Получение списка планов")
    
    @task(1)
    def create_task(self):
        if self.token and self.plan_id and self.user_id:
            headers = {"Authorization": f"Bearer {self.token}"}
            task_data = {
                "plan_id": self.plan_id,
                "user_id": self.user_id,
                "title": f"Load Test Task {random.randint(1, 1000)}",
                "description": "Тестовая задача для нагрузочного тестирования",
                "priority": random.choice(["low", "medium", "high"]),
                "deadline": "2025-12-31T12:00:00Z"
            }
            response = self.client.post("/tasks", json=task_data, headers=headers, name="/tasks - Создание задачи")
            if response.status_code == 200:
                self.task_id = response.json()["id"]
    
    @task(1)
    def update_task(self):
        if self.token and self.task_id:
            headers = {"Authorization": f"Bearer {self.token}"}
            status_options = ["pending", "in_progress", "completed"]
            task_data = {
                "status": random.choice(status_options)
            }
            self.client.put(f"/tasks/{self.task_id}", json=task_data, headers=headers, name="/tasks/{id} - Обновление задачи")
    
    @task(1)
    def create_feedback(self):
        if self.token and self.user_id:
            headers = {"Authorization": f"Bearer {self.token}"}
            feedback_data = {
                "recipient_id": self.user_id,
                "message": f"Тестовый отзыв {random.randint(1, 1000)}"
            }
            self.client.post("/feedback", json=feedback_data, headers=headers, name="/feedback - Создание отзыва")
    
    @task(2)
    def get_feedback(self):
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/feedback", headers=headers, name="/feedback - Получение списка отзывов")