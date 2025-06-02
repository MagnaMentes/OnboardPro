from django.db import migrations


def forward_migrate_data(apps, schema_editor):
    """
    Миграция данных из AIInsight в AIInsightV2
    """
    AIInsight = apps.get_model('ai_insights', 'AIInsight')
    AIInsightV2 = apps.get_model('ai_insights', 'AIInsightV2')

    for old_insight in AIInsight.objects.all():
        # Определяем уровень важности инсайта на основе уровня риска
        level_mapping = {
            'low': 'low',
            'medium': 'medium',
            'high': 'critical',
        }
        level = level_mapping.get(old_insight.risk_level, 'medium')

        # Создаем новый инсайт в AIInsightV2
        new_insight = AIInsightV2(
            title=f"Risk insight for {old_insight.user.get_full_name()}",
            description=old_insight.reason,
            insight_type='recommendation',
            level=level,
            status='new',
            source='legacy_system',
            source_id=str(old_insight.id),
            metadata={
                'legacy_insight_id': old_insight.id,
                'original_risk_level': old_insight.risk_level,
            },
            created_at=old_insight.created_at,
            user=old_insight.user,
            assignment=old_insight.assignment,
        )
        new_insight.save()


class Migration(migrations.Migration):
    """
    Миграция данных из AIInsight в AIInsightV2
    """
    dependencies = [
        ('ai_insights', '0003_airecommendation'),
    ]

    operations = [
        migrations.RunPython(forward_migrate_data, migrations.RunPython.noop),
    ]
