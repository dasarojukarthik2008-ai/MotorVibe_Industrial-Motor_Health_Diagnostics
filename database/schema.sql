-- MotorVibe: Industrial Motor Vibration & Health Dashboard
-- PostgreSQL Database Schema

-- Enable UUID extension if required in the future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Motors Table
CREATE TABLE IF NOT EXISTS motors (
    id SERIAL PRIMARY KEY,
    motor_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_motor_code UNIQUE (created_by, motor_code)
);

CREATE INDEX IF NOT EXISTS idx_motors_created_by ON motors(created_by);
CREATE INDEX IF NOT EXISTS idx_motors_code ON motors(motor_code);

-- 3. Motor Tests Table
CREATE TABLE IF NOT EXISTS motor_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motor_id INTEGER NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('simulation', 'hardware')),
    test_condition VARCHAR(50) NOT NULL DEFAULT 'Normal',
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'stopped', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    reading_count INTEGER DEFAULT 0,
    average_vibration NUMERIC(10, 2) DEFAULT 0.00,
    maximum_vibration NUMERIC(10, 2) DEFAULT 0.00,
    average_temperature NUMERIC(10, 2) DEFAULT 0.00,
    maximum_temperature NUMERIC(10, 2) DEFAULT 0.00,
    health_score NUMERIC(5, 1) DEFAULT 100.0,
    health_status VARCHAR(20) DEFAULT 'Healthy' CHECK (health_status IN ('Healthy', 'Warning', 'Critical')),
    possible_fault VARCHAR(100) DEFAULT 'No Major Issue Detected',
    priority VARCHAR(20) DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
    recommendation TEXT DEFAULT 'Continue routine monitoring.',
    abnormal_events INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_motor_tests_user_id ON motor_tests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_motor_tests_motor_id ON motor_tests(motor_id);
CREATE INDEX IF NOT EXISTS idx_motor_tests_status ON motor_tests(status);

-- 4. Telemetry Table
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES motor_tests(id) ON DELETE CASCADE,
    motor_id INTEGER NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('simulation', 'hardware')),
    vibration NUMERIC(8, 2) NOT NULL,
    temperature NUMERIC(8, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_test_timestamp ON telemetry(test_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_telemetry_motor_id ON telemetry(motor_id);
