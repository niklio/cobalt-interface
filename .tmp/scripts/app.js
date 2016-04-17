(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = angular.module('robots.controllers');

app.controller('robotController', require('./robotController'));

},{"./robotController":2}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
var app = angular.module('robots.directives');

app.directive('robotCanvas', require('./robotCanvas.js'));
app.directive('controlPanel', require('./controlPanel.js'));
app.directive('listPanel', require('./listPanel.js'));
app.directive('singlePanel', require('./singlePanel.js'));
},{"./controlPanel.js":3,"./listPanel.js":5,"./robotCanvas.js":6,"./singlePanel.js":7}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
module.exports = function () {
    
    return {
        restrict: "E",
        replace: true,
        controller: "robotController",
        templateUrl: 'scripts/robotCanvas.html',
        link: function (scope, element, attrs, controller) {

            var ctx = element[0].getContext("2d");

            var Robot = function (robot_data) {
                this.data = robot_data;

                this.only_bot_selected = function () {
                    return (scope.selectedRobot) ? scope.selectedRobot['key'] == robot_data['key'] : false;
                };

                this.hasnt_reached_goal = function () {
                    return this.data['x'] != this.data['goal_x'] || this.data['y'] != this.data['goal_y'];
                }

                this.draw_bot = function (x, y) {
                    // Outer ring
                    if (this.only_bot_selected()) {
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "#E6E7E8";
                        ctx.fillStyle = "#E6E7E8";

                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, 2*Math.PI);
                        ctx.stroke();
                        ctx.fill();
                    }

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#00C4FF";
                    ctx.fillStyle = "#00C4FF";

                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.fill();
                };

                this.draw_goal = function (x, y) {
                    ctx.lineWidth = .5;
                    ctx.strokeStyle = "#E6E7E8";
                    ctx.fillStyle = "#E6E7E8";

                    ctx.beginPath();
                    ctx.arc(x, y, .5, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.fill();

                    // Line to goal
                    ctx.moveTo(x, y);
                    ctx.lineTo(this.data['x'], this.data['y']);
                    ctx.stroke();
                };


                if (this.only_bot_selected() && this.hasnt_reached_goal()) {
                    this.draw_goal(this.data['goal_x'], this.data['goal_y'])
                }
                this.draw_bot(this.data["x"], this.data["y"]);
            }

            // Zoom factor
            var canvas_zoom_x = 8;
            var canvas_zoom_y = 8;

            // Center of screen offset in pixels
            var canvas_offset_x = 0;
            var canvas_offset_y = 0;

            // Absolute value of respective offsets must not exceed
            var canvas_bound_x = 0;
            var canvas_bound_y = 0;

            // Parent container size
            var parent_width = element.parent().width();
            var parent_height = element.parent().height();


            var draw_robots = function (robots_data) {
                for (var j = 0; j < robots_data.length; j++) {
                    var robot_data = robots_data[j];
                    canvas_bound_x = Math.max(
                                        canvas_bound_x,
                                        Math.abs(robot_data['x']) * canvas_zoom_x,
                                        Math.abs(robot_data['goal_x']) * canvas_zoom_x);
                    canvas_bound_y = Math.max(
                                        canvas_bound_y,
                                        Math.abs(robot_data['x']) * canvas_zoom_y,
                                        Math.abs(robot_data['goal_y']) * canvas_zoom_y);

                    new Robot(robot_data);
                }
            };

            var draw_canvas = function () {
                parent_width = element.parent().width();
                parent_height = element.parent().height();

                ctx.canvas.width = parent_width;
                ctx.canvas.height = parent_height;

                ctx.transform(canvas_zoom_x, 0, 0, canvas_zoom_y, parent_width / 2 + canvas_offset_x, parent_height / 2 + canvas_offset_y);
                controller.getRobots().then(draw_robots)
            };


            var clickX = clickY = 0;

            $(window).on('mousemove', function (e) {
                clickX = (e.clientX - parent_width / 2 - canvas_offset_x) / canvas_zoom_x;
                clickY = (e.clientY - parent_height / 2 - canvas_offset_y) / canvas_zoom_y;
            });

            element.on('mousedown', function (e) {
                switch (e.which) {
                    case 1:
                        controller.selectRobotsByLocation(clickX, clickY, 1);
                        break;
                    case 3:
                        e.preventDefault();
                        e.stopPropagation();
                        controller.updateSelectedRobot({
                            "goal_x": clickX,
                            "goal_y": clickY
                        });

                        draw_canvas();
                        break;
                }
            });


            // Arrow key navigation. Spacebar to recenter
            $(window).on('keydown', function (e) {
                delta_x = 0;
                delta_y = 0;
                switch (e.keyCode) {
                    case 32:
                        canvas_offset_x = 0;
                        canvas_offset_y = 0;
                        break;
                    case 37:
                        delta_x = 20;
                    break;
                    case 38:
                        delta_y += 20;
                    break;
                    case 39:
                        delta_x -= 20
                    break;
                    case 40:
                        delta_y -= 20;
                    break;
                    default:
                        return;
                }

                canvas_offset_x += Math.abs(canvas_offset_x + delta_x) < canvas_bound_x ? delta_x : 0;
                canvas_offset_y += Math.abs(canvas_offset_y + delta_y) < canvas_bound_y ? delta_y : 0;

                draw_canvas();
            });



            scope.$watch('selectedRobot', draw_canvas);

            $(window).on('resize', draw_canvas);

            // On page load
            draw_canvas();

        }
    };
};
},{}],7:[function(require,module,exports){
module.exports = function ($rootScope) {
    return {
        restrict: "E",
        replace: true,
        controller: "robotController",
        templateUrl: "scripts/singlePanel.html",
        link: function (scope, element, attrs, controller) {

            function Task() {
                this.el = $('#task-select');
                this.set = function (val) {
                    this.el.val(val);
                };
            };

            function Flux() {
                this.el = $('#flux-slider')
                this.el.slider({
                    min: -100,
                    max: 100
                });
                this.set = function (val) {
                    val = val > 1 ? 1 : val;
                    val = val < -1 ? -1 : val;
                    val_norm = val * 100
                    this.el.slider('value', val_norm);
                };
            };

            function Battery() {
                this.el = $('#battery-bar');
                this.set = function (val) {
                    this.el.width(val + '%');
                };
            };

            function Risk() {
                this.el = $('#risk-bar');
                this.set = function (val) {
                    val_norm = val * 10
                    this.el.width(val_norm + '%');
                };
            };

            function Cell() {
                this.el = $('#cell-strength-bar');
                this.set = function (val) {
                    val_norm = (val + 70) * (10 / 3);
                    this.el.width((val_norm / 2) + '%');
                };
            };

            function Wifi() {
                this.el = $('#wifi-strength-bar');
                this.set = function (val) {
                    val = val > 0 ? 0 : val;
                    val = val < -100 ? -100 : val;
                    val_norm = val + 100;
                    this.el.width((val_norm / 2) + '%');
                };
            };

            function Temp(id) {
                this.el = $('#' + id);
                this.set = function (val) {
                    val_norm = (val - 20) * (4 / 5);
                    this.el.width((val_norm / 2) + '%');
                };
            };

            function CpuLoad() {
                this.el = $('#cpu-load-bar');
                this.set = function (val) {
                    val_norm = val * 100;
                    this.el.width((val_norm / 2) + '%');
                };
            };

            function GpuLoad() {
                this.el = $('#gpu-load-bar');
                this.set = function (val) {
                    val_norm = val * 200;
                    this.el.width((val_norm / 2) + '%');
                }
            }

            function Ram() {
                this.el = $('#ram-bar');
                this.set = function (val) {
                    val_norm = (val - 1) * (50 / 3);
                    this.el.width((val_norm / 2) + '%');
                };
            };

            function MotorTemp() {
                this.el = $('#motor-temp-bar');
                this.set = function (val) {
                    val = val > 125 ? 125 : val;
                    val_norm = val - 25;
                    this.el.width((val_norm / 2) + '%');
                };
            };

            var task = new Task();
            var battery = new Battery();
            var flux = new Flux();
            var risk = new Risk();
            var cell = new Cell();
            var wifi = new Wifi();
            var cpu_load = new CpuLoad();
            var cpu_temp = new Temp('cpu-temp-bar');
            var gpu_load = new GpuLoad();
            var gpu_temp = new Temp('gpu-temp-bar');
            var ram = new Ram();
            var motor_temp = new MotorTemp();

            scope.$watch('selectedRobot', function () {
                if (!scope.selectedRobot) {
                    return
                }
                robot = scope.selectedRobot;

                task.set(robot.task);
                battery.set(robot.battery);
                flux.set(robot.flux_capacitor_charge);
                risk.set(robot.risk_level);
                cell.set(robot.cellular_strength);
                wifi.set(robot.wifi_strength);
                cpu_load.set(robot.cpu_load);
                cpu_temp.set(robot.cpu_temp);
                gpu_load.set(robot.gpu_load);
                gpu_temp.set(robot.gpu_temp);
                ram.set(robot.ram);
                motor_temp.set(robot.motor_temp);

            });
        }
    }
};
},{}],8:[function(require,module,exports){
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
},{"./controllers":1,"./directives":4,"./services":9}],9:[function(require,module,exports){
var app = angular.module('robots.services');

app.service('robotService', require('./robotService.js'));
},{"./robotService.js":10}],10:[function(require,module,exports){
module.exports = function($rootScope, $http, $q) {

    var service = {};
    var robots, selectedRobots;

    service.getRobots = function () {
        if (robots != undefined) return robots.promise;
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: 'http://localhost:3000/api/robots'
        })
        .success(function (data) {
            var ret = [];
            for (var index in data['robots']) {
                robot_data = data['robots'][index];
                robot_data["key"] = index;
                ret.push(robot_data);
            }
            deferred.resolve(ret);
        })
        .error(function (data, status) {
            deferred.reject("Error in robotController.getRobot")
        })['finally'](updateSelected);
        return (robots = selectedRobots = deferred).promise
    };

    service.updateRobotByIndex = function (key, update_data) {
        update_data['robot_id'] = key
        $http({
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            url: 'http://localhost:3000/api/robots',
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
            console.log(res);
            deferred.resolve(res);
        });
        robots = deferred;
    };

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
},{}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvY29udHJvbGxlcnMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9jb250cm9sbGVycy9yb2JvdENvbnRyb2xsZXIuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2NvbnRyb2xQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2xpc3RQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvcm9ib3RDYW52YXMuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL3NpbmdsZVBhbmVsLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL3NlcnZpY2VzL3JvYm90U2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzLmNvbnRyb2xsZXJzJyk7XG5cbmFwcC5jb250cm9sbGVyKCdyb2JvdENvbnRyb2xsZXInLCByZXF1aXJlKCcuL3JvYm90Q29udHJvbGxlcicpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHEsIHJvYm90U2VydmljZSkge1xuXG4gICAgLy8gUmV0dXJucyBQUk9NSVNFLCBub3QgQXJyYXlcbiAgICB0aGlzLmdldFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgcm9ib3RTZXJ2aWNlLmdldFJvYm90cygpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICRzY29wZS5yb2JvdHMgPSByZXM7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHRoaXMuc2VsZWN0Um9ib3RzID0gZnVuY3Rpb24ocm9ib3QpIHtcbiAgICAgICAgcm9ib3RTZXJ2aWNlLnNldFNlbGVjdGVkUm9ib3RzKHJvYm90cyk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0Um9ib3RzQnlMb2NhdGlvbiA9IGZ1bmN0aW9uICh4X2NvcmQsIHlfY29yZCkge1xuICAgICAgICB2YXIgZGlzdGFuY2VfdGhyZXNoaG9sZCA9IChhcmd1bWVudHNbMl0pID8gYXJndW1lbnRzWzJdOiAwO1xuICAgICAgICByb2JvdFNlcnZpY2Uuc2VsZWN0Um9ib3RzQnlMb2NhdGlvbih4X2NvcmQsIHlfY29yZCwgZGlzdGFuY2VfdGhyZXNoaG9sZCk7XG4gICAgfTtcbiAgICB0aGlzLnNlbGVjdEFsbFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9ib3RTZXJ2aWNlLnNlbGVjdEFsbFJvYm90cygpO1xuICAgIH07XG5cbiAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkUm9ib3QgPSBmdW5jdGlvbiAodXBkYXRlKSB7XG4gICAgICAgIGlmICghJHNjb3BlLnNlbGVjdGVkUm9ib3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByb2JvdFNlcnZpY2UudXBkYXRlUm9ib3RCeUluZGV4KCRzY29wZS5zZWxlY3RlZFJvYm90WydrZXknXSwgdXBkYXRlKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNlbGVjdGVkUm9ib3QgPSBudWxsO1xuICAgICRzY29wZS5zZWxlY3RlZFJvYm90cyA9IFtdO1xuICAgICRyb290U2NvcGUuJG9uKCd1cGRhdGUtc2VsZWN0ZWQtcm9ib3RzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByb2JvdFNlcnZpY2UuZ2V0U2VsZWN0ZWRSb2JvdHMoKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZFJvYm90ID0gcmVzLmxlbmd0aCA9PSAxID8gcmVzWzBdIDogbnVsbFxuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkUm9ib3RzID0gcmVzO1xuICAgICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZWFzb24pO1xuICAgICAgICB9KVxuICAgIH0pO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogXCJFXCIsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6IFwicm9ib3RDb250cm9sbGVyXCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9jb250cm9sUGFuZWwuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIHNjb3BlLnRvZ2dsZVBhbmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmlzUGFuZWxWaXNpYmxlID0gIXNjb3BlLmlzUGFuZWxWaXNpYmxlO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZsYXNoJyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS4kd2F0Y2goJ3NlbGVjdGVkUm9ib3RzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY29wZS5zZWxlY3RlZFJvYm90cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmlzUGFuZWxWaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdmbGFzaCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59OyIsInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzLmRpcmVjdGl2ZXMnKTtcblxuYXBwLmRpcmVjdGl2ZSgncm9ib3RDYW52YXMnLCByZXF1aXJlKCcuL3JvYm90Q2FudmFzLmpzJykpO1xuYXBwLmRpcmVjdGl2ZSgnY29udHJvbFBhbmVsJywgcmVxdWlyZSgnLi9jb250cm9sUGFuZWwuanMnKSk7XG5hcHAuZGlyZWN0aXZlKCdsaXN0UGFuZWwnLCByZXF1aXJlKCcuL2xpc3RQYW5lbC5qcycpKTtcbmFwcC5kaXJlY3RpdmUoJ3NpbmdsZVBhbmVsJywgcmVxdWlyZSgnLi9zaW5nbGVQYW5lbC5qcycpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdyb2JvdENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbGlzdFBhbmVsLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBzY29wZS5zZWxlY3RSb2JvdCA9IGZ1bmN0aW9uIChyb2JvdCkge1xuICAgICAgICAgICAgICAgIHJvYm90cyA9IFtyb2JvdF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRyb2xsZXIuc2VsZWN0Um9ib3RzKHJvYm90cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyOiBcInJvYm90Q29udHJvbGxlclwiLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvcm9ib3RDYW52YXMuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcblxuICAgICAgICAgICAgdmFyIGN0eCA9IGVsZW1lbnRbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICB2YXIgUm9ib3QgPSBmdW5jdGlvbiAocm9ib3RfZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IHJvYm90X2RhdGE7XG5cbiAgICAgICAgICAgICAgICB0aGlzLm9ubHlfYm90X3NlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLnNlbGVjdGVkUm9ib3QpID8gc2NvcGUuc2VsZWN0ZWRSb2JvdFsna2V5J10gPT0gcm9ib3RfZGF0YVsna2V5J10gOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5oYXNudF9yZWFjaGVkX2dvYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFbJ3gnXSAhPSB0aGlzLmRhdGFbJ2dvYWxfeCddIHx8IHRoaXMuZGF0YVsneSddICE9IHRoaXMuZGF0YVsnZ29hbF95J107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3X2JvdCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE91dGVyIHJpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25seV9ib3Rfc2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBcIiNFNkU3RThcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNFNkU3RThcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyh4LCB5LCAxLjUsIDAsIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiIzAwQzRGRlwiO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCIjMDBDNEZGXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgsIHksIDEsIDAsIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3X2dvYWwgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gLjU7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiI0U2RTdFOFwiO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCIjRTZFN0U4XCI7XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgsIHksIC41LCAwLCAyKk1hdGguUEkpO1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTGluZSB0byBnb2FsXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8odGhpcy5kYXRhWyd4J10sIHRoaXMuZGF0YVsneSddKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9ubHlfYm90X3NlbGVjdGVkKCkgJiYgdGhpcy5oYXNudF9yZWFjaGVkX2dvYWwoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdfZ29hbCh0aGlzLmRhdGFbJ2dvYWxfeCddLCB0aGlzLmRhdGFbJ2dvYWxfeSddKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdfYm90KHRoaXMuZGF0YVtcInhcIl0sIHRoaXMuZGF0YVtcInlcIl0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBab29tIGZhY3RvclxuICAgICAgICAgICAgdmFyIGNhbnZhc196b29tX3ggPSA4O1xuICAgICAgICAgICAgdmFyIGNhbnZhc196b29tX3kgPSA4O1xuXG4gICAgICAgICAgICAvLyBDZW50ZXIgb2Ygc2NyZWVuIG9mZnNldCBpbiBwaXhlbHNcbiAgICAgICAgICAgIHZhciBjYW52YXNfb2Zmc2V0X3ggPSAwO1xuICAgICAgICAgICAgdmFyIGNhbnZhc19vZmZzZXRfeSA9IDA7XG5cbiAgICAgICAgICAgIC8vIEFic29sdXRlIHZhbHVlIG9mIHJlc3BlY3RpdmUgb2Zmc2V0cyBtdXN0IG5vdCBleGNlZWRcbiAgICAgICAgICAgIHZhciBjYW52YXNfYm91bmRfeCA9IDA7XG4gICAgICAgICAgICB2YXIgY2FudmFzX2JvdW5kX3kgPSAwO1xuXG4gICAgICAgICAgICAvLyBQYXJlbnQgY29udGFpbmVyIHNpemVcbiAgICAgICAgICAgIHZhciBwYXJlbnRfd2lkdGggPSBlbGVtZW50LnBhcmVudCgpLndpZHRoKCk7XG4gICAgICAgICAgICB2YXIgcGFyZW50X2hlaWdodCA9IGVsZW1lbnQucGFyZW50KCkuaGVpZ2h0KCk7XG5cblxuICAgICAgICAgICAgdmFyIGRyYXdfcm9ib3RzID0gZnVuY3Rpb24gKHJvYm90c19kYXRhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByb2JvdHNfZGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcm9ib3RfZGF0YSA9IHJvYm90c19kYXRhW2pdO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXNfYm91bmRfeCA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhc19ib3VuZF94LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvYm90X2RhdGFbJ3gnXSkgKiBjYW52YXNfem9vbV94LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvYm90X2RhdGFbJ2dvYWxfeCddKSAqIGNhbnZhc196b29tX3gpO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXNfYm91bmRfeSA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhc19ib3VuZF95LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvYm90X2RhdGFbJ3gnXSkgKiBjYW52YXNfem9vbV95LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHJvYm90X2RhdGFbJ2dvYWxfeSddKSAqIGNhbnZhc196b29tX3kpO1xuXG4gICAgICAgICAgICAgICAgICAgIG5ldyBSb2JvdChyb2JvdF9kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgZHJhd19jYW52YXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50X3dpZHRoID0gZWxlbWVudC5wYXJlbnQoKS53aWR0aCgpO1xuICAgICAgICAgICAgICAgIHBhcmVudF9oZWlnaHQgPSBlbGVtZW50LnBhcmVudCgpLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgICAgY3R4LmNhbnZhcy53aWR0aCA9IHBhcmVudF93aWR0aDtcbiAgICAgICAgICAgICAgICBjdHguY2FudmFzLmhlaWdodCA9IHBhcmVudF9oZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICBjdHgudHJhbnNmb3JtKGNhbnZhc196b29tX3gsIDAsIDAsIGNhbnZhc196b29tX3ksIHBhcmVudF93aWR0aCAvIDIgKyBjYW52YXNfb2Zmc2V0X3gsIHBhcmVudF9oZWlnaHQgLyAyICsgY2FudmFzX29mZnNldF95KTtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyLmdldFJvYm90cygpLnRoZW4oZHJhd19yb2JvdHMpXG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIHZhciBjbGlja1ggPSBjbGlja1kgPSAwO1xuXG4gICAgICAgICAgICAkKHdpbmRvdykub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tYID0gKGUuY2xpZW50WCAtIHBhcmVudF93aWR0aCAvIDIgLSBjYW52YXNfb2Zmc2V0X3gpIC8gY2FudmFzX3pvb21feDtcbiAgICAgICAgICAgICAgICBjbGlja1kgPSAoZS5jbGllbnRZIC0gcGFyZW50X2hlaWdodCAvIDIgLSBjYW52YXNfb2Zmc2V0X3kpIC8gY2FudmFzX3pvb21feTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZS53aGljaCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLnNlbGVjdFJvYm90c0J5TG9jYXRpb24oY2xpY2tYLCBjbGlja1ksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLnVwZGF0ZVNlbGVjdGVkUm9ib3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ29hbF94XCI6IGNsaWNrWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdvYWxfeVwiOiBjbGlja1lcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3X2NhbnZhcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgLy8gQXJyb3cga2V5IG5hdmlnYXRpb24uIFNwYWNlYmFyIHRvIHJlY2VudGVyXG4gICAgICAgICAgICAkKHdpbmRvdykub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGRlbHRhX3ggPSAwO1xuICAgICAgICAgICAgICAgIGRlbHRhX3kgPSAwO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXNfb2Zmc2V0X3ggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzX29mZnNldF95ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFfeCA9IDIwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhX3kgKz0gMjA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM5OlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFfeCAtPSAyMFxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhX3kgLT0gMjA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNhbnZhc19vZmZzZXRfeCArPSBNYXRoLmFicyhjYW52YXNfb2Zmc2V0X3ggKyBkZWx0YV94KSA8IGNhbnZhc19ib3VuZF94ID8gZGVsdGFfeCA6IDA7XG4gICAgICAgICAgICAgICAgY2FudmFzX29mZnNldF95ICs9IE1hdGguYWJzKGNhbnZhc19vZmZzZXRfeSArIGRlbHRhX3kpIDwgY2FudmFzX2JvdW5kX3kgPyBkZWx0YV95IDogMDtcblxuICAgICAgICAgICAgICAgIGRyYXdfY2FudmFzKCk7XG4gICAgICAgICAgICB9KTtcblxuXG5cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRSb2JvdCcsIGRyYXdfY2FudmFzKTtcblxuICAgICAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBkcmF3X2NhbnZhcyk7XG5cbiAgICAgICAgICAgIC8vIE9uIHBhZ2UgbG9hZFxuICAgICAgICAgICAgZHJhd19jYW52YXMoKTtcblxuICAgICAgICB9XG4gICAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoJHJvb3RTY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiBcIkVcIixcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlcjogXCJyb2JvdENvbnRyb2xsZXJcIixcbiAgICAgICAgdGVtcGxhdGVVcmw6IFwic2NyaXB0cy9zaW5nbGVQYW5lbC5odG1sXCIsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcblxuICAgICAgICAgICAgZnVuY3Rpb24gVGFzaygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI3Rhc2stc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwudmFsKHZhbCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIEZsdXgoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNmbHV4LXNsaWRlcicpXG4gICAgICAgICAgICAgICAgdGhpcy5lbC5zbGlkZXIoe1xuICAgICAgICAgICAgICAgICAgICBtaW46IC0xMDAsXG4gICAgICAgICAgICAgICAgICAgIG1heDogMTAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbCA+IDEgPyAxIDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwgPCAtMSA/IC0xIDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAqIDEwMFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLnNsaWRlcigndmFsdWUnLCB2YWxfbm9ybSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIEJhdHRlcnkoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNiYXR0ZXJ5LWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKHZhbCArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFJpc2soKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNyaXNrLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAqIDEwXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgodmFsX25vcm0gKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBDZWxsKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjY2VsbC1zdHJlbmd0aC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSAodmFsICsgNzApICogKDEwIC8gMyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBXaWZpKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjd2lmaS1zdHJlbmd0aC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gdmFsID4gMCA/IDAgOiB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbCA8IC0xMDAgPyAtMTAwIDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCArIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC53aWR0aCgodmFsX25vcm0gLyAyKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFRlbXAoaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnIycgKyBpZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbF9ub3JtID0gKHZhbCAtIDIwKSAqICg0IC8gNSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBDcHVMb2FkKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjY3B1LWxvYWQtYmFyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbF9ub3JtID0gdmFsICogMTAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKCh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gR3B1TG9hZCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI2dwdS1sb2FkLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAqIDIwMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC53aWR0aCgodmFsX25vcm0gLyAyKSArICclJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBSYW0oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNyYW0tYmFyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbF9ub3JtID0gKHZhbCAtIDEpICogKDUwIC8gMyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBNb3RvclRlbXAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNtb3Rvci10ZW1wLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwgPiAxMjUgPyAxMjUgOiB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHZhbF9ub3JtID0gdmFsIC0gMjU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgdGFzayA9IG5ldyBUYXNrKCk7XG4gICAgICAgICAgICB2YXIgYmF0dGVyeSA9IG5ldyBCYXR0ZXJ5KCk7XG4gICAgICAgICAgICB2YXIgZmx1eCA9IG5ldyBGbHV4KCk7XG4gICAgICAgICAgICB2YXIgcmlzayA9IG5ldyBSaXNrKCk7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IG5ldyBDZWxsKCk7XG4gICAgICAgICAgICB2YXIgd2lmaSA9IG5ldyBXaWZpKCk7XG4gICAgICAgICAgICB2YXIgY3B1X2xvYWQgPSBuZXcgQ3B1TG9hZCgpO1xuICAgICAgICAgICAgdmFyIGNwdV90ZW1wID0gbmV3IFRlbXAoJ2NwdS10ZW1wLWJhcicpO1xuICAgICAgICAgICAgdmFyIGdwdV9sb2FkID0gbmV3IEdwdUxvYWQoKTtcbiAgICAgICAgICAgIHZhciBncHVfdGVtcCA9IG5ldyBUZW1wKCdncHUtdGVtcC1iYXInKTtcbiAgICAgICAgICAgIHZhciByYW0gPSBuZXcgUmFtKCk7XG4gICAgICAgICAgICB2YXIgbW90b3JfdGVtcCA9IG5ldyBNb3RvclRlbXAoKTtcblxuICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdzZWxlY3RlZFJvYm90JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUuc2VsZWN0ZWRSb2JvdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcm9ib3QgPSBzY29wZS5zZWxlY3RlZFJvYm90O1xuXG4gICAgICAgICAgICAgICAgdGFzay5zZXQocm9ib3QudGFzayk7XG4gICAgICAgICAgICAgICAgYmF0dGVyeS5zZXQocm9ib3QuYmF0dGVyeSk7XG4gICAgICAgICAgICAgICAgZmx1eC5zZXQocm9ib3QuZmx1eF9jYXBhY2l0b3JfY2hhcmdlKTtcbiAgICAgICAgICAgICAgICByaXNrLnNldChyb2JvdC5yaXNrX2xldmVsKTtcbiAgICAgICAgICAgICAgICBjZWxsLnNldChyb2JvdC5jZWxsdWxhcl9zdHJlbmd0aCk7XG4gICAgICAgICAgICAgICAgd2lmaS5zZXQocm9ib3Qud2lmaV9zdHJlbmd0aCk7XG4gICAgICAgICAgICAgICAgY3B1X2xvYWQuc2V0KHJvYm90LmNwdV9sb2FkKTtcbiAgICAgICAgICAgICAgICBjcHVfdGVtcC5zZXQocm9ib3QuY3B1X3RlbXApO1xuICAgICAgICAgICAgICAgIGdwdV9sb2FkLnNldChyb2JvdC5ncHVfbG9hZCk7XG4gICAgICAgICAgICAgICAgZ3B1X3RlbXAuc2V0KHJvYm90LmdwdV90ZW1wKTtcbiAgICAgICAgICAgICAgICByYW0uc2V0KHJvYm90LnJhbSk7XG4gICAgICAgICAgICAgICAgbW90b3JfdGVtcC5zZXQocm9ib3QubW90b3JfdGVtcCk7XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJhbmd1bGFyLm1vZHVsZSgncm9ib3RzLnNlcnZpY2VzJywgW10pO1xuYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5jb250cm9sbGVycycsIFsncm9ib3RzLnNlcnZpY2VzJ10pO1xuYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5kaXJlY3RpdmVzJywgWydyb2JvdHMuY29udHJvbGxlcnMnLCAnc21hcnQtdGFibGUnXSk7XG5cbnZhciBpbnRlcmZhY2UgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzJywgW1xuICAgICduZ1JvdXRlJyxcbiAgICAnc21hcnQtdGFibGUnLFxuICAgICdyb2JvdHMuc2VydmljZXMnLFxuICAgICdyb2JvdHMuY29udHJvbGxlcnMnLFxuICAgICdyb2JvdHMuZGlyZWN0aXZlcycsXG5dKTtcblxucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJylcblxuaW50ZXJmYWNlLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICAgJHJvdXRlUHJvdmlkZXJcbiAgICAud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzY3JpcHRzL3JvYm90cy5odG1sJyxcbiAgICB9KTtcbn1dKTsiLCJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5zZXJ2aWNlcycpO1xuXG5hcHAuc2VydmljZSgncm9ib3RTZXJ2aWNlJywgcmVxdWlyZSgnLi9yb2JvdFNlcnZpY2UuanMnKSk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkcm9vdFNjb3BlLCAkaHR0cCwgJHEpIHtcblxuICAgIHZhciBzZXJ2aWNlID0ge307XG4gICAgdmFyIHJvYm90cywgc2VsZWN0ZWRSb2JvdHM7XG5cbiAgICBzZXJ2aWNlLmdldFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHJvYm90cyAhPSB1bmRlZmluZWQpIHJldHVybiByb2JvdHMucHJvbWlzZTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hcGkvcm9ib3RzJ1xuICAgICAgICB9KVxuICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggaW4gZGF0YVsncm9ib3RzJ10pIHtcbiAgICAgICAgICAgICAgICByb2JvdF9kYXRhID0gZGF0YVsncm9ib3RzJ11baW5kZXhdO1xuICAgICAgICAgICAgICAgIHJvYm90X2RhdGFbXCJrZXlcIl0gPSBpbmRleDtcbiAgICAgICAgICAgICAgICByZXQucHVzaChyb2JvdF9kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChcIkVycm9yIGluIHJvYm90Q29udHJvbGxlci5nZXRSb2JvdFwiKVxuICAgICAgICB9KVsnZmluYWxseSddKHVwZGF0ZVNlbGVjdGVkKTtcbiAgICAgICAgcmV0dXJuIChyb2JvdHMgPSBzZWxlY3RlZFJvYm90cyA9IGRlZmVycmVkKS5wcm9taXNlXG4gICAgfTtcblxuICAgIHNlcnZpY2UudXBkYXRlUm9ib3RCeUluZGV4ID0gZnVuY3Rpb24gKGtleSwgdXBkYXRlX2RhdGEpIHtcbiAgICAgICAgdXBkYXRlX2RhdGFbJ3JvYm90X2lkJ10gPSBrZXlcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ30sXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpL3JvYm90cycsXG4gICAgICAgICAgICBkYXRhOiB1cGRhdGVfZGF0YVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICByb2JvdHMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc1tpXVsna2V5J10gIT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdXBkYXRlX2tleSBpbiB1cGRhdGVfZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNbaV1bdXBkYXRlX2tleV0gPSB1cGRhdGVfZGF0YVt1cGRhdGVfa2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcm9ib3RzID0gZGVmZXJyZWQ7XG4gICAgfTtcblxuICAgIHNlcnZpY2UuZ2V0U2VsZWN0ZWRSb2JvdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxlY3RlZFJvYm90cyAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZFJvYm90cy5wcm9taXNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuZ2V0Um9ib3RzKClcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLnNldFNlbGVjdGVkUm9ib3RzID0gZnVuY3Rpb24gKHNlbGVjdGVkKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgLy8gRklYTUU6IE9ubHkgY2FsbCB1cGRhdGUgc2VsZWN0ZWQgd2hlbiBuZWVkZWQuXG4gICAgICAgIHNlcnZpY2UuZ2V0U2VsZWN0ZWRSb2JvdHMoKS50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIGlmICh2YWwgIT0gc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFJvYm90cyA9IGRlZmVycmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFJvYm90cyA9IHJvYm90cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlbJ2ZpbmFsbHknXSh1cGRhdGVTZWxlY3RlZCk7XG4gICAgfTtcblxuICAgIHNlcnZpY2Uuc2VsZWN0Um9ib3RzQnlMb2NhdGlvbiA9IGZ1bmN0aW9uICh4X2NvcmQsIHlfY29yZCwgZGlzdGFuY2VfdGhyZXNoaG9sZCkge1xuICAgICAgICBzZXJ2aWNlLmdldFJvYm90cygpLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gW107XG4gICAgICAgICAgICB2YXIgdW5zZWxlY3RlZCA9IHZhbC5maWx0ZXIoZnVuY3Rpb24gKGkpIHtyZXR1cm4gc2VsZWN0ZWQuaW5kZXhPZihpKSA8IDA7fSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVuc2VsZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcm9ib3QgPSB1bnNlbGVjdGVkW2ldO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJvYm90X3ggPSByb2JvdFtcInhcIl07XG4gICAgICAgICAgICAgICAgdmFyIHJvYm90X3kgPSByb2JvdFtcInlcIl07XG5cbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoTWF0aC5wb3coeF9jb3JkIC0gcm9ib3RfeCwgMikgKyBNYXRoLnBvdyh5X2NvcmQgLSByb2JvdF95LCAyKSk7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDw9IGRpc3RhbmNlX3RocmVzaGhvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQucHVzaChyb2JvdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXJ2aWNlLnNldFNlbGVjdGVkUm9ib3RzKHNlbGVjdGVkKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBzZXJ2aWNlLnNlbGVjdEFsbFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VydmljZS5nZXRSb2JvdHMoKS50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHNlcnZpY2Uuc2V0U2VsZWN0ZWRSb2JvdHModmFsKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGVkKCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCd1cGRhdGUtc2VsZWN0ZWQtcm9ib3RzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlcnZpY2U7XG59OyJdfQ==
