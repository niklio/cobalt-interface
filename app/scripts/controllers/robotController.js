module.exports = function ($scope, $rootScope, $q, robotService) {

    // Returns PROMISE, not Array
    this.getRobots = function () {
        var deferred = $q.defer();
        robotService.getRobots()
        .then(function (res) {
            $scope.robots = res;
            deferred.resolve(res);
        }, function (reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    this.selectRobots = function(robot) {
        return robotService.setSelectedRobots(robots);
    }
    this.selectRobotsByLocation = function (x_cord, y_cord) {
        return robotService.selectRobotsByLocation(x_cord, y_cord);
    };
    this.selectAllRobots = function () {
        return robotService.selectAllRobots();
    };

    $scope.selectedRobots = [];
    $rootScope.$on('update-selected-robots', function () {
        robotService.getSelectedRobots().then(function (res) {
            if (res.length == 1) {
                $scope.selectedRobot = res[0]
            }
            $scope.selectedRobots = res;
        }, function (reason) {
            console.log(reason);
        })
    });
};