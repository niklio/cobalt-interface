module.exports = function () {
    
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        controller: "robotController",
        templateUrl: 'scripts/controlPanel.html',
        link: function (scope, element, attrs, controller) {
            scope.isPanelVisible = false;
            scope.togglePanel = function () {
                scope.isPanelVisible = !scope.isPanelVisible;
            };
        },
    };
};