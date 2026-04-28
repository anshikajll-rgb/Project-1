const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const todoForm = document.getElementById('todo-form');
const authError = document.getElementById('auth-error');
const taskList = document.getElementById('task-list');
const logoutBtn = document.getElementById('logout-btn');
const loginTab = document.getElementById('tab-login');
const registerTab = document.getElementById('tab-register');
const authSubmitBtn = document.getElementById('auth-submit-btn');

let authMode = 'login';
const STORAGE_KEY = 'todo_app_token';

function setAuthMode(mode) {
  authMode = mode;
  if (mode === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    authSubmitBtn.textContent = 'Login';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    authSubmitBtn.textContent = 'Register';
  }
  authError.textContent = '';
}

function switchAuthTab(mode) {
  setAuthMode(mode);
}

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(STORAGE_KEY);
  const headers = options.headers || {};

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/${endpoint}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || data?.message || res.statusText);
  }

  return data;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  authError.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    authError.textContent = 'Username and password are required.';
    return;
  }

  try {
    if (authMode === 'register') {
      await apiFetch('auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      authError.textContent = 'Registered successfully. Please log in.';
      setAuthMode('login');
      return;
    }

    const result = await apiFetch('auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem(STORAGE_KEY, result.token);
    showDashboard();
  } catch (error) {
    authError.textContent = error.message || 'Authentication failed.';
  }
}

async function handleTodoSubmit(event) {
  event.preventDefault();
  authError.textContent = '';

  const title = document.getElementById('todo-title').value.trim();
  const description = document.getElementById('todo-desc').value.trim();

  if (!title) {
    authError.textContent = 'Task title is required.';
    return;
  }

  try {
    await apiFetch('todos', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
    todoForm.reset();
    loadTodos();
  } catch (error) {
    authError.textContent = error.message || 'Failed to add todo.';
  }
}

async function loadTodos() {
  try {
    const todos = await apiFetch('todos');
    renderTodos(todos);
  } catch (error) {
    authError.textContent = 'Unable to load tasks. Please log in again.';
    handleLogout();
  }
}

function renderTodos(todos) {
  taskList.innerHTML = '';

  if (!Array.isArray(todos) || todos.length === 0) {
    taskList.innerHTML = '<li class="empty">No tasks yet. Add a task above.</li>';
    return;
  }

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = 'task-item';

    const label = document.createElement('label');
    label.className = 'task-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.is_completed === 1;
    checkbox.addEventListener('change', () => toggleTodoComplete(todo.id, checkbox.checked));

    const title = document.createElement('span');
    title.className = todo.is_completed === 1 ? 'task-title completed' : 'task-title';
    title.textContent = todo.title;

    label.appendChild(checkbox);
    label.appendChild(title);

    const description = document.createElement('p');
    description.className = 'task-desc';
    description.textContent = todo.description || '';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTodo(todo.id));

    item.appendChild(label);
    if (todo.description) {
      item.appendChild(description);
    }
    item.appendChild(deleteButton);
    taskList.appendChild(item);
  });
}

async function toggleTodoComplete(id, isCompleted) {
  try {
    await apiFetch(`todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_completed: isCompleted ? 1 : 0 }),
    });
    loadTodos();
  } catch (error) {
    authError.textContent = error.message || 'Unable to update task.';
  }
}

async function deleteTodo(id) {
  try {
    await apiFetch(`todos/${id}`, { method: 'DELETE' });
    loadTodos();
  } catch (error) {
    authError.textContent = error.message || 'Unable to delete task.';
  }
}

function showDashboard() {
  authView.classList.remove('active');
  dashboardView.classList.add('active');
  authError.textContent = '';
  loadTodos();
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEY);
  dashboardView.classList.remove('active');
  authView.classList.add('active');
  setAuthMode('login');
}

function init() {
  authForm.addEventListener('submit', handleAuthSubmit);
  todoForm.addEventListener('submit', handleTodoSubmit);
  logoutBtn.addEventListener('click', handleLogout);
  loginTab.addEventListener('click', () => switchAuthTab('login'));
  registerTab.addEventListener('click', () => switchAuthTab('register'));

  setAuthMode('login');

  const token = localStorage.getItem(STORAGE_KEY);
  if (token) {
    showDashboard();
  }
}

init();
