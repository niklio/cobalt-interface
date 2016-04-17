# Backend server to power API
# Instructions:
# 1. sudo pip install -r requirements.txt
# 2. python server.py
# 3. [open localhost:3000] in your web browser

import json
import os
import time
import math
import random
from flask import Flask, Response, request


app = Flask(__name__, static_url_path='', static_folder='.tmp')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))
app.debug = True

def run_sim(data):
    """Time steps the robots forward with a simple simulation. 
    Keeps track of how long ago we last updated in json to do time steps"""
    print "simming"
    # params
    speed = 1

    # time stepping
    t0 = data["t0"]
    t1 = time.time()

    # max timestep of 2 seconds
    delta = min(t1 - t0, 2)
    data["t0"] = t1

    print "looping"
    # looping over robots
    for rid, r in data["robots"].items():

        id = int(rid)
        # updating position, gross I know
        dir_x = 1 if r["goal_x"] > r["x"] else -1
        dir_y = 1 if r["goal_y"] > r["y"] else -1

        vx = min(speed * delta, abs(r["goal_x"] - r["x"]))
        vy = min(speed * delta, abs(r["goal_y"] - r["y"]))

        r["x"] += dir_x * vx
        r["y"] += dir_y * vy

        # Miscellaneous stuff
        r["battery"] -= random.random()
        if r["battery"] < 0:
            r["battery"] = 100

        r["wifi_strength"] = -45 + 2 * r["y"]
        r["cellular_strength"] = -45 - 30 * random.random()
        r["task"] = random.choice(["observing", "reporting"]) if random.random() < .9 else "becoming_skynet"
        r["cpu_temp"] = 50 + 30 * math.sin(id + t1 / 16)
        r["gpu_temp"] = 50 + 30 * math.sin(id + t1 / 17)
        r["cpu_load"] = random.random()
        # BUGFIX!
        # Old: 
        # r["gpu_temp"] = .5 * random.random()
        # New:
        r["gpu_load"] = .5 * random.random()
        r["ram"] = 1 + 7 * random.random()
        # Doesnt this make more sense?:
        # r["motor_temp"] = 45 +20 * ((r["x"] - r["goal_x"])^2 + (r["y"] - r["goal_y"])^2)^(1/2)
        r["motor_temp"] = 45 +20 * abs(r["x"] - r["goal_x"])
        r["risk_level"] = 5 + 5 * math.sin(id + t1 / 13)
        r["flux_capacitor_charge"] = math.sin(id + t1 / 5)
        r["has_become_skynet"] = random.random() > .95

        # saving data back to main dictionary
        data["robots"][rid] = r

    return data


@app.route('/api/robots', methods=['GET', 'POST'])
def robot_api():
    print 1

    with open('robots.json', 'r') as file:
        robot_data = json.loads(file.read())

    print 2
    # update data on robot
    if request.method == 'POST':
        print "posting"

        # Changed this to make it play nicely with angular.
        # Maybe theres a way to set request.form, but I dont know it.
        request_data = request.get_json()
        try:
            robot_id = request_data["robot_id"]
            goal_x = float(request_data["goal_x"])
            goal_y = float(request_data["goal_y"])
        except:
            return Response("ERROR: did not find robot_id, goal_x, or goal_y in POST")

        if robot_id not in robot_data["robots"]:
            return Response("ERROR: Robot ID not found")

        # updating goals
        robot_data["robots"][robot_id]["goal_x"] = goal_x
        robot_data["robots"][robot_id]["goal_y"] = goal_y
        print "done posting"

    # simulate behavior of the robots
    robot_data = run_sim(robot_data)

    # write changes back to file
    with open('robots.json', 'w') as file:
            file.write(json.dumps(robot_data, indent=4, separators=(',', ': ')))


    # return new data on robot
    return Response(json.dumps(robot_data), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})

if __name__ == '__main__':
    print "THIS IS THE PORT %s" % int(os.environ.get("PORT", 3000))
    app.run(port=int(os.environ.get("PORT", 3000)))