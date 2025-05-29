from django.urls import path
from .views import DepartmentList, DepartmentDetail

urlpatterns = [
    path('departments/', DepartmentList.as_view(), name='department-list'),
    path('departments/<int:pk>/', DepartmentDetail.as_view(),
         name='department-detail'),
]
