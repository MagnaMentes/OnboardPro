"""
Сервисы для анализа трендов обратной связи и генерации алертов
"""
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Count, F, Q, Sum
from django.db import transaction
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
import openai
import os
from django.conf import settings

from ..models import FeedbackTemplate, UserFeedback, FeedbackInsight
from ..dashboard_models import FeedbackTrendSnapshot, FeedbackTrendRule, FeedbackTrendAlert
from departments.models import Department
from .ai_insights_service import FeedbackAIInsightsService


class FeedbackTrendAnalyzerService:
    """
    Сервис для анализа трендов в обратной связи и создания исторических срезов
    """

    @staticmethod
    def create_daily_snapshots():
        """
        Создает ежедневные снимки трендов для всех шаблонов и департаментов
        """
        today = timezone.now().date()
        snapshots_created = 0

        # Сначала создаем глобальный снимок по всем отзывам
        global_snapshot = FeedbackTrendAnalyzerService._create_snapshot(
            template=None, department=None, date=today)
        if global_snapshot:
            snapshots_created += 1

        # Создаем снимки по каждому шаблону
        templates = FeedbackTemplate.objects.all()
        for template in templates:
            template_snapshot = FeedbackTrendAnalyzerService._create_snapshot(
                template=template, department=None, date=today)
            if template_snapshot:
                snapshots_created += 1

        # Создаем снимки по каждому департаменту
        departments = Department.objects.filter(is_active=True)
        for department in departments:
            dept_snapshot = FeedbackTrendAnalyzerService._create_snapshot(
                template=None, department=department, date=today)
            if dept_snapshot:
                snapshots_created += 1

            # Создаем снимки по каждому шаблону + департаменту
            for template in templates:
                combination_snapshot = FeedbackTrendAnalyzerService._create_snapshot(
                    template=template, department=department, date=today)
                if combination_snapshot:
                    snapshots_created += 1

        return snapshots_created

    @staticmethod
    def _create_snapshot(template=None, department=None, date=None):
        """
        Создает снимок тренда для заданного шаблона и/или департамента

        Args:
            template: FeedbackTemplate или None для всех шаблонов
            department: Department или None для всех департаментов
            date: Дата снимка или None для сегодняшней даты

        Returns:
            FeedbackTrendSnapshot или None, если нет данных для снимка
        """
        if date is None:
            date = timezone.now().date()

        # Фильтруем обратную связь за последние 7 дней
        end_date = date
        start_date = end_date - timedelta(days=7)

        feedbacks_query = UserFeedback.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        # Применяем фильтры по шаблону и департаменту
        if template:
            feedbacks_query = feedbacks_query.filter(template=template)

        if department:
            feedbacks_query = feedbacks_query.filter(
                Q(user__profile__department=department) |
                Q(submitter__profile__department=department)
            )

        # Проверяем, есть ли данные для снимка
        feedback_count = feedbacks_query.count()
        if feedback_count < 3:  # Минимальный порог для создания снимка
            return None

        # Рассчитываем метрики
        # 1. Средний sentiment_score из FeedbackInsight
        sentiment_insights = FeedbackInsight.objects.filter(
            feedback__in=feedbacks_query,
            type=FeedbackInsight.InsightType.SATISFACTION
        )

        avg_sentiment = 0.0
        if sentiment_insights.exists():
            # Извлекаем числовые значения из текстовых инсайтов
            sentiment_values = []
            for insight in sentiment_insights:
                try:
                    # Формат "Satisfaction Index: 85/100. Excellent feedback."
                    import re
                    score_match = re.search(r'(\d+)/100', insight.content)
                    if score_match:
                        score = int(score_match.group(1)) / 100.0
                        sentiment_values.append(score)
                except Exception as e:
                    print(f"Error extracting sentiment score: {e}")

            if sentiment_values:
                avg_sentiment = sum(sentiment_values) / len(sentiment_values)

        # 2. Получаем ключевые темы и проблемы через AI
        main_topics, common_issues = FeedbackTrendAnalyzerService._analyze_topics_and_issues(
            feedbacks_query)

        # 3. Рассчитываем индекс удовлетворенности на основе шкальных ответов
        satisfaction_index = FeedbackTrendAnalyzerService._calculate_satisfaction_index(
            feedbacks_query)

        # Создаем или обновляем снимок
        snapshot, created = FeedbackTrendSnapshot.objects.update_or_create(
            template=template,
            department=department,
            date=date,
            defaults={
                'sentiment_score': avg_sentiment,
                'response_count': feedback_count,
                'main_topics': main_topics,
                'common_issues': common_issues,
                'satisfaction_index': satisfaction_index,
            }
        )

        return snapshot

    @staticmethod
    def _analyze_topics_and_issues(feedbacks):
        """
        Анализирует ключевые темы и проблемы в отзывах с помощью AI

        Args:
            feedbacks: QuerySet с объектами UserFeedback

        Returns:
            tuple: (main_topics, common_issues) в виде JSON-структур
        """
        # Готовим данные для анализа
        feedback_data = []
        for feedback in feedbacks[:50]:  # Ограничиваем количество для анализа
            answers_data = []
            for answer in feedback.answers.all():
                if answer.question.type == 'text' and answer.text_answer:
                    answers_data.append({
                        'question': answer.question.text,
                        'answer': answer.text_answer
                    })

            if answers_data:
                feedback_data.append({
                    'id': feedback.id,
                    'answers': answers_data
                })

        if not feedback_data:
            return {}, {}

        try:
            # Получаем API ключ
            api_key = getattr(settings, 'OPENAI_API_KEY',
                              os.getenv('OPENAI_API_KEY'))
            if not api_key:
                return {}, {}

            # Создаем модель
            llm = ChatOpenAI(
                openai_api_key=api_key,
                model_name="gpt-3.5-turbo",
                temperature=0.2
            )

            # Анализ тем
            topics_prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that analyzes feedback data to identify main topics. "
                 "Extract 3-5 main topics mentioned across multiple feedback responses."),
                ("human", f"Please analyze these {len(feedback_data)} feedback responses and identify the main topics:\n\n"
                 f"{json.dumps(feedback_data[:20], indent=2)}\n\n"
                 f"Return a JSON object with topics as keys and frequency counts as values.")
            ])

            topics_chain = LLMChain(llm=llm, prompt=topics_prompt)
            topics_result = topics_chain.run({})

            # Извлекаем JSON из ответа
            import re
            topics_json_match = re.search(r'\{.*\}', topics_result, re.DOTALL)
            main_topics = {}
            if topics_json_match:
                try:
                    main_topics = json.loads(topics_json_match.group(0))
                except json.JSONDecodeError:
                    main_topics = {'parsing_error': topics_result}
            else:
                main_topics = {'text_response': topics_result}

            # Анализ проблем
            issues_prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that analyzes feedback data to identify common issues and problems. "
                 "Extract 3-5 main issues mentioned across multiple feedback responses."),
                ("human", f"Please analyze these {len(feedback_data)} feedback responses and identify common issues or problems:\n\n"
                 f"{json.dumps(feedback_data[:20], indent=2)}\n\n"
                 f"Return a JSON object with issues as keys and frequency counts as values.")
            ])

            issues_chain = LLMChain(llm=llm, prompt=issues_prompt)
            issues_result = issues_chain.run({})

            # Извлекаем JSON из ответа
            issues_json_match = re.search(r'\{.*\}', issues_result, re.DOTALL)
            common_issues = {}
            if issues_json_match:
                try:
                    common_issues = json.loads(issues_json_match.group(0))
                except json.JSONDecodeError:
                    common_issues = {'parsing_error': issues_result}
            else:
                common_issues = {'text_response': issues_result}

            return main_topics, common_issues
        except Exception as e:
            print(f"Error in _analyze_topics_and_issues: {e}")
            return {}, {}

    @staticmethod
    def _calculate_satisfaction_index(feedbacks):
        """
        Рассчитывает индекс удовлетворенности на основе ответов по шкале

        Args:
            feedbacks: QuerySet с объектами UserFeedback

        Returns:
            float: Индекс удовлетворенности от 0 до 1
        """
        from ..models import FeedbackAnswer, FeedbackQuestion

        # Находим ответы на шкальные вопросы
        scale_answers = FeedbackAnswer.objects.filter(
            feedback__in=feedbacks,
            question__type=FeedbackQuestion.QuestionType.SCALE,
            scale_answer__isnull=False
        )

        if not scale_answers.exists():
            # Если нет шкальных ответов, возвращаем значение по умолчанию
            return 0.5

        # Предполагаем, что шкала от 1 до 10
        total_score = sum(answer.scale_answer for answer in scale_answers)
        max_possible = len(scale_answers) * 10  # Максимально возможная оценка

        if max_possible > 0:
            return total_score / max_possible
        else:
            return 0.5


class FeedbackAlertEngine:
    """
    Сервис для проверки правил трендов и генерации алертов
    """

    @staticmethod
    def check_all_rules():
        """
        Проверяет все активные правила и создает алерты при необходимости

        Returns:
            int: Количество созданных алертов
        """
        active_rules = FeedbackTrendRule.objects.filter(is_active=True)
        alerts_created = 0

        for rule in active_rules:
            alerts = FeedbackAlertEngine.check_rule(rule)
            alerts_created += len(alerts)

        return alerts_created

    @staticmethod
    def check_rule(rule):
        """
        Проверяет конкретное правило и создает алерты при необходимости

        Args:
            rule: Объект FeedbackTrendRule для проверки

        Returns:
            list: Список созданных алертов
        """
        today = timezone.now().date()

        # Определяем период сравнения на основе правила
        period_days = rule.measurement_period_days
        if period_days < 1:
            period_days = 7  # Минимальный период - неделя

        comparison_date = today - timedelta(days=period_days)

        # Определяем шаблоны для проверки
        templates_to_check = list(rule.templates.all())
        if not templates_to_check:  # Если не указаны, проверяем все шаблоны
            templates_to_check = [None]  # None означает глобальный снимок

        # Определяем департаменты для проверки
        departments_to_check = list(rule.departments.all())
        if not departments_to_check:  # Если не указаны, проверяем все департаменты
            departments_to_check = [None]  # None означает все департаменты

        created_alerts = []

        # Проверяем каждую комбинацию шаблон+департамент
        for template in templates_to_check:
            for department in departments_to_check:
                # Получаем текущий и предыдущий снимки
                current_snapshot = FeedbackTrendSnapshot.objects.filter(
                    template=template,
                    department=department,
                    date__lte=today
                ).order_by('-date').first()

                previous_snapshot = FeedbackTrendSnapshot.objects.filter(
                    template=template,
                    department=department,
                    date__lte=comparison_date
                ).order_by('-date').first()

                # Если нет одного из снимков, не можем сравнивать
                if not current_snapshot or not previous_snapshot:
                    continue

                # Проверяем значения в зависимости от типа правила
                alert = None

                if rule.rule_type == FeedbackTrendRule.RuleType.SENTIMENT_DROP:
                    if (previous_snapshot.sentiment_score - current_snapshot.sentiment_score) >= rule.threshold:
                        # Создаем алерт о падении настроений
                        alert = FeedbackAlertEngine._create_sentiment_drop_alert(
                            rule, template, department, current_snapshot, previous_snapshot)

                elif rule.rule_type == FeedbackTrendRule.RuleType.SATISFACTION_DROP:
                    if (previous_snapshot.satisfaction_index - current_snapshot.satisfaction_index) >= rule.threshold:
                        # Создаем алерт о падении удовлетворенности
                        alert = FeedbackAlertEngine._create_satisfaction_drop_alert(
                            rule, template, department, current_snapshot, previous_snapshot)

                elif rule.rule_type == FeedbackTrendRule.RuleType.RESPONSE_RATE_DROP:
                    # Рассчитываем относительное падение
                    if previous_snapshot.response_count > 0:
                        drop_percent = (previous_snapshot.response_count -
                                        current_snapshot.response_count) / previous_snapshot.response_count
                        if drop_percent >= rule.threshold:
                            # Создаем алерт о падении количества ответов
                            alert = FeedbackAlertEngine._create_response_rate_drop_alert(
                                rule, template, department, current_snapshot, previous_snapshot, drop_percent)

                elif rule.rule_type == FeedbackTrendRule.RuleType.ISSUE_FREQUENCY_RISE:
                    alert = FeedbackAlertEngine._check_issue_frequency_rise(
                        rule, template, department, current_snapshot, previous_snapshot)

                elif rule.rule_type == FeedbackTrendRule.RuleType.TOPIC_SHIFT:
                    alert = FeedbackAlertEngine._check_topic_shift(
                        rule, template, department, current_snapshot, previous_snapshot)

                if alert:
                    created_alerts.append(alert)

        return created_alerts

    @staticmethod
    def _create_sentiment_drop_alert(rule, template, department, current, previous):
        """Создает алерт о падении настроений"""
        title = "Снижение настроений в обратной связи"

        # Добавляем контекст в заголовок
        if template:
            title += f" для '{template.title}'"
        if department:
            title += f" в отделе '{department.name}'"

        # Рассчитываем изменение в процентах
        pct_change = 0
        if previous.sentiment_score > 0:
            pct_change = ((previous.sentiment_score -
                          current.sentiment_score) / previous.sentiment_score) * 100

        description = (
            f"Обнаружено значительное снижение настроений в обратной связи. "
            f"Предыдущее значение: {previous.sentiment_score:.2f}, "
            f"Текущее значение: {current.sentiment_score:.2f}. "
            f"Изменение: {pct_change:.1f}%."
        )

        # Определяем серьезность на основе процента изменения
        severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        if pct_change >= 50:
            severity = FeedbackTrendAlert.AlertSeverity.CRITICAL
        elif pct_change >= 25:
            severity = FeedbackTrendAlert.AlertSeverity.HIGH
        elif pct_change >= 10:
            severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        else:
            severity = FeedbackTrendAlert.AlertSeverity.LOW

        return FeedbackTrendAlert.objects.create(
            rule=rule,
            template=template,
            department=department,
            title=title,
            description=description,
            severity=severity,
            previous_value=previous.sentiment_score,
            current_value=current.sentiment_score,
            percentage_change=pct_change
        )

    @staticmethod
    def _create_satisfaction_drop_alert(rule, template, department, current, previous):
        """Создает алерт о падении удовлетворенности"""
        title = "Снижение удовлетворенности в обратной связи"

        # Добавляем контекст в заголовок
        if template:
            title += f" для '{template.title}'"
        if department:
            title += f" в отделе '{department.name}'"

        # Рассчитываем изменение в процентах
        pct_change = 0
        if previous.satisfaction_index > 0:
            pct_change = ((previous.satisfaction_index -
                          current.satisfaction_index) / previous.satisfaction_index) * 100

        description = (
            f"Обнаружено значительное снижение индекса удовлетворенности в обратной связи. "
            f"Предыдущее значение: {previous.satisfaction_index:.2f}, "
            f"Текущее значение: {current.satisfaction_index:.2f}. "
            f"Изменение: {pct_change:.1f}%."
        )

        # Определяем серьезность на основе процента изменения
        severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        if pct_change >= 40:
            severity = FeedbackTrendAlert.AlertSeverity.CRITICAL
        elif pct_change >= 20:
            severity = FeedbackTrendAlert.AlertSeverity.HIGH
        elif pct_change >= 10:
            severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        else:
            severity = FeedbackTrendAlert.AlertSeverity.LOW

        return FeedbackTrendAlert.objects.create(
            rule=rule,
            template=template,
            department=department,
            title=title,
            description=description,
            severity=severity,
            previous_value=previous.satisfaction_index,
            current_value=current.satisfaction_index,
            percentage_change=pct_change
        )

    @staticmethod
    def _create_response_rate_drop_alert(rule, template, department, current, previous, drop_percent):
        """Создает алерт о падении количества ответов"""
        title = "Снижение количества ответов обратной связи"

        # Добавляем контекст в заголовок
        if template:
            title += f" для '{template.title}'"
        if department:
            title += f" в отделе '{department.name}'"

        # Преобразуем в проценты для отображения
        pct_change = drop_percent * 100

        description = (
            f"Обнаружено значительное снижение количества предоставленной обратной связи. "
            f"Предыдущее значение: {previous.response_count}, "
            f"Текущее значение: {current.response_count}. "
            f"Изменение: {pct_change:.1f}%."
        )

        # Определяем серьезность на основе процента изменения
        severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        if pct_change >= 50:
            severity = FeedbackTrendAlert.AlertSeverity.HIGH
        elif pct_change >= 25:
            severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
        else:
            severity = FeedbackTrendAlert.AlertSeverity.LOW

        return FeedbackTrendAlert.objects.create(
            rule=rule,
            template=template,
            department=department,
            title=title,
            description=description,
            severity=severity,
            previous_value=float(previous.response_count),
            current_value=float(current.response_count),
            percentage_change=pct_change
        )

    @staticmethod
    def _check_issue_frequency_rise(rule, template, department, current, previous):
        """
        Проверяет рост частоты упоминания проблем
        """
        # Если у нас нет данных о проблемах, не можем оценить
        if not current.common_issues or not previous.common_issues:
            return None

        # Сравниваем общие проблемы между снимками
        # Находим проблемы с наибольшим ростом
        max_rise = 0
        rising_issue = None

        for issue, current_freq in current.common_issues.items():
            # Пытаемся получить числовое значение для текущей проблемы
            try:
                current_value = float(current_freq)
            except (ValueError, TypeError):
                # Если не числовое, пропускаем
                continue

            # Ищем эту же проблему в предыдущем снимке
            previous_value = 0
            if issue in previous.common_issues:
                try:
                    previous_value = float(previous.common_issues[issue])
                except (ValueError, TypeError):
                    # Если не числовое, считаем что раньше было 0
                    previous_value = 0

            # Рассчитываем рост
            if previous_value > 0:
                rise_percent = (
                    current_value - previous_value) / previous_value
            else:
                # Если ранее проблема не встречалась, считаем это за 100% рост
                rise_percent = 1.0

            # Если рост выше порогового значения и больше предыдущего максимума
            if rise_percent >= rule.threshold and rise_percent > max_rise:
                max_rise = rise_percent
                rising_issue = issue

        # Если нашли растущую проблему, создаем алерт
        if rising_issue:
            title = f"Рост упоминания проблемы: {rising_issue}"

            # Добавляем контекст в заголовок
            if template:
                title += f" для '{template.title}'"
            if department:
                title += f" в отделе '{department.name}'"

            pct_change = max_rise * 100

            description = (
                f"Обнаружено значительное увеличение упоминания проблемы '{rising_issue}' в обратной связи. "
                f"Предыдущее значение: {previous.common_issues.get(rising_issue, 0)}, "
                f"Текущее значение: {current.common_issues[rising_issue]}. "
                f"Рост: {pct_change:.1f}%."
            )

            # Определяем серьезность на основе процента изменения
            severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
            if pct_change >= 200:  # трехкратный рост
                severity = FeedbackTrendAlert.AlertSeverity.CRITICAL
            elif pct_change >= 100:  # двукратный рост
                severity = FeedbackTrendAlert.AlertSeverity.HIGH
            else:
                severity = FeedbackTrendAlert.AlertSeverity.MEDIUM

            try:
                prev_val = float(previous.common_issues.get(rising_issue, 0))
                curr_val = float(current.common_issues[rising_issue])

                return FeedbackTrendAlert.objects.create(
                    rule=rule,
                    template=template,
                    department=department,
                    title=title,
                    description=description,
                    severity=severity,
                    previous_value=prev_val,
                    current_value=curr_val,
                    percentage_change=pct_change
                )
            except (ValueError, TypeError):
                # Если не удалось преобразовать значения в числа
                return FeedbackTrendAlert.objects.create(
                    rule=rule,
                    template=template,
                    department=department,
                    title=title,
                    description=description,
                    severity=severity
                )

        return None

    @staticmethod
    def _check_topic_shift(rule, template, department, current, previous):
        """
        Проверяет смещение в основных темах обратной связи
        """
        if not current.main_topics or not previous.main_topics:
            return None

        # Определяем новые темы, которых не было в предыдущем снимке
        new_topics = [
            topic for topic in current.main_topics if topic not in previous.main_topics]

        # Определяем исчезнувшие темы
        gone_topics = [
            topic for topic in previous.main_topics if topic not in current.main_topics]

        # Определяем количество изменившихся тем
        total_topics = set(list(current.main_topics.keys()) +
                           list(previous.main_topics.keys()))
        if not total_topics:
            return None

        changed_topics = len(new_topics) + len(gone_topics)
        change_ratio = changed_topics / len(total_topics)

        # Если изменения превышают пороговое значение
        if change_ratio >= rule.threshold:
            title = "Значительное изменение в темах обратной связи"

            # Добавляем контекст в заголовок
            if template:
                title += f" для '{template.title}'"
            if department:
                title += f" в отделе '{department.name}'"

            pct_change = change_ratio * 100

            # Формируем описание изменений
            new_topics_str = ", ".join(new_topics[:3])
            gone_topics_str = ", ".join(gone_topics[:3])

            description = f"Обнаружено значительное изменение в темах обратной связи ({pct_change:.1f}%).\n"

            if new_topics:
                description += f"Новые темы: {new_topics_str}"
                if len(new_topics) > 3:
                    description += f" и еще {len(new_topics)-3}"
                description += ".\n"

            if gone_topics:
                description += f"Исчезнувшие темы: {gone_topics_str}"
                if len(gone_topics) > 3:
                    description += f" и еще {len(gone_topics)-3}"
                description += "."

            # Определяем серьезность на основе процента изменения
            severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
            if pct_change >= 75:
                severity = FeedbackTrendAlert.AlertSeverity.HIGH
            elif pct_change >= 50:
                severity = FeedbackTrendAlert.AlertSeverity.MEDIUM
            else:
                severity = FeedbackTrendAlert.AlertSeverity.LOW

            return FeedbackTrendAlert.objects.create(
                rule=rule,
                template=template,
                department=department,
                title=title,
                description=description,
                severity=severity,
                percentage_change=pct_change
            )

        return None
