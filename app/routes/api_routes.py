from flask import Blueprint, jsonify, request
from config.database import get_db_connection, close_db_connection

api_bp = Blueprint('api', __name__)

@api_bp.route('/items', methods=['GET'])
def get_items():
    """Get all items from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM items ORDER BY created_at DESC")
        items = cursor.fetchall()
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': items
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/items', methods=['POST'])
def create_item():
    """Create a new item"""
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')

        if not name:
            return jsonify({
                'success': False,
                'error': 'Name is required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO items (name, description) VALUES (%s, %s)",
            (name, description)
        )
        conn.commit()
        item_id = cursor.lastrowid
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': {
                'id': item_id,
                'name': name,
                'description': description
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete an item by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = %s", (item_id,))
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Item not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Item deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/test-month', methods=['GET'])
def test_month():
    """Test endpoint to debug month query"""
    try:
        month = request.args.get('month', '2025-04')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT DISTINCT DATE_FORMAT(al.date, %s) as date
            FROM activityLog al
            WHERE DATE_FORMAT(al.date, %s) = %s
            ORDER BY al.date
            LIMIT 10
        """, ('%Y-%m-%d', '%Y-%m', month))

        result = cursor.fetchall()
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'count': len(result),
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/activities', methods=['GET'])
def get_activities():
    """Get all activities with their units"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT a.id, a.name, a.default_amt, a.fkUnitID,
                   u.name as unit_name, u.unit as unit_type
            FROM activities a
            JOIN units u ON a.fkUnitID = u.id
            ORDER BY a.name
        """)
        activities = cursor.fetchall()
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': activities
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/activity-log', methods=['GET'])
def get_activity_log():
    """Get activity log entries, optionally filtered by date or month"""
    try:
        date = request.args.get('date')  # Format: YYYY-MM-DD
        month = request.args.get('month')  # Format: YYYY-MM

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if date:
            # Get activities for specific date
            cursor.execute("""
                SELECT al.id, DATE_FORMAT(al.date, '%%Y-%%m-%%d') as date,
                       al.duration, al.fkActivityId,
                       a.name as activity_name,
                       u.name as unit_name
                FROM activityLog al
                JOIN activities a ON al.fkActivityId = a.id
                JOIN units u ON a.fkUnitID = u.id
                WHERE al.date = %s
                ORDER BY al.id
            """, (date,))
        elif month:
            # Get all dates with activities for a specific month
            cursor.execute("""
                SELECT DISTINCT DATE_FORMAT(al.date, %s) as date
                FROM activityLog al
                WHERE DATE_FORMAT(al.date, %s) = %s
                ORDER BY al.date
            """, ('%Y-%m-%d', '%Y-%m', month))
            result = cursor.fetchall()
            close_db_connection(conn)
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            # Get all activity log entries
            cursor.execute("""
                SELECT al.id, DATE_FORMAT(al.date, '%%Y-%%m-%%d') as date,
                       al.duration, al.fkActivityId,
                       a.name as activity_name,
                       u.name as unit_name
                FROM activityLog al
                JOIN activities a ON al.fkActivityId = a.id
                JOIN units u ON a.fkUnitID = u.id
                ORDER BY al.date DESC, al.id
            """)

        logs = cursor.fetchall()
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/activity-log', methods=['POST'])
def create_activity_log():
    """Create a new activity log entry"""
    try:
        data = request.get_json()
        activity_id = data.get('activityId')
        date = data.get('date')
        duration = data.get('duration')

        if not all([activity_id, date, duration]):
            return jsonify({
                'success': False,
                'error': 'Activity ID, date, and duration are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO activityLog (fkActivityId, date, duration) VALUES (%s, %s, %s)",
            (activity_id, date, duration)
        )
        conn.commit()
        log_id = cursor.lastrowid
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': {
                'id': log_id,
                'activityId': activity_id,
                'date': date,
                'duration': duration
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/activity-log/<int:log_id>', methods=['PUT'])
def update_activity_log(log_id):
    """Update an activity log entry"""
    try:
        data = request.get_json()
        duration = data.get('duration')

        if not duration:
            return jsonify({
                'success': False,
                'error': 'Duration is required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE activityLog SET duration = %s WHERE id = %s",
            (duration, log_id)
        )
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Activity log not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Activity log updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/activity-log/<int:log_id>', methods=['DELETE'])
def delete_activity_log(log_id):
    """Delete an activity log entry"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM activityLog WHERE id = %s", (log_id,))
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Activity log not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Activity log deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============ ADMIN ENDPOINTS ============

@api_bp.route('/admin/unit-types', methods=['GET'])
def get_unit_types():
    """Get all unique unit types"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT unit FROM units ORDER BY unit")
        rows = cursor.fetchall()
        close_db_connection(conn)

        unit_types = [row[0] for row in rows]

        return jsonify({
            'success': True,
            'data': unit_types
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/unit-types', methods=['POST'])
def create_unit_type():
    """Add a new unit type (just validates it doesn't exist)"""
    try:
        data = request.get_json()
        name = data.get('name')

        if not name:
            return jsonify({
                'success': False,
                'error': 'Unit type name is required'
            }), 400

        # Unit types are just stored in the units table, so we just return success
        # The actual unit type will be created when a unit uses it
        return jsonify({
            'success': True,
            'message': 'Unit type registered successfully'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/unit-types/<string:type_name>', methods=['DELETE'])
def delete_unit_type(type_name):
    """Delete a unit type (only if not used by any units)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if unit type is used by any units
        cursor.execute("SELECT COUNT(*) as count FROM units WHERE unit = %s", (type_name,))
        result = cursor.fetchone()
        close_db_connection(conn)

        if result[0] > 0:
            return jsonify({
                'success': False,
                'error': 'Cannot delete unit type that is used by units'
            }), 400

        # Since unit types are just distinct values, nothing to delete
        # They disappear automatically when no units use them
        return jsonify({
            'success': True,
            'message': 'Unit type can be safely removed (no units use it)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/units', methods=['GET'])
def get_units():
    """Get all units"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM units ORDER BY name")
        units = cursor.fetchall()
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': units
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/units', methods=['POST'])
def create_unit():
    """Create a new unit"""
    try:
        data = request.get_json()
        name = data.get('name')
        unit = data.get('unit')

        if not name or not unit:
            return jsonify({
                'success': False,
                'error': 'Name and unit type are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO units (name, unit) VALUES (%s, %s)",
            (name, unit)
        )
        conn.commit()
        unit_id = cursor.lastrowid
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': {
                'id': unit_id,
                'name': name,
                'unit': unit
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/units/<int:unit_id>', methods=['PUT'])
def update_unit(unit_id):
    """Update a unit"""
    try:
        data = request.get_json()
        name = data.get('name')
        unit = data.get('unit')

        if not name or not unit:
            return jsonify({
                'success': False,
                'error': 'Name and unit type are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE units SET name = %s, unit = %s WHERE id = %s",
            (name, unit, unit_id)
        )
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Unit not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Unit updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/units/<int:unit_id>', methods=['DELETE'])
def delete_unit(unit_id):
    """Delete a unit (only if not used by any activities)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if unit is used by any activities
        cursor.execute("SELECT COUNT(*) as count FROM activities WHERE fkUnitID = %s", (unit_id,))
        result = cursor.fetchone()

        if result[0] > 0:
            close_db_connection(conn)
            return jsonify({
                'success': False,
                'error': 'Cannot delete unit that is used by activities'
            }), 400

        cursor.execute("DELETE FROM units WHERE id = %s", (unit_id,))
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Unit not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Unit deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/activities', methods=['POST'])
def create_activity():
    """Create a new activity"""
    try:
        data = request.get_json()
        name = data.get('name')
        unit_id = data.get('unitId')
        default_amt = data.get('defaultAmt')

        if not name or not unit_id or not default_amt:
            return jsonify({
                'success': False,
                'error': 'Name, unit ID, and default amount are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO activities (name, fkUnitID, default_amt) VALUES (%s, %s, %s)",
            (name, unit_id, default_amt)
        )
        conn.commit()
        activity_id = cursor.lastrowid
        close_db_connection(conn)

        return jsonify({
            'success': True,
            'data': {
                'id': activity_id,
                'name': name,
                'unitId': unit_id,
                'defaultAmt': default_amt
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/activities/<int:activity_id>', methods=['PUT'])
def update_activity(activity_id):
    """Update an activity"""
    try:
        data = request.get_json()
        name = data.get('name')
        unit_id = data.get('unitId')
        default_amt = data.get('defaultAmt')

        if not name or not unit_id or not default_amt:
            return jsonify({
                'success': False,
                'error': 'Name, unit ID, and default amount are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE activities SET name = %s, fkUnitID = %s, default_amt = %s WHERE id = %s",
            (name, unit_id, default_amt, activity_id)
        )
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Activity not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Activity updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/admin/activities/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Delete an activity (only if not used in any activity logs)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if activity is used in any logs
        cursor.execute("SELECT COUNT(*) as count FROM activityLog WHERE fkActivityId = %s", (activity_id,))
        result = cursor.fetchone()

        if result[0] > 0:
            close_db_connection(conn)
            return jsonify({
                'success': False,
                'error': 'Cannot delete activity that has logged entries'
            }), 400

        cursor.execute("DELETE FROM activities WHERE id = %s", (activity_id,))
        conn.commit()
        affected = cursor.rowcount
        close_db_connection(conn)

        if affected == 0:
            return jsonify({
                'success': False,
                'error': 'Activity not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Activity deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
