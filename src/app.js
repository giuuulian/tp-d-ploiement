const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const INITIAL_TASKS = [
  { id: 1, title: 'Learn CI/CD', completed: false },
  { id: 2, title: 'Deploy with Docker', completed: false }
];

let tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(200).json(task);
});

app.post('/api/tasks', (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: req.body.title,
    completed: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (req.body.title) task.title = req.body.title;
  if (typeof req.body.completed === 'boolean') task.completed = req.body.completed;
  res.status(200).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks.splice(index, 1);
  res.status(204).send();
});

// Reset endpoint (for testing only)
app.post('/api/reset', (req, res) => {
  tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
  res.status(200).json({ message: 'Tasks reset to initial state', tasks });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if this file is run directly
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  });
}

module.exports = app;
if (server) {
  module.exports.server = server;
}
