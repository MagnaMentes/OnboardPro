import os
import json
import openai
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from django.conf import settings
from ..models import FeedbackInsight


class FeedbackAIInsightsService:
    """
    Сервис для анализа обратной связи с помощью AI
    """

    @staticmethod
    def analyze_feedback(user_feedback):
        """
        Анализирует конкретную запись обратной связи и создает инсайты

        Args:
            user_feedback: Объект UserFeedback для анализа

        Returns:
            list: Список созданных инсайтов
        """
        try:
            # Подготавливаем данные для анализа
            answers = user_feedback.answers.all()
            if not answers:
                return []

            # Создаем структурированный словарь с ответами
            feedback_data = {
                'template_title': user_feedback.template.title,
                'answers': []
            }

            for answer in answers:
                answer_data = {
                    'question': answer.question.text,
                    'type': answer.question.type
                }

                # В зависимости от типа вопроса берем соответствующее значение
                if answer.question.type == 'text':
                    answer_data['value'] = answer.text_answer
                elif answer.question.type == 'scale':
                    answer_data['value'] = answer.scale_answer
                elif answer.question.type == 'multiple_choice':
                    answer_data['value'] = answer.choice_answer

                feedback_data['answers'].append(answer_data)

            # Создаем инсайты на основе данных
            insights = []

            # Создаем summary
            summary_insight = FeedbackAIInsightsService._generate_summary(
                feedback_data, user_feedback)
            if summary_insight:
                insights.append(summary_insight)

            # Идентифицируем проблемные зоны
            problem_areas = FeedbackAIInsightsService._identify_problem_areas(
                feedback_data, user_feedback)
            if problem_areas:
                insights.extend(problem_areas)

            # Выявляем риски
            risks = FeedbackAIInsightsService._identify_risks(
                feedback_data, user_feedback)
            if risks:
                insights.extend(risks)

            # Вычисляем индекс удовлетворенности
            satisfaction = FeedbackAIInsightsService._calculate_satisfaction_index(
                feedback_data, user_feedback)
            if satisfaction:
                insights.append(satisfaction)

            return insights

        except Exception as e:
            print(f"Error in FeedbackAIInsightsService.analyze_feedback: {e}")
            return []

    @staticmethod
    def analyze_template_feedback(template):
        """
        Создает агрегированные инсайты по всем записям обратной связи для шаблона

        Args:
            template: Объект FeedbackTemplate для анализа

        Returns:
            list: Список созданных инсайтов
        """
        try:
            # Получаем все отзывы по этому шаблону
            feedbacks = template.user_feedbacks.all()
            if not feedbacks:
                return []

            # Подготавливаем агрегированные данные
            aggregated_data = {
                'template_title': template.title,
                'feedback_count': feedbacks.count(),
                'feedbacks': []
            }

            for feedback in feedbacks:
                feedback_data = {
                    'user_id': feedback.user.id,
                    'answers': []
                }

                for answer in feedback.answers.all():
                    answer_data = {
                        'question': answer.question.text,
                        'type': answer.question.type
                    }

                    if answer.question.type == 'text':
                        answer_data['value'] = answer.text_answer
                    elif answer.question.type == 'scale':
                        answer_data['value'] = answer.scale_answer
                    elif answer.question.type == 'multiple_choice':
                        answer_data['value'] = answer.choice_answer

                    feedback_data['answers'].append(answer_data)

                aggregated_data['feedbacks'].append(feedback_data)

            # Создаем агрегированные инсайты
            insights = []

            # Общее резюме по шаблону
            template_summary = FeedbackAIInsightsService._generate_template_summary(
                aggregated_data, template)
            if template_summary:
                insights.append(template_summary)

            # Выявление общих проблемных зон
            common_problems = FeedbackAIInsightsService._identify_common_problems(
                aggregated_data, template)
            if common_problems:
                insights.extend(common_problems)

            # Общий индекс удовлетворенности
            overall_satisfaction = FeedbackAIInsightsService._calculate_overall_satisfaction(
                aggregated_data, template)
            if overall_satisfaction:
                insights.append(overall_satisfaction)

            return insights

        except Exception as e:
            print(
                f"Error in FeedbackAIInsightsService.analyze_template_feedback: {e}")
            return []

    @staticmethod
    def _generate_summary(feedback_data, user_feedback):
        """
        Генерирует краткое резюме ответов пользователя
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that analyzes feedback and summarizes it. "
                           "Keep your summary concise, under 200 words."),
                ("human", f"Please analyze this feedback for '{feedback_data['template_title']}' "
                 f"and provide a concise summary:\n\n{json.dumps(feedback_data['answers'], indent=2)}")
            ])

            summary = FeedbackAIInsightsService._get_completion(prompt)

            if summary:
                return FeedbackInsight.objects.create(
                    feedback=user_feedback,
                    type=FeedbackInsight.InsightType.SUMMARY,
                    content=summary,
                    confidence_score=0.9  # Высокая уверенность для суммаризации
                )
            return None
        except Exception as e:
            print(f"Error in _generate_summary: {e}")
            return None

    @staticmethod
    def _identify_problem_areas(feedback_data, user_feedback):
        """
        Выявляет проблемные зоны на основе ответов
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that identifies problem areas in feedback. "
                           "Analyze the feedback and identify up to 3 specific problem areas. "
                           "Each problem area should be concise and actionable."),
                ("human", f"Please analyze this feedback for '{feedback_data['template_title']}' "
                 f"and identify problem areas:\n\n{json.dumps(feedback_data['answers'], indent=2)}\n\n"
                 f"Format each problem area as a separate paragraph.")
            ])

            problems_text = FeedbackAIInsightsService._get_completion(prompt)

            if problems_text:
                # Разбиваем текст на отдельные проблемные зоны
                problems = [p.strip()
                            for p in problems_text.split('\n\n') if p.strip()]

                insights = []
                for i, problem in enumerate(problems):
                    insights.append(
                        FeedbackInsight.objects.create(
                            feedback=user_feedback,
                            type=FeedbackInsight.InsightType.PROBLEM_AREA,
                            content=problem,
                            # Убывающая уверенность для каждой следующей проблемы
                            confidence_score=0.8 - (i * 0.1)
                        )
                    )
                return insights
            return []
        except Exception as e:
            print(f"Error in _identify_problem_areas: {e}")
            return []

    @staticmethod
    def _identify_risks(feedback_data, user_feedback):
        """
        Выявляет потенциальные риски на основе ответов
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that identifies potential risks in employee feedback. "
                           "Analyze the feedback and identify up to 2 specific risks that could impact employee "
                           "retention or satisfaction. Each risk should be concise and actionable."),
                ("human", f"Please analyze this feedback for '{feedback_data['template_title']}' "
                 f"and identify potential risks:\n\n{json.dumps(feedback_data['answers'], indent=2)}\n\n"
                 f"Format each risk as a separate paragraph.")
            ])

            risks_text = FeedbackAIInsightsService._get_completion(prompt)

            if risks_text:
                # Разбиваем текст на отдельные риски
                risks = [r.strip()
                         for r in risks_text.split('\n\n') if r.strip()]

                insights = []
                for i, risk in enumerate(risks):
                    insights.append(
                        FeedbackInsight.objects.create(
                            feedback=user_feedback,
                            type=FeedbackInsight.InsightType.RISK,
                            content=risk,
                            # Убывающая уверенность для каждого следующего риска
                            confidence_score=0.7 - (i * 0.1)
                        )
                    )
                return insights
            return []
        except Exception as e:
            print(f"Error in _identify_risks: {e}")
            return []

    @staticmethod
    def _calculate_satisfaction_index(feedback_data, user_feedback):
        """
        Вычисляет индекс удовлетворенности на основе ответов
        """
        try:
            # Находим вопросы с числовыми шкалами
            scale_answers = [a for a in feedback_data['answers']
                             if a['type'] == 'scale' and isinstance(a.get('value'), (int, float))]

            # Если нет числовых ответов, используем NLP для оценки текстовых ответов
            if not scale_answers:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are an AI assistant that calculates a satisfaction index based on text feedback. "
                               "Analyze the feedback and calculate a satisfaction score on a scale of 0-100, "
                               "where 0 is extremely dissatisfied and 100 is extremely satisfied."),
                    ("human", f"Please analyze this feedback for '{feedback_data['template_title']}' "
                     f"and calculate a satisfaction index:\n\n{json.dumps(feedback_data['answers'], indent=2)}\n\n"
                     f"Respond with only the numeric score (0-100) and a one-sentence explanation.")
                ])

                result = FeedbackAIInsightsService._get_completion(prompt)

                if result:
                    try:
                        # Извлекаем число из ответа
                        import re
                        score_match = re.search(r'(\d+)', result)
                        if score_match:
                            score = int(score_match.group(1))
                            explanation = result.replace(
                                score_match.group(0), '').strip()

                            return FeedbackInsight.objects.create(
                                feedback=user_feedback,
                                type=FeedbackInsight.InsightType.SATISFACTION,
                                content=f"Satisfaction Index: {score}/100. {explanation}",
                                confidence_score=0.7  # Средняя уверенность для NLP-анализа
                            )
                    except Exception as e:
                        print(f"Error parsing satisfaction score: {e}")
            else:
                # Находим среднее значение всех шкальных вопросов и нормализуем к 100
                total = sum(a.get('value', 0) for a in scale_answers)
                # Предполагаем, что шкала от 0 до 10
                max_possible = sum(10 for _ in scale_answers)

                if max_possible > 0:
                    score = (total / max_possible) * 100
                    return FeedbackInsight.objects.create(
                        feedback=user_feedback,
                        type=FeedbackInsight.InsightType.SATISFACTION,
                        content=f"Satisfaction Index: {score:.1f}/100 based on {len(scale_answers)} scale questions.",
                        confidence_score=0.9  # Высокая уверенность для числовых данных
                    )

            return None
        except Exception as e:
            print(f"Error in _calculate_satisfaction_index: {e}")
            return None

    @staticmethod
    def _generate_template_summary(aggregated_data, template):
        """
        Генерирует общее резюме по всем отзывам для шаблона
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that analyzes aggregated feedback data and provides insights. "
                           "Summarize the key themes and patterns in this feedback."),
                ("human", f"Please analyze this aggregated feedback data for '{aggregated_data['template_title']}' "
                 f"with {aggregated_data['feedback_count']} responses and provide a summary:\n\n"
                 f"Sample of responses: {json.dumps(aggregated_data['feedbacks'][:5], indent=2)}")
            ])

            summary = FeedbackAIInsightsService._get_completion(prompt)

            if summary:
                return FeedbackInsight.objects.create(
                    template=template,
                    type=FeedbackInsight.InsightType.SUMMARY,
                    content=summary,
                    confidence_score=0.85
                )
            return None
        except Exception as e:
            print(f"Error in _generate_template_summary: {e}")
            return None

    @staticmethod
    def _identify_common_problems(aggregated_data, template):
        """
        Выявляет общие проблемы на основе всех отзывов для шаблона
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that identifies common problems in aggregated feedback. "
                           "Analyze the feedback and identify up to 3 common problem areas."),
                ("human", f"Please analyze this aggregated feedback data for '{aggregated_data['template_title']}' "
                 f"with {aggregated_data['feedback_count']} responses and identify common problems:\n\n"
                 f"Sample of responses: {json.dumps(aggregated_data['feedbacks'][:5], indent=2)}\n\n"
                 f"Format each problem area as a separate paragraph.")
            ])

            problems_text = FeedbackAIInsightsService._get_completion(prompt)

            if problems_text:
                # Разбиваем текст на отдельные проблемные зоны
                problems = [p.strip()
                            for p in problems_text.split('\n\n') if p.strip()]

                insights = []
                for i, problem in enumerate(problems):
                    insights.append(
                        FeedbackInsight.objects.create(
                            template=template,
                            type=FeedbackInsight.InsightType.PROBLEM_AREA,
                            content=problem,
                            confidence_score=0.8 - (i * 0.1)
                        )
                    )
                return insights
            return []
        except Exception as e:
            print(f"Error in _identify_common_problems: {e}")
            return []

    @staticmethod
    def _calculate_overall_satisfaction(aggregated_data, template):
        """
        Вычисляет общий индекс удовлетворенности для всех отзывов по шаблону
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an AI assistant that calculates an overall satisfaction index based on "
                           "aggregated feedback. Calculate a satisfaction score on a scale of 0-100."),
                ("human", f"Please analyze this aggregated feedback data for '{aggregated_data['template_title']}' "
                 f"with {aggregated_data['feedback_count']} responses and calculate overall satisfaction:\n\n"
                 f"Sample of responses: {json.dumps(aggregated_data['feedbacks'][:5], indent=2)}\n\n"
                 f"Respond with only the numeric score (0-100) and a one-sentence explanation.")
            ])

            result = FeedbackAIInsightsService._get_completion(prompt)

            if result:
                try:
                    # Извлекаем число из ответа
                    import re
                    score_match = re.search(r'(\d+)', result)
                    if score_match:
                        score = int(score_match.group(1))
                        explanation = result.replace(
                            score_match.group(0), '').strip()

                        return FeedbackInsight.objects.create(
                            template=template,
                            type=FeedbackInsight.InsightType.SATISFACTION,
                            content=f"Overall Satisfaction Index: {score}/100. {explanation}",
                            confidence_score=0.8
                        )
                except Exception as e:
                    print(f"Error parsing overall satisfaction score: {e}")

            return None
        except Exception as e:
            print(f"Error in _calculate_overall_satisfaction: {e}")
            return None

    @staticmethod
    def _get_completion(prompt):
        """
        Получает ответ от языковой модели с использованием LangChain
        """
        try:
            # Получаем API ключ из настроек Django или из переменной окружения
            api_key = getattr(settings, 'OPENAI_API_KEY',
                              os.getenv('OPENAI_API_KEY'))

            if not api_key:
                print("OpenAI API key not found")
                return "No API key available for analysis."

            # Создаем модель языка
            llm = ChatOpenAI(
                openai_api_key=api_key,
                model_name="gpt-3.5-turbo",
                temperature=0.2
            )

            # Создаем цепочку для обработки
            chain = LLMChain(llm=llm, prompt=prompt)

            # Выполняем генерацию
            response = chain.run({})

            return response
        except Exception as e:
            print(f"Error in _get_completion: {e}")
            return None
