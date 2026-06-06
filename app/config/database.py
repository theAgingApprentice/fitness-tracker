import os
import mysql.connector
from mysql.connector import Error

def get_db_config():
    """Get database configuration based on environment"""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'database': os.getenv('DB_NAME', 'fitness_tracker_dev'),
        'user': os.getenv('DB_USER', 'fitness_user'),
        'password': os.getenv('DB_PASSWORD', 'fitness_password')
    }

def get_db_connection():
    """Create and return a database connection"""
    try:
        config = get_db_config()
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MariaDB: {e}")
        raise
    return None

def close_db_connection(connection):
    """Close database connection"""
    if connection and connection.is_connected():
        connection.close()
