import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

base_url = "https://fleetbots-production.up.railway.app"
rovers = ["Rover-1", "Rover-2", "Rover-3", "Rover-4", "Rover-5"]
directions = ["forward", "backward", "left", "right"]
tasks = ["Soil Analysis", "Irrigation", "Weeding", "Crop Monitoring"]

# Start a session and retrieve session ID
@app.route('/api/session/start', methods=['POST'])
def start_session():
    response = requests.post(f"{base_url}/api/session/start")
    data = response.json()
    print(f"Session ID: {data['session_id']}")
    return jsonify(data['session_id'])
#sample output - Session ID: 7a1ca82c-9783-4d94-9985-b84889b64933
@app.route('/api/fleet/status', methods=['GET'])
def get_fleet_status():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
        
    response = requests.get(f"{base_url}/api/fleet/status?session_id={session_id}")
    if response.status_code != 200:
        return jsonify({"error": "Failed to get fleet status"}), response.status_code
    return jsonify(response.json())
#sample output - Fleet Status: {'Rover-1': {'status': 'idle', 'battery': 97, 'coordinates': [-2, -1], 'task': None}, 'Rover-2': {'status': 'idle', 'battery': 83, 'coordinates': [10, 10], 'task': None}, 'Rover-3': {'status': 'idle', 'battery': 70, 'coordinates': [-6, -5], 'task': None}, 'Rover-4': {'status': 'idle', 'battery': 83, 'coordinates': [-9, 10], 'task': None}, 'Rover-5': {'status': 'idle', 'battery': 94, 'coordinates': [9, 9], 'task': None}}
@app.route('/api/rover/status', methods=['GET'])
def get_rover_status():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
        
    rover_data = {}
    for rover in rovers:
        response = requests.get(f"{base_url}/api/rover/{rover}/status?session_id={session_id}")
        if response.status_code != 200:
            return jsonify({"error": f"Failed to get status for {rover}"}), response.status_code
        rover_data[rover] = response.json()
    return jsonify(rover_data)
#sample output - Rover Status: {'Rover-1': {'status': 'idle', 'battery': 97, 'coordinates': [-2, -1], 'task': None}, 'Rover-2': {'status': 'idle', 'battery': 83, 'coordinates': [10, 10], 'task': None}, 'Rover-3': {'status': 'idle', 'battery': 70, 'coordinates': [-6, -5], 'task': None}, 'Rover-4': {'status': 'idle', 'battery': 83, 'coordinates': [-9, 10], 'task': None}, 'Rover-5': {'status': 'idle', 'battery': 94, 'coordinates': [9, 9], 'task': None}}
@app.route('/api/rover/sensor-data', methods=['GET'])
def get_sensor_data():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
        
    rover_data = {}
    for rover in rovers:
        response = requests.get(f"{base_url}/api/rover/{rover}/sensor-data?session_id={session_id}")
        if response.status_code != 200:
            return jsonify({"error": f"Failed to get sensor data for {rover}"}), response.status_code
        rover_data[rover] = response.json()
    return jsonify(rover_data)
#sample output - Rover Sensor Data: {'Rover-1':{'timestamp': 1743541980.7809546, 'rover_id': 'Rover-1', 'soil_moisture': 74.3, 'soil_pH': 7.1, 'temperature': 10.67, 'battery_level': 60.92}, 'Rover-2': {'timestamp': 1743541980.7809546, 'rover_id': 'Rover-2', 'soil_moisture': 74.3, 'soil_pH': 7.1, 'temperature': 10.67, 'battery_level': 60.92}, 'Rover-3': {'timestamp': 1743541980.7809546, 'rover_id': 'Rover-3', 'soil_moisture': 74.3, 'soil_pH': 7.1, 'temperature': 10.67, 'battery_level': 60.92}, 'Rover-4': {'timestamp': 1743541980.7809546, 'rover_id': 'Rover-4', 'soil_moisture': 74.3, 'soil_pH': 7.1, 'temperature': 10.67, 'battery_level': 60.92}, 'Rover-5': {'timestamp': 1743541980.7809546, 'rover_id': 'Rover-5', 'soil_moisture': 74.3, 'soil_pH': 7.1, 'temperature': 10.67, 'battery_level': 60.92}}
@app.route('/api/rover/battery', methods=['GET'])
def get_battery_level():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
        
    rover_data = {}
    for rover in rovers:
        response = requests.get(f"{base_url}/api/rover/{rover}/battery?session_id={session_id}")
        if response.status_code != 200:
            return jsonify({"error": f"Failed to get battery level for {rover}"}), response.status_code
        rover_data[rover] = response.json()
    return jsonify(rover_data)
#sample output - Rover Battery Level: {'Rover-1':{'rover_id': 'Rover-1', 'battery_level': 97} ,'Rover-2': {'rover_id': 'Rover-2', 'battery_level': 83}, 'Rover-3': {'rover_id': 'Rover-3', 'battery_level': 70}, 'Rover-4': {'rover_id': 'Rover-4', 'battery_level': 83}, 'Rover-5': {'rover_id': 'Rover-5', 'battery_level': 94}}

@app.route('/api/rover/coordinates', methods=['GET'])
def get_rover_coordinates():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
        
    rover_data = {}
    for rover in rovers:
        response = requests.get(f"{base_url}/api/rover/{rover}/coordinates?session_id={session_id}")
        if response.status_code != 200:
            return jsonify({"error": f"Failed to get coordinates for {rover}"}), response.status_code
        rover_data[rover] = response.json()
    return jsonify(rover_data)

#sample output - Rover Coordinates: {'Rover-1': {'rover_id': 'Rover-1', 'coordinates': [-2, -1]}, 'Rover-2': {'rover_id': 'Rover-2', 'coordinates': [10, 10]}, 'Rover-3': {'rover_id': 'Rover-3', 'coordinates': [-6, -5]}, 'Rover-4': {'rover_id': 'Rover-4', 'coordinates': [-9, 10]}, 'Rover-5': {'rover_id': 'Rover-5', 'coordinates': [9, 9]}}
@app.route('/api/rover/move', methods=['POST'])
def move_rover():
    data = request.json
    rover = data.get("rover")
    direction = data.get("direction")
    session_id = data.get("session_id")
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    if not rover:
        return jsonify({"error": "Rover name is required"}), 400
    if not direction:
        return jsonify({"error": "Direction is required"}), 400
    if direction not in directions:
        return jsonify({"error": f"Invalid direction. Must be one of: {', '.join(directions)}"}), 400
        
    response = requests.post(f"{base_url}/api/rover/{rover}/move?session_id={session_id}&direction={direction}")
    if response.status_code != 200:
        return jsonify({"error": f"Failed to move {rover} in direction {direction}"}), response.status_code
    return jsonify(response.json())

#sample output - {'message': 'Rover-2 started moving forward'}

@app.route('/api/rover/reset', methods=['POST'])
def reset_rover():
    data = request.json
    rover = data.get("rover")
    session_id = data.get("session_id")
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    if not rover:
        return jsonify({"error": "Rover name is required"}), 400
        
    response = requests.post(f"{base_url}/api/rover/{rover}/reset?session_id={session_id}")
    if response.status_code != 200:
        return jsonify({"error": f"Failed to reset {rover}"}), response.status_code
    return jsonify(response.json())
#sample output - {'message': 'Rover-2 reset to idle'}
@app.route('/api/rover/task', methods=['POST'])
def assign_task():
    data = request.json
    rover = data.get("rover")
    task = data.get("task")
    session_id = data.get("session_id")
    
    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400
    if not rover:
        return jsonify({"error": "Rover name is required"}), 400
    if not task:
        return jsonify({"error": "Task is required"}), 400
    if task not in tasks:
        return jsonify({"error": f"Invalid task. Must be one of: {', '.join(tasks)}"}), 400
        
    response = requests.post(f"{base_url}/api/rover/{rover}/task?session_id={session_id}&task={task}")
    if response.status_code != 200:
        return jsonify({"error": f"Failed to assign task {task} to {rover}"}), response.status_code
    return jsonify(response.json())
#sample output - {'message': 'Rover-2 assigned task: Irrigation'}
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)