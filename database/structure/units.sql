-- Create units table for fitness tracker
-- This table stores different unit types used in the fitness tracking application

DROP TABLE IF EXISTS units;

CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial unit data from units.csv
INSERT INTO units (id, name, unit) VALUES
    (1, 'Count', 'Number-whole'),
    (2, 'Time-Seconds', 'Number-whole'),
    (3, 'Time-Minutes', 'Number-whole'),
    (4, 'Time-Hours', 'Number-whole');
