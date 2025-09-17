import express from 'express'
import { db } from '../config/database.js'
import { announcementSchema } from '../utils/validation.js'

const router = express.Router()

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { 
      category, 
      important, 
      targetAudience, 
      department, 
      page = 1, 
      limit = 10 
    } = req.query

    let options = {
      orderBy: { column: 'created_at', ascending: false }
    }

    const whereConditions = {}

    if (category) whereConditions.category = category
    if (important === 'true') whereConditions.is_important = true
    if (targetAudience && ['all', 'department', 'admins'].includes(targetAudience)) {
      whereConditions.target_audience = targetAudience
    }
    if (department && ['it', 'events', 'social-media', 'design', 'extern'].includes(department)) {
      whereConditions.target_department = department
    }

    if (Object.keys(whereConditions).length > 0) {
      options.where = whereConditions
    }

    const announcements = await db.query('announcements', options)

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = parseInt(page) * parseInt(limit)
    const paginatedAnnouncements = announcements.slice(startIndex, endIndex)

    const formattedAnnouncements = paginatedAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isImportant: announcement.is_important,
      category: announcement.category,
      targetAudience: announcement.target_audience,
      targetDepartment: announcement.target_department,
      authorId: announcement.author_id,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at
    }))

    res.json({
      success: true,
      count: formattedAnnouncements.length,
      total: announcements.length,
      data: formattedAnnouncements
    })

  } catch (error) {
    console.error('Get announcements error:', error)
    next(error)
  }
})

// @desc    Get single announcement by ID
// @route   GET /api/announcements/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const announcement = await db.findById('announcements', id)

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        isImportant: announcement.is_important,
        category: announcement.category,
        targetAudience: announcement.target_audience,
        targetDepartment: announcement.target_department,
        authorId: announcement.author_id,
        createdAt: announcement.created_at,
        updatedAt: announcement.updated_at
      }
    })

  } catch (error) {
    console.error('Get announcement error:', error)
    next(error)
  }
})

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Admin/Chef
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = announcementSchema.validate(req.body, {
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
    const announcementData = {
      title: value.title,
      content: value.content,
      is_important: value.isImportant,
      category: value.category,
      target_audience: value.targetAudience,
      target_department: value.targetDepartment || null,
      author_id: req.body.authorId || 'system' // TODO: Get from auth middleware
    }

    const result = await db.insert('announcements', announcementData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create announcement')
    }

    const announcement = result[0]

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: {
        id: announcement.id,
        title: announcement.title,
        category: announcement.category,
        isImportant: announcement.is_important,
        targetAudience: announcement.target_audience,
        createdAt: announcement.created_at
      }
    })

    console.log(`New announcement created: ${announcement.title} (ID: ${announcement.id})`)

  } catch (error) {
    console.error('Create announcement error:', error)
    next(error)
  }
})

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Admin/Chef/Author
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if announcement exists
    const existingAnnouncement = await db.findById('announcements', id)
    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      })
    }

    // Validate request body
    const { error, value } = announcementSchema.validate(req.body, {
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

    // Prepare update data
    const updateData = {
      title: value.title,
      content: value.content,
      is_important: value.isImportant,
      category: value.category,
      target_audience: value.targetAudience,
      target_department: value.targetDepartment || null
    }

    const result = await db.update('announcements', id, updateData)

    if (!result || result.length === 0) {
      throw new Error('Failed to update announcement')
    }

    const announcement = result[0]

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: {
        id: announcement.id,
        title: announcement.title,
        isImportant: announcement.is_important,
        updatedAt: announcement.updated_at
      }
    })

  } catch (error) {
    console.error('Update announcement error:', error)
    next(error)
  }
})

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin/Chef/Author
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if announcement exists
    const existingAnnouncement = await db.findById('announcements', id)
    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      })
    }

    const success = await db.delete('announcements', id)

    if (!success) {
      throw new Error('Failed to delete announcement')
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    })

    console.log(`Announcement deleted: ${existingAnnouncement.title} (ID: ${id})`)

  } catch (error) {
    console.error('Delete announcement error:', error)
    next(error)
  }
})

export default router