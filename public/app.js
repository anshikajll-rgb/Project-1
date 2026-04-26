const API_BASE = 'https://www.todoapp.com/api.php?action=';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const btnLogin = document.getElementById('tab-login');
const btnRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authError = document.getElementById('auth-error');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const todoForm = document.getElementById('todo-form');
const todoTitle = document.getElementById('todo-title');
const todoDesc = document.getElementById('todo-desc');
const taskList = document.getElementById('task-list');

// State
let isLoginMode = true;

// Initialization
function init() {
  const token = localStorage.getItem('token');
  if (token) {
    showDashboard();
    fetchTodos();
  } else {
    showAuth();
  }
}

// UI Toggles
function switchAuthTab(mode) {
  isLoginMode = mode === 'login';
  if (isLoginMode) {
    btnLogin.classList.add('active');
    btnRegister.classList.remove('active');
    authSubmitBtn.innerText = 'Login';
  } else {
    btnLogin.classList.remove('active');
    btnRegister.classList.add('active');
    authSubmitBtn.innerText = 'Register';
  }
  authError.innerText = '';
  usernameInput.value = '';
  passwordInput.value = '';
}

function showDashboard() {
  authView.classList.remove('active');
  dashboardView.classList.add('active');
}

function showAuth() {
  dashboardView.classList.remove('active');
  authView.classList.add('active');
}

// API Functions
async function handleAuth(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  authError.innerText = '';

  const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

  try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (!isLoginMode) {
          // If registered successfully, switch to login automatically
          switchAuthTab('login');
          usernameInput.value = username;
          alert('Registration successful! Please login.');
      } else {
          localStorage.setItem('token', data.token);
          showDashboard();
          fetchTodos();
      }
  } catch (err) {
      authError.innerText = err.message;
  }
}

async function fetchTodos() {
  const token = localStorage.getItem('token');
  if(!token) return;

  try {
      const res = await fetch(`${API_BASE}/todos`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
          if (res.status === 401 || res.status === 403) logout();
          throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      renderTodos(data);
  } catch (err) {
      console.error(err);
  }
}

async function addTodo(e) {
  e.preventDefault();
  const title = todoTitle.value.trim();
  const description = todoDesc.value.trim();
  if(!title) return;

  const token = localStorage.getItem('token');
  try {
      const res = await fetch(`${API_BASE}/todos`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, description })
      });
      if (res.ok) {
          todoTitle.value = '';
          todoDesc.value = '';
          fetchTodos();
      }
  } catch (err) { console.error(err); }
}

async function toggleTodoComplete(id, currentStatus) {
  const token = localStorage.getItem('token');
  try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) fetchTodos();
  } catch (err) { console.error(err); }
}

async function deleteTodo(id) {
  const token = localStorage.getItem('token');
  try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTodos();
  } catch (err) { console.error(err); }
}

function logout() {
  localStorage.removeItem('token');
  showAuth();
  switchAuthTab('login');
}

// Render Functions
function renderTodos(todos) {
  taskList.innerHTML = '';
  if (todos.length === 0) {
      taskList.innerHTML = '<p style="text-align:center; margin-top:24px;">No tasks yet. You\'re all caught up!</p>';
      return;
  }

  todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `task-item ${todo.is_completed ? 'completed' : ''}`;
      
      const compVal = todo.is_completed ? 1 : 0;
      
      li.innerHTML = `
          <div class="task-left">
              <div class="checkbox" onclick="toggleTodoComplete(${todo.id}, ${compVal})"></div>
              <div>
                  <div class="task-title">${escapeHTML(todo.title)}</div>
                  ${todo.description ? `<div class="task-desc">${escapeHTML(todo.description)}</div>` : ''}
              </div>
          </div>
          <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
      `;
      taskList.appendChild(li);
  });
}

// Helpers
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, 
      tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
      }[tag] || tag)
  );
}

// Global scope for onclick bindings
window.switchAuthTab = switchAuthTab;
window.toggleTodoComplete = toggleTodoComplete;
window.deleteTodo = deleteTodo;

// Event Listeners
authForm.addEventListener('submit', handleAuth);
logoutBtn.addEventListener('click', logout);
todoForm.addEventListener('submit', addTodo);

// Start app
init();
