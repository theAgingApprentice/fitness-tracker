from flask import Flask, jsonify, send_from_directory, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
from config.database import get_db_connection, close_db_connection
from routes.api_routes import api_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=[
    "https://192.168.2.10",
    "https://mitchellnet.local",
])

# Register blueprints
app.register_blueprint(api_bp, url_prefix='/api')

def inject_api_key(filename):
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    with open(os.path.join(frontend_dir, filename), 'r') as f:
        html = f.read()
    api_key = os.environ.get('API_KEY', '')
    html = html.replace(
        "<script>window.FITNESS_API_KEY = '';</script>",
        f"<script>window.FITNESS_API_KEY = '{api_key}';</script>"
    )
    return Response(html, mimetype='text/html')

@app.route('/')
def serve_frontend():
    return inject_api_key('index.html')

@app.route('/admin.html')
def serve_admin():
    return inject_api_key('admin.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
