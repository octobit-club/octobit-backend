import express from 'express'
import { db } from '../config/database.js'
import { joinApplicationSchema } from '../utils/validation.js'

const router = express.Router()

// @desc    Submit join club application
// @route   POST /api/join
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = joinApplicationSchema.validate(req.body, {
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

    // Check if email already exists in applications
    const existingApplication = await db.query('join_applications', {
      where: { email: value.email }
    })

    if (existingApplication && existingApplication.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An application with this email already exists'
      })
    }

    // Check if user already exists
    const existingUser = await db.query('users', {
      where: { email: value.email }
    })

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email already exists'
      })
    }

    // Prepare data for insertion
    const applicationData = {
      first_name: value.firstName,
      last_name: value.lastName,
      email: value.email,
      phone: value.phone,
      telegram_id: value.telegramId || null,
      discord_id: value.discordId || null,
      home_address: value.homeAddress || null,
      academic_year: value.academicYear,
      field_of_study: value.fieldOfStudy,
      preferred_department: value.preferredDepartment,
      secondary_department: value.secondaryDepartment || null,
      skills: value.skills || null,
      motivation: value.motivation,
      status: 'pending'
    }

    // Insert application into database
    const result = await db.insert('join_applications', applicationData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create application')
    }

    const application = result[0]

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        email: application.email,
        status: application.status,
        submittedAt: application.created_at
      }
    })

    // Log successful application
    console.log(`New join application submitted: ${application.email} (ID: ${application.id})`)

  } catch (error) {
    console.error('Join application error:', error)
    next(error)
  }
})

// @desc    Get all join applications (Admin only - for now, no auth implemented)
// @route   GET /api/join
// @access  Admin
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const options = {
      orderBy: { column: 'created_at', ascending: false }
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      options.where = { status }
    }

    const applications = await db.query('join_applications', options)

    // Calculate pagination
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedApplications = applications.slice(startIndex, endIndex)

    res.json({
      success: true,
      count: paginatedApplications.length,
      total: applications.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.length / limit),
        hasNext: endIndex < applications.length,
        hasPrev: startIndex > 0
      },
      data: paginatedApplications.map(app => ({
        id: app.id,
        name: `${app.first_name} ${app.last_name}`,
        email: app.email,
        phone: app.phone,
        academicYear: app.academic_year,
        fieldOfStudy: app.field_of_study,
        preferredDepartment: app.preferred_department,
        secondaryDepartment: app.secondary_department,
        status: app.status,
        submittedAt: app.created_at,
        reviewedAt: app.reviewed_at
      }))
    })

  } catch (error) {
    console.error('Get applications error:', error)
    next(error)
  }
})

// @desc    Get single join application by ID
// @route   GET /api/join/:id
// @access  Admin
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const application = await db.findById('join_applications', id)

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: application.id,
        firstName: application.first_name,
        lastName: application.last_name,
        email: application.email,
        phone: application.phone,
        telegramId: application.telegram_id,
        discordId: application.discord_id,
        homeAddress: application.home_address,
        academicYear: application.academic_year,
        fieldOfStudy: application.field_of_study,
        preferredDepartment: application.preferred_department,
        secondaryDepartment: application.secondary_department,
        skills: application.skills,
        motivation: application.motivation,
        status: application.status,
        submittedAt: application.created_at,
        reviewedAt: application.reviewed_at,
        reviewedBy: application.reviewed_by
      }
    })

  } catch (error) {
    console.error('Get application error:', error)
    next(error)
  }
})

// @desc    Update application status
// @route   PUT /api/join/:id/status
// @access  Admin
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, reviewedBy } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      })
    }

    const updateData = {
      status,
      reviewed_at: new Date().toISOString()
    }

    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy
    }

    const result = await db.update('join_applications', id, updateData)

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      })
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: {
        id: result[0].id,
        status: result[0].status,
        reviewedAt: result[0].reviewed_at
      }
    })

  } catch (error) {
    console.error('Update application status error:', error)
    next(error)
  }
})

export default router