const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      health: 'GET /health',
      join: 'POST /api/join',
      events: 'GET /api/events, POST /api/events',
      users: 'GET /api/users',
      tasks: 'GET /api/tasks, POST /api/tasks',
      announcements: 'GET /api/announcements, POST /api/announcements'
    }
  })
}

export default notFound