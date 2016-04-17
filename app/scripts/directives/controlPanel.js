module.exports = function () {
    
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        controller: "robotController",
        templateUrl: 'scripts/controlPanel.html',
        link: function (scope, element, attrs, controller) {
            scope.togglePanel = function () {
                scope.isPanelVisible = !scope.isPanelVisible;
                element.removeClass('flash');
            };

            scope.$watch('selectedRobots', function () {
                if (scope.selectedRobots.length > 1) {
                    scope.isPanelVisible = true;
                } else {
                    element.addClass('flash');
                }
            });
        },
    };
};