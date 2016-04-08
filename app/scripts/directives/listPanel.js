module.exports = function () {

    return {
        restrict: 'E',
        replace: true,
        controller: 'robotController',
        templateUrl: 'scripts/listPanel.html',
        link: function (scope, element, attrs, controller) {
            scope.selectRobot = function (robot) {
                robots = [robot];
                return controller.selectRobots(robots);
            }
        },
    };
};