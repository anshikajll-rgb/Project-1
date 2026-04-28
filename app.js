const todoForm = document.getElementById('todo-form');
const taskList = document.getElementById('task-list');
const STORAGE_KEY = 'todo_app_tasks';

function getStoredTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTodos(todos) {
  taskList.innerHTML = '';

  if (!Array.isArray(todos) || todos.length === 0) {
    taskList.innerHTML = '<li class="empty">No tasks yet!</li>';
    return;
  }

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = 'task-item';

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodoComplete(todo.id));

    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('span');
    title.className = todo.completed ? 'task-title completed' : 'task-title';
    title.textContent = todo.title;

    content.appendChild(title);

    if (todo.description) {
      const description = document.createElement('p');
      description.className = 'task-desc';
      description.textContent = todo.description;
      content.appendChild(description);
    }

    left.appendChild(checkbox);
    left.appendChild(content);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTodo(todo.id));

    item.appendChild(left);
    item.appendChild(deleteButton);
    taskList.appendChild(item);
  });
}

function handleTodoSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('todo-title').value.trim();
  const description = document.getElementById('todo-desc').value.trim();

  if (!title) {
    return;
  }

  const tasks = getStoredTasks();
  tasks.unshift({
    id: Date.now(),
    title,
    description,
    completed: false,
  });

  saveTasks(tasks);
  todoForm.reset();
  renderTodos(tasks);
}

function toggleTodoComplete(id) {
  const tasks = getStoredTasks().map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks(tasks);
  renderTodos(tasks);
}

function deleteTodo(id) {
  const tasks = getStoredTasks().filter((task) => task.id !== id);
  saveTasks(tasks);
  renderTodos(tasks);
}

function init() {
  todoForm.addEventListener('submit', handleTodoSubmit);
  renderTodos(getStoredTasks());
}

init();
