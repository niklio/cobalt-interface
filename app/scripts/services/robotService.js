module.exports = function($rootScope, $http, $q) {

    var service = {};
    var robots, selectedRobots;

    service.getRobots = function () {
        if (robots != undefined) return robots.promise;
        var deferred = $q.defer();
        $http({
            'method' : 'GET',
            'url': 'http://localhost:3000/api/robots',
        })
        .success(function (data) {
            var ret = [];
            for (var index in data['robots']) {
                ret.push(data['robots'][index]);
            }
            deferred.resolve(ret);
        })
        .error(function (data, status) {
            deferred.reject("Error in robotController.getRobot")
        })['finally'](updateSelected);
        return (robots = selectedRobots = deferred).promise
    };

    service.getSelectedRobots = function () {
        if (selectedRobots != undefined) {
            return selectedRobots.promise;
        } else {
            return service.getRobots()
        }
    };
    service.setSelectedRobots = function () {
        selected = (arguments[0]) ? arguments[0] : robots;
        var deferred = $q.defer();
        service.getSelectedRobots().then(function (val) {
            if (val != selected) {
                deferred.resolve(selected);
                selectedRobots = deferred;
            }
        })['finally'](updateSelected);
    };
    service.selectRobotsByLocation = function (x_cord, y_cord) {
        service.getRobots().then(function (val) {
            var distance_threshhold = (arguments[2]) ? arguments[2]: 0;

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