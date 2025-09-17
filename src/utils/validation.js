import Joi from 'joi'

// Join club application validation
export const joinApplicationSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 100 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 100 characters'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  telegramId: Joi.string()
    .trim()
    .allow('')
    .max(100)
    .messages({
      'string.max': 'Telegram ID cannot exceed 100 characters'
    }),
  
  discordId: Joi.string()
    .trim()
    .allow('')
    .max(100)
    .messages({
      'string.max': 'Discord ID cannot exceed 100 characters'
    }),
  
  homeAddress: Joi.string()
    .trim()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Home address cannot exceed 500 characters'
    }),
  
  academicYear: Joi.string()
    .valid('1', '2', '3', '4', '5', 'master', 'phd', 'faculty')
    .required()
    .messages({
      'any.only': 'Please select a valid academic year',
      'string.empty': 'Academic year is required'
    }),
  
  fieldOfStudy: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Field of study is required',
      'string.min': 'Field of study must be at least 2 characters long',
      'string.max': 'Field of study cannot exceed 100 characters'
    }),
  
  preferredDepartment: Joi.string()
    .valid('it', 'events', 'social-media', 'design', 'extern')
    .required()
    .messages({
      'any.only': 'Please select a valid preferred department',
      'string.empty': 'Preferred department is required'
    }),
  
  secondaryDepartment: Joi.string()
    .valid('it', 'events', 'social-media', 'design', 'extern')
    .allow('')
    .messages({
      'any.only': 'Please select a valid secondary department'
    }),
  
  skills: Joi.string()
    .trim()
    .allow('')
    .max(1000)
    .messages({
      'string.max': 'Skills description cannot exceed 1000 characters'
    }),
  
  motivation: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Motivation is required',
      'string.min': 'Please provide at least 10 characters for your motivation',
      'string.max': 'Motivation cannot exceed 1000 characters'
    })
})

// Event validation
export const eventSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Event title is required',
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title cannot exceed 255 characters'
    }),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Event description is required',
      'string.min': 'Event description must be at least 10 characters long',
      'string.max': 'Event description cannot exceed 2000 characters'
    }),
  
  eventDate: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Please provide a valid event date',
      'date.min': 'Event date must be in the future',
      'any.required': 'Event date is required'
    }),
  
  eventTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid time in HH:MM format',
      'string.empty': 'Event time is required'
    }),
  
  location: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Event location is required',
      'string.min': 'Event location must be at least 3 characters long',
      'string.max': 'Event location cannot exceed 255 characters'
    }),
  
  maxAttendees: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .allow(null)
    .messages({
      'number.base': 'Maximum attendees must be a number',
      'number.min': 'Maximum attendees must be at least 1',
      'number.max': 'Maximum attendees cannot exceed 1000'
    }),
  
  category: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Event category is required',
      'string.min': 'Event category must be at least 2 characters long',
      'string.max': 'Event category cannot exceed 100 characters'
    }),
  
  difficulty: Joi.string()
    .valid('Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux')
    .allow('')
    .messages({
      'any.only': 'Please select a valid difficulty level'
    }),
  
  imageUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Please provide a valid image URL'
    }),
  
  department: Joi.string()
    .valid('it', 'events', 'social-media', 'design', 'extern')
    .allow(null)
    .messages({
      'any.only': 'Please select a valid department'
    })
})

// User update validation
export const userUpdateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100),
  lastName: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  telegramId: Joi.string().trim().allow('').max(100),
  discordId: Joi.string().trim().allow('').max(100),
  homeAddress: Joi.string().trim().allow('').max(500),
  fieldOfStudy: Joi.string().trim().min(2).max(100),
  department: Joi.string().valid('it', 'events', 'social-media', 'design', 'extern')
})

// Task validation
export const taskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required(),
  
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium'),
  
  dueDate: Joi.date()
    .iso()
    .min('now')
    .allow(null),
  
  category: Joi.string()
    .trim()
    .max(100)
    .allow(''),
  
  assignedTo: Joi.string()
    .uuid()
    .required(),
  
  department: Joi.string()
    .valid('it', 'events', 'social-media', 'design', 'extern')
    .allow(null)
})

// Announcement validation
export const announcementSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required(),
  
  content: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required(),
  
  isImportant: Joi.boolean()
    .default(false),
  
  category: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
  
  targetAudience: Joi.string()
    .valid('all', 'department', 'admins')
    .default('all'),
  
  targetDepartment: Joi.string()
    .valid('it', 'events', 'social-media', 'design', 'extern')
    .allow(null)
})