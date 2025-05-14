{
  /* Фильтры для задач */
}
<div className="mb-6">
  <div
    className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
    onClick={() => setIsTaskFiltersVisible(!isTaskFiltersVisible)}
  >
    <div className="flex items-center">
      <AdjustmentsVerticalIcon className="h-5 w-5 text-blue-600 mr-2" />
      <span className="text-sm font-medium text-gray-800">Фильтры и поиск</span>
    </div>
    <ChevronDownIcon
      className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
        isTaskFiltersVisible ? "transform rotate-180" : ""
      }`}
    />
  </div>

  {taskFiltersMounted && (
    <TaskFilterPanel
      filters={{
        taskStatusFilter,
        taskPriorityFilter,
        taskUserFilter,
        taskPlanFilter,
        taskSortField,
        taskSortDirection,
        taskSearchQuery,
      }}
      handleFilterChange={(newFilters) => {
        if (newFilters.taskStatusFilter !== undefined)
          setTaskStatusFilter(newFilters.taskStatusFilter);
        if (newFilters.taskPriorityFilter !== undefined)
          setTaskPriorityFilter(newFilters.taskPriorityFilter);
        if (newFilters.taskUserFilter !== undefined)
          setTaskUserFilter(newFilters.taskUserFilter);
        if (newFilters.taskPlanFilter !== undefined)
          setTaskPlanFilter(newFilters.taskPlanFilter);
        if (newFilters.taskSortField !== undefined)
          setTaskSortField(newFilters.taskSortField);
        if (newFilters.taskSortDirection !== undefined)
          setTaskSortDirection(newFilters.taskSortDirection);
        if (newFilters.taskSearchQuery !== undefined)
          setTaskSearchQuery(newFilters.taskSearchQuery);
      }}
      users={users}
      plans={plans}
      setIsTaskFiltersVisible={setIsTaskFiltersVisible}
      resetTaskFilters={resetTaskFilters}
      isVisible={isTaskFiltersVisible}
    />
  )}
</div>;
