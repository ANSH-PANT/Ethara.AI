const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyTasks, getTask, updateTask, deleteTask, getProjectTasks, createTask } = require('../controllers/task.controller');

router.use(authenticate);

router.get('/my-tasks', getMyTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId', createTask);

module.exports = router;
