-- Create activities table for fitness tracker
-- This table stores different fitness activities that can be tracked

DROP TABLE IF EXISTS activities;

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fkUnitID INT NOT NULL,
    default_amt INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    FOREIGN KEY (fkUnitID) REFERENCES units(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial activity data from activities.csv
INSERT INTO activities (id, name, fkUnitID, default_amt) VALUES
    (1, 'Walk', 3, 30),
    (2, 'Plank', 2, 1),
    (3, 'Wall Sits', 2, 1),
    (4, 'Crunches', 1, 10),
    (5, 'Push-ups', 1, 10);
