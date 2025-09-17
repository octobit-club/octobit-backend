import express from 'express'
import { db } from '../config/database.js'
import { taskSchema } from '../utils/validation.js'

const router = express.Router()

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public (filtered by user for members)
router.get('/', async (req, res, next) => {
  try {
    const { 
      assignedTo, 
      assignedBy, 
      status, 
      priority, 
      department, 
      page = 1, 
      limit = 10 
    } = req.query

    let options = {
      orderBy: { column: 'created_at', ascending: false }
    }

    const whereConditions = {}

    if (assignedTo) whereConditions.assigned_to = assignedTo
    if (assignedBy) whereConditions.assigned_by = assignedBy
    if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
      whereConditions.status = status
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      whereConditions.priority = priority
    }
    if (department && ['it', 'events', 'social-media', 'design', 'extern'].includes(department)) {
      whereConditions.department = department
    }

    if (Object.keys(whereConditions).length > 0) {
      options.where = whereConditions
    }

    const tasks = await db.query('tasks', options)

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = parseInt(page) * parseInt(limit)
    const paginatedTasks = tasks.slice(startIndex, endIndex)

    const formattedTasks = paginatedTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      dueDate: task.due_date,
      category: task.category,
      assignedBy: task.assigned_by,
      assignedTo: task.assigned_to,
      assignedDate: task.assigned_date,
      department: task.department,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }))

    res.json({
      success: true,
      count: formattedTasks.length,
      total: tasks.length,
      data: formattedTasks
    })

  } catch (error) {
    console.error('Get tasks error:', error)
    next(error)
  }
})

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Public (owner/assignee only)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await db.findById('tasks', id)

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        dueDate: task.due_date,
        category: task.category,
        assignedBy: task.assigned_by,
        assignedTo: task.assigned_to,
        assignedDate: task.assigned_date,
        department: task.department,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    })

  } catch (error) {
    console.error('Get task error:', error)
    next(error)
  }
})

// @desc    Create new task
// @route   POST /api/tasks
// @access  Admin/Chef
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = taskSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    }

    // Prepare data for insertion
    const taskData = {
      title: value.title,
      description: value.description,
      priority: value.priority,
      due_date: value.dueDate,
      category: value.category || null,
      assigned_by: req.body.assignedBy || 'system', // TODO: Get from auth
      assigned_to: value.assignedTo,
      department: value.department || null,
      status: 'pending',
      progress: 0
    }

    const result = await db.insert('tasks', taskData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create task')
    }

    const task = result[0]

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        id: task.id,
        title: task.title,
        assignedTo: task.assigned_to,
        status: task.status,
        priority: task.priority,
        createdAt: task.created_at
      }
    })

    console.log(`New task created: ${task.title} (ID: ${task.id})`)

  } catch (error) {
    console.error('Create task error:', error)
    next(error)
  }
})

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Admin/Chef/Assignee
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if task exists
    const existingTask = await db.findById('tasks', id)
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    // Prepare update data (allow partial updates)
    const updateData = {}
    
    if (req.body.title) updateData.title = req.body.title
    if (req.body.description) updateData.description = req.body.description
    if (req.body.status && ['pending', 'in-progress', 'completed'].includes(req.body.status)) {
      updateData.status = req.body.status
      if (req.body.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.progress = 100
      }
    }
    if (req.body.priority && ['low', 'medium', 'high'].includes(req.body.priority)) {
      updateData.priority = req.body.priority
    }
    if (req.body.progress !== undefined) {
      const progress = parseInt(req.body.progress)
      if (progress >= 0 && progress <= 100) {
        updateData.progress = progress
        if (progress === 100 && existingTask.status !== 'completed') {
          updateData.status = 'completed'
          updateData.completed_at = new Date().toISOString()
        }
      }
    }
    if (req.body.dueDate) updateData.due_date = req.body.dueDate
    if (req.body.category) updateData.category = req.body.category

    const result = await db.update('tasks', id, updateData)

    if (!result || result.length === 0) {
      throw new Error('Failed to update task')
    }

    const task = result[0]

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: task.id,
        title: task.title,
        status: task.status,
        progress: task.progress,
        updatedAt: task.updated_at
      }
    })

  } catch (error) {
    console.error('Update task error:', error)
    next(error)
  }
})

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin/Chef/Creator
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if task exists
    const existingTask = await db.findById('tasks', id)
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    const success = await db.delete('tasks', id)

    if (!success) {
      throw new Error('Failed to delete task')
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    })

    console.log(`Task deleted: ${existingTask.title} (ID: ${id})`)

  } catch (error) {
    console.error('Delete task error:', error)
    next(error)
  }
})

export default router