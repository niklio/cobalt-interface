angular.module('robots.services', []);
angular.module('robots.controllers', ['robots.services']);
angular.module('robots.directives', ['robots.controllers', 'smart-table']);

var interface = angular.module('robots', [
    'ngRoute',
    'smart-table',
    'robots.services',
    'robots.controllers',
    'robots.directives',
]);

require('./services');
require('./controllers');
require('./directives')

interface.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'scripts/robots.html',
    });
}]);