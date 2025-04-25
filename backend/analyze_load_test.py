import json
import sys
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime


def analyze_load_test_results(json_file_path):
    # Загрузка данных из JSON файла
    with open(json_file_path, 'r') as file:
        data = json.load(file)

    # Извлечение статистики
    stats = data.get('stats', [])
    if not stats:
        print("Ошибка: Данные статистики не найдены в файле.")
        return

    # Подготовка данных для анализа
    endpoints = []
    response_times = []
    rps = []
    failure_rates = []

    for endpoint in stats:
        name = endpoint.get('name', 'Unknown')
        endpoints.append(name)
        response_times.append(endpoint.get('avg_response_time', 0))
        rps.append(endpoint.get('current_rps', 0))
        total_requests = endpoint.get('num_requests', 0)
        failures = endpoint.get('num_failures', 0)
        failure_rate = (failures / total_requests *
                        100) if total_requests > 0 else 0
        failure_rates.append(failure_rate)

    # Создание отчета
    print("\n===== ОТЧЕТ О НАГРУЗОЧНОМ ТЕСТИРОВАНИИ =====")
    print(f"Дата анализа: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Общее количество эндпоинтов: {len(endpoints)}")

    print("\n--- Статистика по эндпоинтам ---")
    for i, endpoint in enumerate(endpoints):
        print(f"\nЭндпоинт: {endpoint}")
        print(f"Среднее время отклика: {response_times[i]:.2f} мс")
        print(f"Запросов в секунду: {rps[i]:.2f}")
        print(f"Процент ошибок: {failure_rates[i]:.2f}%")

    # Определение узких мест
    print("\n--- Анализ производительности ---")

    # Эндпоинты с самым высоким временем отклика
    slow_endpoints_indices = np.argsort(response_times)[-3:]
    print("\nСамые медленные эндпоинты:")
    for i in reversed(slow_endpoints_indices):
        print(f"{endpoints[i]}: {response_times[i]:.2f} мс")

    # Эндпоинты с наибольшим процентом ошибок
    error_endpoints_indices = np.argsort(failure_rates)[-3:]
    print("\nЭндпоинты с наибольшим процентом ошибок:")
    for i in reversed(error_endpoints_indices):
        if failure_rates[i] > 0:
            print(f"{endpoints[i]}: {failure_rates[i]:.2f}%")
        else:
            print("Нет эндпоинтов с ошибками")

    # Визуализация результатов
    plt.figure(figsize=(12, 8))

    # График времени отклика
    plt.subplot(2, 1, 1)
    plt.barh(endpoints, response_times, color='skyblue')
    plt.xlabel('Среднее время отклика (мс)')
    plt.title('Время отклика по эндпоинтам')
    plt.grid(axis='x', linestyle='--', alpha=0.7)

    # График RPS
    plt.subplot(2, 1, 2)
    plt.barh(endpoints, rps, color='lightgreen')
    plt.xlabel('Запросов в секунду (RPS)')
    plt.title('Нагрузка по эндпоинтам')
    plt.grid(axis='x', linestyle='--', alpha=0.7)

    plt.tight_layout()

    # Сохранение графика
    output_file = 'load_test_results.png'
    plt.savefig(output_file)
    print(f"\nГрафик сохранен в файл: {output_file}")

    # Рекомендации по оптимизации
    print("\n--- Рекомендации по оптимизации ---")
    if max(response_times) > 1000:  # Если время отклика больше 1 секунды
        print("- Рассмотрите возможность оптимизации запросов к базе данных для медленных эндпоинтов")
        print("- Проверьте возможность кэширования часто запрашиваемых данных")

    if max(failure_rates) > 5:  # Если процент ошибок больше 5%
        print("- Исследуйте причины ошибок в эндпоинтах с высоким процентом отказов")
        print("- Проверьте обработку исключений и валидацию входных данных")

    if max(rps) > 50:  # Если RPS больше 50
        print("- Рассмотрите возможность горизонтального масштабирования для обработки высокой нагрузки")
        print("- Проверьте эффективность работы с базой данных при параллельных запросах")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Использование: python analyze_load_test.py <путь_к_json_файлу>")
        sys.exit(1)

    json_file_path = sys.argv[1]
    analyze_load_test_results(json_file_path)
