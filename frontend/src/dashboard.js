async function fetchTasks() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await response.json();
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = tasks.map(task => `
        <div class="bg-white p-4 rounded shadow-md">
            <h3 class="text-lg font-bold">${task.title}</h3>
            <p>${task.description}</p>
            <p>Priority: ${task.priority}</p>
            <p>Deadline: ${new Date(task.deadline).toLocaleDateString()}</p>
            <p>Status: ${task.status}</p>
        </div>
    `).join('');
}
fetchTasks(); 