// Новая секция шаблонов задач для замены - без дублирования
{
  /* Раздел с шаблонами задач */
}
{
  hasRole(userRole, ["hr", "manager", "Manager"]) && (
    <div className="mb-6">
      <div
        className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
        onClick={() => setIsTemplatesListOpen(!isTemplatesListOpen)}
      >
        <div className="flex items-center">
          <DocumentDuplicateIcon className="h-5 w-5 text-purple-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-700">Шаблоны задач</h4>
          <span className="ml-3 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            {templates.length} шт.
          </span>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
            isTemplatesListOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {templatesListMounted && (
        <TemplatesPanel
          templates={templates}
          setIsTemplatesListOpen={setIsTemplatesListOpen}
          handleCreateTemplate={() => {
            setEditingTemplate(null);
            setIsTaskTemplateModalOpen(true);
          }}
          handleEditTemplate={handleEditTemplate}
          handleDeleteTemplate={openDeleteTemplateModal}
          userRole={userRole}
          isVisible={isTemplatesListOpen}
        />
      )}
    </div>
  );
}
