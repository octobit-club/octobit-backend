import express from 'express'
import { db } from '../config/database.js'
import { userUpdateSchema } from '../utils/validation.js'
import { hashPassword, generateSampleUser } from '../utils/userHelpers.js'

const router = express.Router()

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
router.get('/', async (req, res, next) => {
  try {
    const { role, department, active, page = 1, limit = 10 } = req.query

    let options = {
      orderBy: { column: 'created_at', ascending: false }
    }

    const whereConditions = {}

    if (role && ['admin', 'chef_departement', 'membre'].includes(role)) {
      whereConditions.role = role
    }

    if (department && ['it', 'events', 'social-media', 'design', 'extern'].includes(department)) {
      whereConditions.department = department
    }

    if (active !== undefined) {
      whereConditions.is_active = active === 'true'
    }

    if (Object.keys(whereConditions).length > 0) {
      options.where = whereConditions
    }

    const users = await db.query('users', options)

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = parseInt(page) * parseInt(limit)
    const paginatedUsers = users.slice(startIndex, endIndex)

    const formattedUsers = paginatedUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      studentId: user.student_id,
      academicYear: user.academic_year,
      fieldOfStudy: user.field_of_study,
      role: user.role,
      department: user.department,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }))

    res.json({
      success: true,
      count: formattedUsers.length,
      total: users.length,
      data: formattedUsers
    })

  } catch (error) {
    console.error('Get users error:', error)
    next(error)
  }
})

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin/Self
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await db.findById('users', id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        telegramId: user.telegram_id,
        discordId: user.discord_id,
        homeAddress: user.home_address,
        studentId: user.student_id,
        academicYear: user.academic_year,
        fieldOfStudy: user.field_of_study,
        role: user.role,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    next(error)
  }
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin/Self
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user exists
    const existingUser = await db.findById('users', id)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Validate request body
    const { error, value } = userUpdateSchema.validate(req.body, {
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
    const updateData = {}
    if (value.firstName) updateData.first_name = value.firstName
    if (value.lastName) updateData.last_name = value.lastName
    if (value.phone) updateData.phone = value.phone
    if (value.telegramId !== undefined) updateData.telegram_id = value.telegramId || null
    if (value.discordId !== undefined) updateData.discord_id = value.discordId || null
    if (value.homeAddress !== undefined) updateData.home_address = value.homeAddress || null
    if (value.fieldOfStudy) updateData.field_of_study = value.fieldOfStudy
    if (value.department) updateData.department = value.department

    const result = await db.update('users', id, updateData)

    if (!result || result.length === 0) {
      throw new Error('Failed to update user')
    }

    const user = result[0]

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        department: user.department,
        updatedAt: user.updated_at
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    next(error)
  }
})

// @desc    Create new user (for development/admin use)
// @route   POST /api/users
// @access  Admin
router.post('/', async (req, res, next) => {
  try {
    const { email, password, ...userData } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Check if user already exists
    const existingUser = await db.query('users', {
      where: { email: email.toLowerCase() }
    })

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate user data with provided overrides
    const sampleUserData = generateSampleUser(email, password, userData)
    
    // Prepare final user data
    const finalUserData = {
      ...sampleUserData,
      password_hash: hashedPassword
    }

    // Insert user into database
    const result = await db.insert('users', finalUserData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create user')
    }

    const user = result[0]

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at
      }
    })

    console.log(`New user created: ${user.email} (ID: ${user.id}, Role: ${user.role})`)

  } catch (error) {
    console.error('Create user error:', error)
    next(error)
  }
})

// @desc    Create sample admin user (quick setup endpoint)
// @route   POST /api/users/create-admin
// @access  Public (for development setup)
router.post('/create-admin', async (req, res, next) => {
  try {
    const email = 'adembenabdi@gmail.com'
    const password = 'adem2018'

    // Check if user already exists
    const existingUser = await db.query('users', {
      where: { email }
    })

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Admin user already exists',
        data: {
          email: existingUser[0].email,
          id: existingUser[0].id,
          role: existingUser[0].role
        }
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user data
    const adminUserData = {
      email,
      password_hash: hashedPassword,
      first_name: 'Adem',
      last_name: 'Ben Abdi',
      phone: '+216123456789',
      telegram_id: '@adembenabdi',
      discord_id: 'adembenabdi#1234',
      home_address: '123 Rue de la Liberté, Tunis, Tunisia',
      student_id: '202331551801',
      academic_year: '4',
      field_of_study: 'Computer Science',
      role: 'admin',
      department: 'it',
      is_active: true
    }

    // Insert admin user
    const result = await db.insert('users', adminUserData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create admin user')
    }

    const user = result[0]

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
        studentId: user.student_id,
        phone: user.phone,
        telegramId: user.telegram_id,
        discordId: user.discord_id,
        createdAt: user.created_at
      },
      credentials: {
        email,
        password: '***hidden***'
      }
    })

    console.log(`🔐 Admin user created: ${user.email} (ID: ${user.id})`)
    console.log(`📧 Login credentials: ${email} / ${password}`)

  } catch (error) {
    console.error('Create admin user error:', error)
    next(error)
  }
})

export default router