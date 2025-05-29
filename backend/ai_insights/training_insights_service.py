from django.db.models import Avg, Count, F, Q, Sum, Case, When, Value, FloatField
from django.utils import timezone
from django.conf import settings
from .training_models import (
    TrainingInsight, UserLearningMetric, DepartmentLearningMetric,
    QuestionDifficultyMetric
)
from onboarding.models import (
    UserOnboardingAssignment, OnboardingStep, UserStepProgress
)
from onboarding.lms_models import (
    LMSTest, LMSQuestion, LMSUserAnswer, LMSUserTestResult, LMSOption
)
from onboarding.lms_models_v2 import (
    UserOpenAnswer, UserTestAttempt, EnhancedLMSQuestion
)
from users.models import User
from departments.models import Department


class TrainingInsightsService:
    """
    Сервис для анализа данных обучения и создания AI-инсайтов
    """
    @staticmethod
    def analyze_difficult_steps():
        """
        Анализирует шаги обучения, которые вызывают наибольшие трудности у пользователей
        """
        # Получаем шаги с тестами
        steps_with_tests = OnboardingStep.objects.filter(
            lms_tests__isnull=False,
            step_type='training'
        ).distinct()

        insights = []

        for step in steps_with_tests:
            # Получаем все тесты для этого шага
            tests = LMSTest.objects.filter(step=step)

            # Агрегируем метрики производительности
            test_results = LMSUserTestResult.objects.filter(test__in=tests)

            # Если есть хотя бы 5 результатов для анализа
            if test_results.count() >= 5:
                # Рассчитываем общую долю неудачных попыток
                failure_rate = test_results.filter(
                    is_passed=False).count() / test_results.count()

                # Если доля неудачных попыток выше 30%
                if failure_rate > 0.3:
                    # Создаем инсайт
                    insight = TrainingInsight(
                        title=f"Сложный шаг обучения: {step.name}",
                        description=f"Данный шаг обучения успешно проходят только {(1-failure_rate)*100:.1f}% пользователей. "
                        f"Рекомендуется пересмотреть содержание обучающих материалов или снизить сложность теста.",
                        insight_type=TrainingInsight.InsightType.DIFFICULT_STEP,
                        # Нормализуем в диапазоне 0-1
                        severity=min(1.0, failure_rate * 1.5),
                        step=step
                    )
                    insights.append(insight)

                    # Если очень высокая доля неудачных попыток (>50%), увеличиваем серьезность
                    if failure_rate > 0.5:
                        insight.severity = min(1.0, failure_rate * 1.8)
                        insight.description += " Ситуация критическая - более половины пользователей не могут пройти этот шаг."

        # Сохраняем все инсайты
        if insights:
            TrainingInsight.objects.bulk_create(insights)
            return len(insights)

        return 0

    @staticmethod
    def analyze_problematic_questions():
        """
        Анализирует вопросы тестов, вызывающие наибольшие трудности
        """
        insights = []

        # Получаем все вопросы, на которые ответили хотя бы 5 раз
        questions = LMSQuestion.objects.annotate(
            answers_count=Count('user_answers')
        ).filter(answers_count__gte=5)

        # Для каждого вопроса вычисляем долю неправильных ответов
        for question in questions:
            total_answers = question.user_answers.count()
            correct_answers = question.user_answers.filter(
                selected_option__is_correct=True
            ).count()

            if total_answers > 0:
                success_rate = correct_answers / total_answers

                # Если успешность ответов низкая (<35%), создаем инсайт
                if success_rate < 0.35:
                    # Обновляем или создаем метрику сложности вопроса
                    QuestionDifficultyMetric.objects.update_or_create(
                        question=question,
                        test=question.test,
                        defaults={
                            'attempts_count': total_answers,
                            'success_rate': success_rate,
                            'difficulty_score': 1 - success_rate,
                            'calculated_at': timezone.now()
                        }
                    )

                    insight = TrainingInsight(
                        title=f"Проблемный вопрос в тесте: {question.test.title}",
                        description=f"Только {success_rate*100:.1f}% пользователей правильно отвечают на вопрос: '{question.text[:100]}...' "
                        f"Рекомендуется проверить корректность вопроса и вариантов ответа.",
                        insight_type=TrainingInsight.InsightType.PROBLEMATIC_TEST,
                        severity=min(1.0, (1 - success_rate) * 1.3),
                        question=question,
                        test=question.test,
                        step=question.test.step
                    )
                    insights.append(insight)

        # Сохраняем все инсайты
        if insights:
            TrainingInsight.objects.bulk_create(insights)
            return len(insights)

        return 0

    @staticmethod
    def analyze_struggling_users(min_tests_threshold=3):
        """
        Анализирует пользователей, испытывающих системные трудности в обучении
        """
        insights = []

        # Получаем пользователей, прошедших хотя бы минимальное количество тестов
        users_with_results = User.objects.annotate(
            tests_count=Count('lms_test_results')
        ).filter(
            tests_count__gte=min_tests_threshold
        )

        for user in users_with_results:
            # Получаем результаты тестов для пользователя
            user_results = LMSUserTestResult.objects.filter(user=user)

            # Рассчитываем общую долю неудачных попыток
            failure_rate = user_results.filter(
                is_passed=False).count() / user_results.count()

            # Рассчитываем среднюю оценку в процентах
            avg_score_percent = user_results.aggregate(
                avg_score=Sum('score') * 100.0 / Sum('max_score')
            )['avg_score'] or 0

            # Если доля неудачных попыток высока (>40%) или средняя оценка низкая (<60%)
            if failure_rate > 0.4 or avg_score_percent < 60:
                department = None
                # Пытаемся получить департамент пользователя
                try:
                    department = user.profile.department
                except:
                    pass

                # Формируем описание проблемы
                description = f"Пользователь {user.email} испытывает системные трудности в обучении. "

                if failure_rate > 0.4:
                    description += f"Не проходит {failure_rate*100:.1f}% тестов. "

                if avg_score_percent < 60:
                    description += f"Средняя оценка по тестам составляет всего {avg_score_percent:.1f}%. "

                description += "Рекомендуется обратить внимание и предоставить дополнительную помощь."

                # Определяем уровень серьезности проблемы
                severity = max(min(1.0, (failure_rate * 1.5)),
                               min(1.0, (1 - avg_score_percent/100) * 1.2))

                insight = TrainingInsight(
                    title=f"Пользователь с трудностями в обучении: {user.email}",
                    description=description,
                    insight_type=TrainingInsight.InsightType.STRUGGLING_USER,
                    severity=severity,
                    user=user,
                    department=department
                )
                insights.append(insight)

        # Сохраняем все инсайты
        if insights:
            TrainingInsight.objects.bulk_create(insights)
            return len(insights)

        return 0

    @staticmethod
    def analyze_department_patterns():
        """
        Анализирует паттерны производительности обучения по департаментам
        """
        insights = []

        # Получаем все департаменты с активными пользователями
        departments = Department.objects.filter(
            employees__isnull=False,
            is_active=True
        ).distinct()

        for department in departments:
            # Получаем пользователей из этого департамента
            users = User.objects.filter(profile__department=department)

            if users.count() < 3:  # Пропускаем слишком маленькие департаменты
                continue

            # Агрегируем результаты тестов по этому департаменту
            test_results = LMSUserTestResult.objects.filter(user__in=users)

            if test_results.count() < 10:  # Недостаточно данных для анализа
                continue

            # Рассчитываем метрики
            avg_success_rate = test_results.filter(
                is_passed=True).count() / test_results.count()

            # Находим самый проблемный шаг для департамента
            problematic_steps = OnboardingStep.objects.filter(
                lms_tests__user_results__user__in=users
            ).annotate(
                failure_count=Count('lms_tests__user_results',
                                    filter=Q(lms_tests__user_results__is_passed=False)),
                total_count=Count('lms_tests__user_results')
            ).filter(total_count__gt=0)

            most_problematic_step = None
            highest_failure_rate = 0

            for step in problematic_steps:
                if step.total_count > 0:
                    failure_rate = step.failure_count / step.total_count
                    if failure_rate > highest_failure_rate and failure_rate > 0.3:
                        highest_failure_rate = failure_rate
                        most_problematic_step = step

            # Обновляем или создаем метрику для департамента
            metrics, created = DepartmentLearningMetric.objects.update_or_create(
                department=department,
                defaults={
                    'user_count': users.count(),
                    'avg_test_completion_rate': avg_success_rate,
                    'avg_correct_answer_rate': test_results.aggregate(
                        avg_score=Avg(F('score') * 1.0 / F('max_score'))
                    )['avg_score'] or 0,
                    'most_problematic_step': most_problematic_step,
                    'problematic_step_failure_rate': highest_failure_rate,
                    'calculated_at': timezone.now()
                }
            )

            # Если обнаружены значительные проблемы, создаем инсайт
            if avg_success_rate < 0.7 or highest_failure_rate > 0.4:
                description = f"Департамент {department.name} показывает низкие результаты обучения. "

                if avg_success_rate < 0.7:
                    description += f"Общая доля успешных тестов всего {avg_success_rate*100:.1f}%. "

                if most_problematic_step and highest_failure_rate > 0.4:
                    description += f"Особые трудности вызывает шаг '{most_problematic_step.name}' "
                    description += f"(не проходят {highest_failure_rate*100:.1f}% попыток). "

                description += "Рекомендуется пересмотреть материалы обучения или провести дополнительные тренинги."

                insight = TrainingInsight(
                    title=f"Системные проблемы в обучении департамента: {department.name}",
                    description=description,
                    insight_type=TrainingInsight.InsightType.DEPARTMENT_PATTERN,
                    severity=min(1.0, (1 - avg_success_rate) * 1.4),
                    department=department,
                    step=most_problematic_step
                )
                insights.append(insight)

        # Сохраняем все инсайты
        if insights:
            TrainingInsight.objects.bulk_create(insights)
            return len(insights)

        return 0

    @staticmethod
    def analyze_time_anomalies():
        """
        Анализирует аномалии во времени выполнения тестов
        """
        insights = []

        # Получаем данные о времени выполнения тестов с расширенными настройками
        test_attempts = UserTestAttempt.objects.filter(
            completed_at__isnull=False
        )

        # Агрегируем средние показатели по каждому тесту
        tests_with_attempts = LMSTest.objects.annotate(
            attempts_count=Count('user_attempts', distinct=True),
            avg_time=Avg('user_attempts__time_spent_seconds')
        ).filter(attempts_count__gte=5)  # Минимум 5 попыток для анализа

        for test in tests_with_attempts:
            # Находим аномально долгие попытки (превышающие среднее время на 200%)
            long_attempts = test_attempts.filter(
                test=test,
                time_spent_seconds__gt=test.avg_time * 3
            )

            # Находим аномально быстрые попытки (менее 30% от среднего времени)
            quick_attempts = test_attempts.filter(
                test=test,
                time_spent_seconds__lt=test.avg_time * 0.3
            )

            if long_attempts.count() > test.attempts_count * 0.15:
                # Более 15% попыток аномально долгие
                description = (f"Тест '{test.title}' часто занимает гораздо больше времени, чем ожидалось. "
                               f"{long_attempts.count()} из {test.attempts_count} попыток превышают среднее время в 3 и более раз. "
                               f"Рекомендуется проверить сложность теста или сделать материалы более доступными.")

                insight = TrainingInsight(
                    title=f"Аномально долгое время выполнения теста: {test.title}",
                    description=description,
                    insight_type=TrainingInsight.InsightType.TIME_ANOMALY,
                    severity=min(1.0, long_attempts.count() /
                                 test.attempts_count * 1.5),
                    test=test,
                    step=test.step
                )
                insights.append(insight)

            if quick_attempts.count() > test.attempts_count * 0.2 and quick_attempts.filter(is_passed=True).count() > 0:
                # Более 20% попыток аномально быстрые и среди них есть успешные
                description = (f"Тест '{test.title}' часто выполняется подозрительно быстро. "
                               f"{quick_attempts.count()} из {test.attempts_count} попыток занимают менее 30% от среднего времени. "
                               f"Возможно, тест слишком простой или ответы известны заранее.")

                insight = TrainingInsight(
                    title=f"Подозрительно быстрое выполнение теста: {test.title}",
                    description=description,
                    insight_type=TrainingInsight.InsightType.TIME_ANOMALY,
                    severity=min(0.8, quick_attempts.filter(
                        is_passed=True).count() / test.attempts_count * 1.2),
                    test=test,
                    step=test.step
                )
                insights.append(insight)

        # Сохраняем все инсайты
        if insights:
            TrainingInsight.objects.bulk_create(insights)
            return len(insights)

        return 0

    @staticmethod
    def run_all_analysis():
        """
        Запускает все доступные методы анализа и возвращает общее количество созданных инсайтов
        """
        total_insights = 0

        # Запускаем все методы анализа
        total_insights += TrainingInsightsService.analyze_difficult_steps()
        total_insights += TrainingInsightsService.analyze_problematic_questions()
        total_insights += TrainingInsightsService.analyze_struggling_users()
        total_insights += TrainingInsightsService.analyze_department_patterns()
        total_insights += TrainingInsightsService.analyze_time_anomalies()

        return total_insights

    @staticmethod
    def calculate_user_metrics(user):
        """
        Рассчитывает и обновляет метрики обучения для пользователя
        """
        # Получаем активные назначения пользователя
        assignments = UserOnboardingAssignment.objects.filter(user=user)

        for assignment in assignments:
            # Получаем все шаги типа "обучение" из программы
            training_steps = OnboardingStep.objects.filter(
                program=assignment.program,
                step_type='training'
            )

            # Для каждого шага обучения собираем и обновляем метрики
            for step in training_steps:
                # Получаем результаты тестов для этого шага
                test_results = LMSUserTestResult.objects.filter(
                    user=user,
                    test__step=step
                )

                # Получаем попытки тестов для этого шага
                test_attempts = UserTestAttempt.objects.filter(
                    user=user,
                    test__step=step
                )

                if not test_results.exists():
                    continue  # Пропускаем, если нет данных

                # Рассчитываем метрики
                metrics = {
                    'avg_time_per_test': test_attempts.filter(completed_at__isnull=False).aggregate(
                        avg_time=Avg('time_spent_seconds')
                    )['avg_time'] or 0,

                    'avg_attempts_per_test': test_results.count() / step.lms_tests.count() if step.lms_tests.count() > 0 else 0,

                    'correct_answer_rate': test_results.aggregate(
                        avg_score=Sum('score') * 1.0 / Sum('max_score')
                    )['avg_score'] or 0,

                    'test_completion_rate': test_results.filter(is_passed=True).count() / test_results.count() if test_results.count() > 0 else 0,

                    'learning_speed_index': 0,  # Рассчитаем позже после сравнения с другими пользователями
                    'calculated_at': timezone.now()
                }

                # Обновляем или создаем метрику для пользователя и шага
                UserLearningMetric.objects.update_or_create(
                    user=user,
                    assignment=assignment,
                    step=step,
                    defaults=metrics
                )

            # Рассчитываем обобщенные метрики для всей программы
            all_test_results = LMSUserTestResult.objects.filter(
                user=user,
                step__program=assignment.program
            )

            all_test_attempts = UserTestAttempt.objects.filter(
                user=user,
                test__step__program=assignment.program
            )

            if all_test_results.exists():
                overall_metrics = {
                    'avg_time_per_test': all_test_attempts.filter(completed_at__isnull=False).aggregate(
                        avg_time=Avg('time_spent_seconds')
                    )['avg_time'] or 0,

                    'avg_attempts_per_test': all_test_results.values('test').distinct().count() / OnboardingStep.objects.filter(
                        program=assignment.program,
                        step_type='training',
                        lms_tests__isnull=False
                    ).distinct().count() if OnboardingStep.objects.filter(
                        program=assignment.program,
                        step_type='training',
                        lms_tests__isnull=False
                    ).distinct().count() > 0 else 0,

                    'correct_answer_rate': all_test_results.aggregate(
                        avg_score=Sum('score') * 1.0 / Sum('max_score')
                    )['avg_score'] or 0,

                    'test_completion_rate': all_test_results.filter(is_passed=True).count() / all_test_results.count() if all_test_results.count() > 0 else 0,

                    'learning_speed_index': 0,  # Рассчитаем позже
                    'calculated_at': timezone.now()
                }

                # Обновляем или создаем общую метрику для пользователя по программе
                UserLearningMetric.objects.update_or_create(
                    user=user,
                    assignment=assignment,
                    step=None,  # Общая метрика для всей программы
                    defaults=overall_metrics
                )

        return True

    @staticmethod
    def calculate_learning_speed_indices():
        """
        Рассчитывает индексы скорости обучения для всех пользователей относительно друг друга
        """
        # Получаем все метрики, где step=None (общие метрики по программам)
        overall_metrics = UserLearningMetric.objects.filter(step__isnull=True)

        # Для каждой программы рассчитываем относительные индексы
        programs = UserOnboardingAssignment.objects.values_list(
            'program', flat=True).distinct()

        for program_id in programs:
            program_metrics = overall_metrics.filter(
                assignment__program_id=program_id)

            if program_metrics.count() < 3:  # Недостаточно данных для сравнения
                continue

            # Рассчитываем средние показатели для этой программы
            avg_time = program_metrics.aggregate(
                avg_time=Avg('avg_time_per_test'))['avg_time'] or 1
            avg_attempts = program_metrics.aggregate(
                avg_attempts=Avg('avg_attempts_per_test'))['avg_attempts'] or 1

            for metric in program_metrics:
                # Формула индекса скорости: соотношение времени и правильности
                # Меньше времени и попыток на тест + высокая правильность = высокий индекс скорости
                if metric.avg_time_per_test > 0 and avg_time > 0:
                    time_factor = avg_time / metric.avg_time_per_test
                else:
                    time_factor = 1

                if metric.avg_attempts_per_test > 0 and avg_attempts > 0:
                    attempt_factor = avg_attempts / metric.avg_attempts_per_test
                else:
                    attempt_factor = 1

                # Расчет индекса: правильность ответов * (скорость / средняя скорость) * (попытки / средние попытки)
                # Нормализуем в диапазоне 0-1, где 1 = лучше среднего, 0.5 = средний, <0.5 = хуже среднего
                learning_speed_index = (
                    metric.correct_answer_rate * 0.6 +
                    time_factor * 0.25 +
                    attempt_factor * 0.15
                )

                # Обновляем индекс скорости обучения
                metric.learning_speed_index = min(
                    1.0, max(0.0, learning_speed_index))
                metric.save(update_fields=['learning_speed_index'])

        return True
