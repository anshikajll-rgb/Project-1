const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { db, initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
initDB();

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// --- Auth Endpoints ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
      function (err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful', token });
  });
});

// --- To-Do Endpoints ---

// Get all To-Dos for logged-in user
app.get('/api/todos', authenticateToken, (req, res) => {
  db.all('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error fetching todos' });
    res.json(rows);
  });
});

// Create a new To-Do
app.post('/api/todos', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  db.run(
    'INSERT INTO todos (user_id, title, description, is_completed) VALUES (?, ?, ?, 0)',
    [req.user.userId, title, description || null],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error creating todo' });
      res.status(201).json({ id: this.lastID, title, description, is_completed: 0 });
    }
  );
});

// Update a To-Do (title, description, is_completed)
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const todoId = req.params.id;
  const { title, description, is_completed } = req.body;

  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Todo not found' });

    const newTitle = title !== undefined ? title : row.title;
    const newDesc = description !== undefined ? description : row.description;
    const newIsCompleted = is_completed !== undefined ? (is_completed ? 1 : 0) : row.is_completed;

    db.run(
      'UPDATE todos SET title = ?, description = ?, is_completed = ? WHERE id = ?',
      [newTitle, newDesc, newIsCompleted, todoId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error updating todo' });
        res.json({ id: todoId, title: newTitle, description: newDesc, is_completed: newIsCompleted });
      }
    );
  });
});

// Delete a To-Do
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const todoId = req.params.id;

  db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.userId], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting todo' });
    if (this.changes === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted successfully' });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
