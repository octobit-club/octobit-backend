# Octobit Scientific Club - Backend API

A comprehensive REST API for managing the Octobit Scientific Club platform, built with Express.js and Supabase.

## 🚀 Features

- **Member Management**: Join applications, user profiles, and role management
- **Event Management**: Create, manage, and register for club events
- **Task Management**: Assign and track tasks for club members
- **Announcements**: Club-wide and department-specific communications
- **Department System**: IT, Events, Social Media, Design, and External Relations
- **Comprehensive Validation**: Input validation with Joi
- **Security**: CORS, Helmet, Rate limiting, and input sanitization
- **Database**: Supabase PostgreSQL with Row Level Security

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd octobit-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Database Setup**
   - Copy the contents of `database-structer.sql`
   - Run the SQL commands in your Supabase SQL editor
   - This will create all necessary tables, indexes, and policies

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Health Check
- `GET /health` - Server health status

### Join Applications
- `POST /api/join` - Submit join club application
- `GET /api/join` - Get all applications (Admin)
- `GET /api/join/:id` - Get specific application (Admin)
- `PUT /api/join/:id/status` - Update application status (Admin)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create new event (Admin)
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/:id/registrations` - Get event registrations (Admin)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks (filtered by user)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task (Admin/Chef)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Admin/Chef)

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get specific announcement
- `POST /api/announcements` - Create announcement (Admin/Chef)
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

## 🗄️ Database Schema

### Main Tables

1. **users** - User accounts and profiles
2. **join_applications** - Club membership applications
3. **events** - Club events and activities
4. **event_registrations** - Event attendance tracking
5. **tasks** - Task assignments and tracking
6. **announcements** - Club communications
7. **departments** - Department information
8. **achievements** - Gamification system
9. **user_achievements** - User achievement tracking

### Key Features

- **UUID Primary Keys** - Secure, non-sequential identifiers
- **ENUM Types** - Data integrity for roles, departments, statuses
- **Timestamps** - Automatic created_at/updated_at tracking
- **Row Level Security** - Supabase RLS policies for data access
- **Foreign Key Constraints** - Data consistency and referential integrity

## 🔒 Security Features

- **CORS Protection** - Cross-origin request security
- **Helmet** - Security headers
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Joi schema validation
- **SQL Injection Prevention** - Parameterized queries
- **Row Level Security** - Database-level access control

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=strong_production_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Deploy to Railway/Render/Vercel
1. Connect your repository
2. Set environment variables
3. Deploy with build command: `npm install`
4. Start command: `npm start`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    // Validation errors (if applicable)
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support, contact the Octobit development team.

---

**Built with ❤️ for the Octobit Scientific Club**