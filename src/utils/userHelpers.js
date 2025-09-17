import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../config/database.js'

// Hash password utility
export const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Compare password utility
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// Generate sample user data
export const generateSampleUser = (email, password, overrides = {}) => {
  const defaultData = {
    email: email.toLowerCase(),
    first_name: 'Adem',
    last_name: 'Ben Abdi',
    phone: '+216123456789',
    telegram_id: '@adembenabdi',
    discord_id: 'adembenabdi#1234',
    home_address: '123 Rue de la Liberté, Tunis, Tunisia',
    student_id: '202331551801',
    academic_year: '3',
    field_of_study: 'Computer Science',
    role: 'admin',
    department: 'it',
    is_active: true
  }
  
  return { ...defaultData, ...overrides }
}