import express from 'express'
import { db } from '../config/database.js'
import { eventSchema } from '../utils/validation.js'

const router = express.Router()

// @desc    Get all events
// @route   GET /api/events
// @access  Public (only active events for guests, all for admins)
router.get('/', async (req, res, next) => {
  try {
    const { 
      status, 
      active, 
      department, 
      upcoming, 
      page = 1, 
      limit = 10 
    } = req.query

    let options = {
      orderBy: { column: 'event_date', ascending: true }
    }

    const whereConditions = {}

    // Filter by active status for public access
    if (active === 'true') {
      whereConditions.is_active = true
    }

    // Filter by status
    if (status && ['draft', 'active', 'completed', 'cancelled'].includes(status)) {
      whereConditions.status = status
    }

    // Filter by department
    if (department && ['it', 'events', 'social-media', 'design', 'extern'].includes(department)) {
      whereConditions.department = department
    }

    if (Object.keys(whereConditions).length > 0) {
      options.where = whereConditions
    }

    let events = await db.query('events', options)

    // Filter upcoming events if requested
    if (upcoming === 'true') {
      const now = new Date()
      events = events.filter(event => new Date(event.event_date) > now)
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = parseInt(page) * parseInt(limit)
    const paginatedEvents = events.slice(startIndex, endIndex)

    // Format events for response
    const formattedEvents = paginatedEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.event_date,
      eventTime: event.event_time,
      location: event.location,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees,
      category: event.category,
      difficulty: event.difficulty,
      imageUrl: event.image_url,
      status: event.status,
      isActive: event.is_active,
      activationDate: event.activation_date,
      department: event.department,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))

    res.json({
      success: true,
      count: formattedEvents.length,
      total: events.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(events.length / parseInt(limit)),
        hasNext: endIndex < events.length,
        hasPrev: startIndex > 0
      },
      data: formattedEvents
    })

  } catch (error) {
    console.error('Get events error:', error)
    next(error)
  }
})

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await db.findById('events', id)

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      })
    }

    // Get registration count
    const registrations = await db.query('event_registrations', {
      where: { event_id: id, status: 'registered' }
    })

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.event_date,
        eventTime: event.event_time,
        location: event.location,
        maxAttendees: event.max_attendees,
        currentAttendees: registrations ? registrations.length : 0,
        category: event.category,
        difficulty: event.difficulty,
        imageUrl: event.image_url,
        status: event.status,
        isActive: event.is_active,
        activationDate: event.activation_date,
        department: event.department,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      }
    })

  } catch (error) {
    console.error('Get event error:', error)
    next(error)
  }
})

// @desc    Create new event
// @route   POST /api/events
// @access  Admin
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = eventSchema.validate(req.body, {
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
    const eventData = {
      title: value.title,
      description: value.description,
      event_date: value.eventDate,
      event_time: value.eventTime,
      location: value.location,
      max_attendees: value.maxAttendees,
      category: value.category,
      difficulty: value.difficulty || null,
      image_url: value.imageUrl || null,
      department: value.department || null,
      created_by: req.body.createdBy || 'system', // TODO: Get from auth middleware
      status: 'draft',
      is_active: false
    }

    const result = await db.insert('events', eventData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create event')
    }

    const event = result[0]

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: event.id,
        title: event.title,
        eventDate: event.event_date,
        eventTime: event.event_time,
        location: event.location,
        status: event.status,
        isActive: event.is_active,
        createdAt: event.created_at
      }
    })

    console.log(`New event created: ${event.title} (ID: ${event.id})`)

  } catch (error) {
    console.error('Create event error:', error)
    next(error)
  }
})

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Admin
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if event exists
    const existingEvent = await db.findById('events', id)
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      })
    }

    // Validate request body
    const { error, value } = eventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true // Allow additional fields like status, isActive
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
      description: value.description,
      event_date: value.eventDate,
      event_time: value.eventTime,
      location: value.location,
      max_attendees: value.maxAttendees,
      category: value.category,
      difficulty: value.difficulty || null,
      image_url: value.imageUrl || null,
      department: value.department || null
    }

    // Handle status and active state if provided
    if (req.body.status && ['draft', 'active', 'completed', 'cancelled'].includes(req.body.status)) {
      updateData.status = req.body.status
    }

    if (typeof req.body.isActive === 'boolean') {
      updateData.is_active = req.body.isActive
      if (req.body.isActive && !existingEvent.activation_date) {
        updateData.activation_date = new Date().toISOString()
      }
    }

    const result = await db.update('events', id, updateData)

    if (!result || result.length === 0) {
      throw new Error('Failed to update event')
    }

    const event = result[0]

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        id: event.id,
        title: event.title,
        status: event.status,
        isActive: event.is_active,
        updatedAt: event.updated_at
      }
    })

  } catch (error) {
    console.error('Update event error:', error)
    next(error)
  }
})

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Admin
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if event exists
    const existingEvent = await db.findById('events', id)
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      })
    }

    // Delete event (this will cascade delete registrations due to foreign key constraint)
    const success = await db.delete('events', id)

    if (!success) {
      throw new Error('Failed to delete event')
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    })

    console.log(`Event deleted: ${existingEvent.title} (ID: ${id})`)

  } catch (error) {
    console.error('Delete event error:', error)
    next(error)
  }
})

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Public (for now, TODO: require auth)
router.post('/:id/register', async (req, res, next) => {
  try {
    const { id: eventId } = req.params
    const { userId } = req.body // TODO: Get from auth middleware

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      })
    }

    // Check if event exists and is active
    const event = await db.findById('events', eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      })
    }

    if (!event.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Event is not available for registration'
      })
    }

    // Check if event is full
    if (event.max_attendees) {
      const currentRegistrations = await db.query('event_registrations', {
        where: { event_id: eventId, status: 'registered' }
      })
      
      if (currentRegistrations.length >= event.max_attendees) {
        return res.status(400).json({
          success: false,
          error: 'Event is full'
        })
      }
    }

    // Check if user is already registered
    const existingRegistration = await db.query('event_registrations', {
      where: { event_id: eventId, user_id: userId }
    })

    if (existingRegistration && existingRegistration.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Already registered for this event'
      })
    }

    // Create registration
    const registrationData = {
      event_id: eventId,
      user_id: userId,
      status: 'registered'
    }

    const result = await db.insert('event_registrations', registrationData)

    if (!result || result.length === 0) {
      throw new Error('Failed to create registration')
    }

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: {
        registrationId: result[0].id,
        eventId: eventId,
        userId: userId,
        registeredAt: result[0].registration_date
      }
    })

  } catch (error) {
    console.error('Event registration error:', error)
    next(error)
  }
})

// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Admin
router.get('/:id/registrations', async (req, res, next) => {
  try {
    const { id: eventId } = req.params

    // Check if event exists
    const event = await db.findById('events', eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      })
    }

    // Get registrations with user details (would need JOIN in real implementation)
    const registrations = await db.query('event_registrations', {
      where: { event_id: eventId },
      orderBy: { column: 'registration_date', ascending: false }
    })

    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        maxAttendees: event.max_attendees
      },
      registrations: {
        total: registrations.length,
        registered: registrations.filter(r => r.status === 'registered').length,
        attended: registrations.filter(r => r.status === 'attended').length,
        cancelled: registrations.filter(r => r.status === 'cancelled').length
      },
      data: registrations.map(reg => ({
        id: reg.id,
        userId: reg.user_id,
        status: reg.status,
        registeredAt: reg.registration_date
      }))
    })

  } catch (error) {
    console.error('Get event registrations error:', error)
    next(error)
  }
})

export default router