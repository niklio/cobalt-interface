module.exports = function($rootScope, $http, $q) {

    var service = {};
    var robots, selectedRobots;

    service.getSelectedRobots = function () {
        if (selectedRobots != undefined) {
            return selectedRobots.promise;
        } else {
            return service.getRobots()
        }
    };

    service.setSelectedRobots = function (selected) {
        var deferred = $q.defer();

        // FIXME: Only call update selected when needed.
        service.getSelectedRobots().then(function (val) {
            if (val != selected) {
                deferred.resolve(selected);
                selectedRobots = deferred;
            }
            if (!selected.length) {
                selectedRobots = robots;
            }
        })['finally'](updateSelected);
    };

    service.cacheRobots = function () {

        var selectedRobotKeys = [];
        if (selectedRobots) {
            selectedRobots.promise
            .then(function (res) {
                for (var i = 0; i < res.length; i++) {
                    var robot = res[i];
                    selectedRobotKeys.push(robot['key']);
                }
            });
        }

        var deferred = $q.defer();
        var selectedRobotsDeferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/robots'
        })
        .success(function (data) {
            var robots = [];
            var selectedRobots = [];
            for (var index in data['robots']) {
                robot_data = data['robots'][index];
                robot_data["key"] = index;

                if (selectedRobotKeys.indexOf(index) != -1) {
                    selectedRobots.push(robot_data);
                }

                robots.push(robot_data);
            }
            deferred.resolve(robots);
            service.setSelectedRobots(selectedRobots);
        })
        .error(function (data, status) {
            deferred.reject("Error in robotController.cacheRobot");
            selectedRobotsDeferred.reject("Error in robotController.cacheRobot")
        })['finally'](updateSelected);


        return (robots = deferred).promise
    }

    service.getRobots = function () {
        if (robots != undefined) {
            return robots.promise;
        } else {
            return service.cacheRobots();
        }
    };

    service.updateRobotByIndex = function (key, update_data) {
        update_data['robot_id'] = key
        $http({
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            url: '/api/robots',
            data: update_data
        });

        var deferred = $q.defer();
        robots.promise.then(function (res) {
            for (var i = 0; i < res.length; i++) {
                if (res[i]['key'] != key) {
                    continue
                }

                for (var update_key in update_data) {
                    res[i][update_key] = update_data[update_key];
                }
            }
            deferred.resolve(res);
        });
        robots = deferred;
    };


    service.selectRobotsByLocation = function (x_cord, y_cord, distance_threshhold) {
        service.getRobots().then(function (val) {
            var selected = [];
            var unselected = val.filter(function (i) {return selected.indexOf(i) < 0;});
            for (var i = 0; i < unselected.length; i++) {
                var robot = unselected[i];

                var robot_x = robot["x"];
                var robot_y = robot["y"];

                var distance = Math.sqrt(Math.pow(x_cord - robot_x, 2) + Math.pow(y_cord - robot_y, 2));
                if (distance <= distance_threshhold) {
                    selected.push(robot);
                }
            }

            service.setSelectedRobots(selected);
        });
    };
    service.selectAllRobots = function () {
        service.getRobots().then(function (val) {
            service.setSelectedRobots(val);
        });
    };

    function updateSelected() {
        $rootScope.$emit('update-selected-robots');
    }

    return service;
};