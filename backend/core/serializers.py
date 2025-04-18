from rest_framework import serializers
from .models import OnboardingPlan, Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'plan', 'user', 'title', 'description', 'priority', 'deadline', 'status']

class OnboardingPlanSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    class Meta:
        model = OnboardingPlan
        fields = ['id', 'role', 'title', 'tasks'] 