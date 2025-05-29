from ai_insights.models import AIInsight, AIRecommendation, RiskLevel
from django.utils import timezone
from users.models import User
from onboarding.models import UserStepProgress
from onboarding.feedback_models import FeedbackMood, StepFeedback


class AIInsightService:
    @staticmethod
    def analyze_onboarding_progress(assignment):
        """
        Анализирует прогресс онбординга и создает инсайты на основе данных
        """
        user = assignment.user
        program = assignment.program

        # Анализ прогресса по шагам
        total_required_steps = program.steps.filter(is_required=True).count()
        if total_required_steps > 0:
            completed_steps = UserStepProgress.objects.filter(
                user=user,
                step__program=program,
                step__is_required=True,
                status='done'
            ).count()

            progress_percent = (completed_steps / total_required_steps) * 100
            current_date = timezone.now()

            # Проверка на низкий прогресс после длительного времени
            if progress_percent < 25 and (current_date - assignment.assigned_at).days >= 21:
                # Создаем инсайт высокого риска
                AIInsight.objects.create(
                    user=user,
                    assignment=assignment,
                    risk_level=RiskLevel.HIGH,
                    reason=f"Критически низкий прогресс ({progress_percent:.1f}%) после 3 недель в программе."
                )
            elif progress_percent < 50 and (current_date - assignment.assigned_at).days >= 14:
                # Создаем инсайт среднего риска
                AIInsight.objects.create(
                    user=user,
                    assignment=assignment,
                    risk_level=RiskLevel.MEDIUM,
                    reason=f"Низкий прогресс ({progress_percent:.1f}%) после 2 недель в программе."
                )

        # Анализ отзывов
        negative_feedbacks = StepFeedback.objects.filter(
            user=user,
            assignment=assignment,
            auto_tag__in=['negative', 'unclear_instruction', 'delay_warning']
        ).count()

        if negative_feedbacks >= 3:
            # Создаем инсайт высокого риска
            AIInsight.objects.create(
                user=user,
                assignment=assignment,
                risk_level=RiskLevel.HIGH,
                reason=f"Обнаружено {negative_feedbacks} негативных отзывов по шагам программы."
            )
        elif negative_feedbacks > 0:
            # Создаем инсайт среднего риска
            AIInsight.objects.create(
                user=user,
                assignment=assignment,
                risk_level=RiskLevel.MEDIUM,
                reason=f"Обнаружено {negative_feedbacks} негативных отзывов по шагам программы."
            )

        # Анализ настроения
        latest_bad_moods = FeedbackMood.objects.filter(
            user=user,
            assignment=assignment,
            value__in=['bad', 'terrible']
        ).count()

        if latest_bad_moods >= 2:
            # Создаем инсайт высокого риска
            AIInsight.objects.create(
                user=user,
                assignment=assignment,
                risk_level=RiskLevel.HIGH,
                reason=f"Пользователь оставил {latest_bad_moods} негативных оценок настроения."
            )

        return True


class AIRecommendationService:
    @staticmethod
    def generate_recommendations(user: User):
        """
        Генерирует персонализированные AI-рекомендации для пользователя на основе поведения.
        Использует данные из FeedbackMood, StepFeedback, UserStepProgress и AIInsight.
        """
        recommendations = []
        active_assignments = user.onboarding_assignments.filter(
            status='active')

        if not active_assignments.exists():
            return False

        for active_assignment in active_assignments:
            # Проверка настроения пользователя (FeedbackMood)
            latest_mood = FeedbackMood.objects.filter(
                user=user,
                assignment=active_assignment
            ).order_by('-created_at').first()

            if latest_mood and latest_mood.value in ['bad', 'terrible']:
                recommendations.append(
                    AIRecommendation(
                        user=user,
                        assignment=active_assignment,
                        recommendation_text=f"Обнаружен низкий тонус пользователя {user.email} ({latest_mood.get_value_display()}). Рекомендуем оказать поддержку и обсудить возможные трудности.",
                        generated_at=timezone.now()
                    )
                )

            # Проверка отзывов по шагам (StepFeedback)
            negative_feedbacks = StepFeedback.objects.filter(
                user=user,
                assignment=active_assignment,
                auto_tag__in=['negative',
                              'unclear_instruction', 'delay_warning']
            )

            for feedback in negative_feedbacks:
                recommendations.append(
                    AIRecommendation(
                        user=user,
                        assignment=active_assignment,
                        step=feedback.step,
                        recommendation_text=f"Пользователь {user.email} оставил отрицательный отзыв с тегом '{feedback.get_auto_tag_display()}' по шагу \"{feedback.step.name}\". Рекомендуем проверить инструкцию к шагу или связаться с пользователем.",
                        generated_at=timezone.now()
                    )
                )

            # Проверка прогресса по шагам (UserStepProgress)
            current_date = timezone.now()
            overdue_steps = UserStepProgress.objects.filter(
                user=user,
                step__program=active_assignment.program,
                status__in=['not_started', 'in_progress'],
                planned_date_end__lt=current_date
            )

            if overdue_steps.exists():
                recommendations.append(
                    AIRecommendation(
                        user=user,
                        assignment=active_assignment,
                        recommendation_text=f"Обнаружены просроченные шаги ({overdue_steps.count()}) в программе \"{active_assignment.program.name}\". Рекомендуется связаться с пользователем {user.email} для выяснения причин.",
                        generated_at=timezone.now()
                    )
                )

            # Проверка низкого прогресса
            total_steps = active_assignment.program.steps.filter(
                is_required=True).count()
            if total_steps > 0:
                completed_steps = UserStepProgress.objects.filter(
                    user=user,
                    step__program=active_assignment.program,
                    step__is_required=True,
                    status='done'
                ).count()

                progress_percent = (completed_steps / total_steps) * 100
                if progress_percent < 30 and (current_date - active_assignment.assigned_at).days >= 14:
                    recommendations.append(
                        AIRecommendation(
                            user=user,
                            assignment=active_assignment,
                            recommendation_text=f"Низкий прогресс пользователя {user.email} в программе \"{active_assignment.program.name}\" ({progress_percent:.1f}%). Программа назначена более 14 дней назад. Рекомендуем проверить, требуется ли помощь.",
                            generated_at=timezone.now()
                        )
                    )

            # Проверка AI-инсайтов (AIInsight)
            risky_insights = AIInsight.objects.filter(
                user=user,
                assignment=active_assignment,
                risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
            )

            for insight in risky_insights:
                recommendations.append(
                    AIRecommendation(
                        user=user,
                        assignment=active_assignment,
                        recommendation_text=f"AI выявил {insight.get_risk_level_display()} риск для пользователя {user.email} в программе \"{active_assignment.program.name}\": {insight.reason}. Рекомендуем обратить внимание.",
                        generated_at=timezone.now()
                    )
                )

        # Создаем только уникальные рекомендации (простая проверка по тексту для данного пользователя и назначения)
        if active_assignment:
            existing_texts = set(AIRecommendation.objects.filter(
                user=user, assignment=active_assignment, dismissed=False).values_list('recommendation_text', flat=True))
            new_recommendations = []
            for rec in recommendations:
                if rec.recommendation_text not in existing_texts:
                    new_recommendations.append(rec)
                    existing_texts.add(rec.recommendation_text)

            if new_recommendations:
                AIRecommendation.objects.bulk_create(new_recommendations)

    @staticmethod
    def dismiss_recommendation(recommendation_id: int):
        """
        Скрывает рекомендацию по ее ID.
        """
        try:
            recommendation = AIRecommendation.objects.get(id=recommendation_id)
            recommendation.dismissed = True
            recommendation.save(update_fields=['dismissed'])
            return True
        except AIRecommendation.DoesNotExist:
            return False

    @staticmethod
    def get_active_recommendations(user=None):
        """
        Возвращает список активных (не скрытых) рекомендаций.
        Если пользователь указан, возвращает только рекомендации для этого пользователя.
        """
        queryset = AIRecommendation.objects.filter(dismissed=False)

        if user:
            queryset = queryset.filter(user=user)

        return queryset.order_by('-generated_at')
