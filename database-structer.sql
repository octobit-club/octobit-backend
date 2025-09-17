-- Octobit Scientific Club Database Schema
-- Database: Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better data integrity
CREATE TYPE user_role AS ENUM ('admin', 'chef_departement', 'membre');
CREATE TYPE department_name AS ENUM ('it', 'events', 'social-media', 'design', 'extern');
CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    telegram_id VARCHAR(100),
    discord_id VARCHAR(100),
    home_address TEXT,
    student_id VARCHAR(50) UNIQUE,
    academic_year VARCHAR(20),
    field_of_study VARCHAR(100),
    role user_role DEFAULT 'membre',
    department department_name,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Join club applications table
CREATE TABLE join_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    telegram_id VARCHAR(100),
    discord_id VARCHAR(100),
    home_address TEXT,
    academic_year VARCHAR(20) NOT NULL,
    field_of_study VARCHAR(100) NOT NULL,
    preferred_department department_name NOT NULL,
    secondary_department department_name,
    skills TEXT,
    motivation TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_time VARCHAR(10) NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50),
    image_url VARCHAR(500),
    status event_status DEFAULT 'draft',
    is_active BOOLEAN DEFAULT false,
    activation_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) NOT NULL,
    department department_name,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled
    UNIQUE(event_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    category VARCHAR(100),
    assigned_by UUID REFERENCES users(id) NOT NULL,
    assigned_to UUID REFERENCES users(id) NOT NULL,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    department department_name,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    category VARCHAR(100) NOT NULL,
    target_audience VARCHAR(100) DEFAULT 'all', -- all, department, admins
    target_department department_name,
    author_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table (for metadata and statistics)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name department_name UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    head_id UUID REFERENCES users(id),
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_join_applications_status ON join_applications(status);
CREATE INDEX idx_join_applications_created_at ON join_applications(created_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_join_applications_updated_at BEFORE UPDATE ON join_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default departments
INSERT INTO departments (name, display_name, description) VALUES
('it', 'IT Department', 'Technology, software development, and digital innovation'),
('events', 'Événementiel', 'Event planning, organization, and management'),
('social-media', 'Social Media', 'Digital marketing, content creation, and online presence'),
('design', 'Design', 'Visual design, graphics, and creative content'),
('extern', 'External Relations', 'Partnerships, sponsorships, and external communications');

-- Insert default achievements
INSERT INTO achievements (title, description, icon, requirements) VALUES
('Premier pas', 'Première tâche complétée', '🏆', '{"tasks_completed": 1}'),
('Collaborateur', '5 tâches d''équipe terminées', '🤝', '{"team_tasks_completed": 5}'),
('Expert', '10 tâches techniques accomplies', '⭐', '{"technical_tasks_completed": 10}'),
('Mentor', 'Aider 3 collègues', '🎓', '{"colleagues_helped": 3}');

-- Row Level Security (RLS) Policies (for Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on authentication)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert join applications" ON join_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view join applications" ON join_applications FOR SELECT USING (true);

CREATE POLICY "Anyone can view active events" ON events FOR SELECT USING (is_active = true OR status = 'active');
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (true);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL USING (true);

CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (true);

CREATE POLICY "Everyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());