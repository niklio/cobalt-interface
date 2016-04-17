module.exports = function ($scope, $rootScope, $q, robotService) {

    var resolveRobots = function (promise) {
        var deferred = $q.defer();
        promise.then(function (res) {
            $scope.robots = res;
            deferred.resolve(res);
        }, function (reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    this.cacheRobots = function () {
        return resolveRobots(robotService.cacheRobots());
    }

    // Returns PROMISE, not Array
    this.getRobots = function () {
        return resolveRobots(robotService.getRobots());
    };

    this.selectRobots = function(robot) {
        robotService.setSelectedRobots(robots);
    }
    this.selectRobotsByLocation = function (x_cord, y_cord) {
        var distance_threshhold = (arguments[2]) ? arguments[2]: 0;
        robotService.selectRobotsByLocation(x_cord, y_cord, distance_threshhold);
    };
    this.selectAllRobots = function () {
        robotService.selectAllRobots();
    };

    this.updateSelectedRobot = function (update) {
        if (!$scope.selectedRobot) {
            return;
        }
        robotService.updateRobotByIndex($scope.selectedRobot['key'], update);
    };

    $scope.selectedRobot = null;
    $scope.selectedRobots = [];
    $rootScope.$on('update-selected-robots', function () {
        robotService.getSelectedRobots().then(function (res) {
            $scope.selectedRobot = res.length == 1 ? res[0] : null
            $scope.selectedRobots = res;
        }, function (reason) {
            console.log(reason);
        })
    });
};