const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/* 
 * VERCEL LIMITATION WARNING:
 * Vercel's serverless environment has a "Read-Only" filesystem.
 * You cannot use a local SQLite file (like database.sqlite) on Vercel. 
 * Below, we are using an "in-memory" array to store To-Dos just so you can test it. 
 * (Note: Vercel will erase memory frequently! For permanent data on Vercel, you must connect an external DB like MongoDB or Postgres).
 */
let todos = [];
let nextId = 1;

// Dummy Auth (Accepts any login for this Vercel showcase)
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ message: 'User registered successfully', userId: 1 });
});
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login successful', token: 'vercel_ephemeral_token' });
});

// To-Do CRUD
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const newTodo = { id: nextId++, user_id: 1, title, description: description || '', is_completed: 0, created_at: new Date() };
  todos.unshift(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'Not found' });
  
  if (req.body.is_completed !== undefined) {
    todo.is_completed = req.body.is_completed ? 1 : 0;
  }
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter(t => t.id !== id);
  res.json({ message: 'Todo deleted' });
});

// CRITICAL FOR VERCEL: We must export the Express app instead of calling app.listen()!
module.exports = app;
