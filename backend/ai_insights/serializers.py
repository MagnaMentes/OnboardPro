from rest_framework import serializers
from .models import AIInsight, AIRecommendation
from .insights_models import AIInsightV2, InsightTag
from .recommendations_models import AIRecommendationV2


class AIInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для AI-инсайтов
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(
        source='user.full_name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    risk_level_display = serializers.CharField(
        source='get_risk_level_display', read_only=True)

    class Meta:
        model = AIInsight
        fields = [
            'id',
            'user',
            'user_email',
            'user_full_name',
            'assignment',
            'program_name',
            'risk_level',
            'risk_level_display',
            'reason',
            'created_at'
        ]
        read_only_fields = ['created_at']


class AIRecommendationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели AI-рекомендаций
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assignment_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    step_name = serializers.SerializerMethodField()

    class Meta:
        model = AIRecommendation
        fields = [
            'id', 'user', 'user_email', 'assignment', 'assignment_name',
            'step', 'step_name', 'recommendation_text', 'generated_at', 'dismissed'
        ]
        read_only_fields = [
            'user', 'user_email', 'assignment', 'assignment_name',
            'step', 'step_name', 'recommendation_text', 'generated_at'
        ]

    def get_step_name(self, obj):
        """
        Получает название шага, если он указан
        """
        if obj.step:
            return obj.step.name
        return None


# Новые сериализаторы для AIInsights v2 и AIRecommendations v2
class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight.user.field.related_model
        fields = ('id', 'email', 'first_name', 'last_name')


class InsightTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsightTag
        fields = ('id', 'name', 'slug', 'description', 'color', 'category')


class AIInsightV2Serializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    tags = InsightTagSerializer(many=True, read_only=True)
    insight_type_display = serializers.CharField(
        source='get_insight_type_display', read_only=True)
    level_display = serializers.CharField(
        source='get_level_display', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = AIInsightV2
        fields = (
            'id', 'title', 'description', 'insight_type', 'insight_type_display',
            'level', 'level_display', 'status', 'status_display', 'source', 'source_id',
            'metadata', 'tags', 'created_at', 'updated_at', 'resolved_at',
            'user', 'department', 'step', 'assignment'
        )


class AIInsightDetailV2Serializer(AIInsightV2Serializer):
    """Расширенный сериализатор с дополнительной информацией о связанных объектах"""

    user_full_name = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    tag_names = serializers.SerializerMethodField()
    related_recommendations = serializers.SerializerMethodField()

    class Meta(AIInsightV2Serializer.Meta):
        fields = AIInsightV2Serializer.Meta.fields + (
            'user_full_name', 'program_name', 'step_name',
            'department_name', 'tag_names', 'related_recommendations'
        )

    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return None

    def get_program_name(self, obj):
        if obj.assignment:
            return obj.assignment.program.name
        return None

    def get_step_name(self, obj):
        if obj.step:
            return obj.step.name
        return None

    def get_department_name(self, obj):
        if obj.department:
            return obj.department.name
        return None

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_related_recommendations(self, obj):
        return AIRecommendationMinimalSerializer(
            obj.recommendations.all(), many=True).data


class AIRecommendationMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendationV2
        fields = ('id', 'title', 'status', 'priority', 'recommendation_type')


class AIRecommendationV2Serializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    tags = InsightTagSerializer(many=True, read_only=True)
    recommendation_type_display = serializers.CharField(
        source='get_recommendation_type_display', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    priority_display = serializers.CharField(
        source='get_priority_display', read_only=True)

    class Meta:
        model = AIRecommendationV2
        fields = (
            'id', 'title', 'recommendation_text', 'recommendation_type',
            'recommendation_type_display', 'priority', 'priority_display',
            'status', 'status_display', 'reason', 'impact_description',
            'tags', 'generated_at', 'expires_at', 'resolved_at',
            'user', 'assignment', 'step', 'insight',
            'accepted_reason', 'rejected_reason', 'processed_by'
        )


class AIRecommendationDetailV2Serializer(AIRecommendationV2Serializer):
    """Расширенный сериализатор с дополнительной информацией о связанных объектах"""

    user_full_name = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    step_name = serializers.SerializerMethodField()
    tag_names = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()
    insight_detail = serializers.SerializerMethodField()

    class Meta(AIRecommendationV2Serializer.Meta):
        fields = AIRecommendationV2Serializer.Meta.fields + (
            'user_full_name', 'program_name', 'step_name',
            'tag_names', 'processed_by_name', 'insight_detail'
        )

    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return None

    def get_program_name(self, obj):
        if obj.assignment:
            return obj.assignment.program.name
        return None

    def get_step_name(self, obj):
        if obj.step:
            return obj.step.name
        return None

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return f"{obj.processed_by.first_name} {obj.processed_by.last_name}".strip() or obj.processed_by.email
        return None

    def get_insight_detail(self, obj):
        if obj.insight:
            return AIInsightMinimalV2Serializer(obj.insight).data
        return None


class AIInsightMinimalV2Serializer(serializers.ModelSerializer):
    level_display = serializers.CharField(
        source='get_level_display', read_only=True)

    class Meta:
        model = AIInsightV2
        fields = ('id', 'title', 'level', 'level_display', 'source')
