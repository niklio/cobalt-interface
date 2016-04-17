(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = angular.module('robots.controllers');

app.controller('robotController', require('./robotController'));

},{"./robotController":2}],2:[function(require,module,exports){
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

            var draw_canvas = function (robot_promise) {
                if (robot_promise == undefined) {
                    console.log("`draw_canvas` function requires argument `robot_promise`")
                    return
                }
                parent_width = element.parent().width();
                parent_height = element.parent().height();

                ctx.canvas.width = parent_width;
                ctx.canvas.height = parent_height;

                ctx.transform(canvas_zoom_x, 0, 0, canvas_zoom_y, parent_width / 2 + canvas_offset_x, parent_height / 2 + canvas_offset_y);
                robot_promise.then(draw_robots)
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

                        draw_canvas(controller.getRobots());
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

                draw_canvas(controller.getRobots());
            });


            setInterval(function () {
                draw_canvas(controller.cacheRobots());
            }, 3000);

            // Redraw canvas when a robot is selected
            scope.$watch('selectedRobot', function () {
                draw_canvas(controller.getRobots());
            });

            // Redraw canvas on page resize
            $(window).on('resize', function () {
                draw_canvas(controller.getRobots());
            });

            // On page load
            draw_canvas(controller.getRobots());

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
                    console.log(val)
                    this.el.css('width', val + '%');
                };
            };

            function Risk() {
                this.el = $('#risk-bar');
                this.set = function (val) {
                    val_norm = val * 10
                    this.el.css('width', val_norm + '%');
                };
            };

            function Cell() {
                this.el = $('#cell-strength-bar');
                this.set = function (val) {
                    val_norm = (val + 70) * (10 / 3);
                    this.el.css('width', (val_norm / 2) + '%');
                };
            };

            function Wifi() {
                this.el = $('#wifi-strength-bar');
                this.set = function (val) {
                    val = val > 0 ? 0 : val;
                    val = val < -100 ? -100 : val;
                    val_norm = val + 100;
                    this.el.css('width', (val_norm / 2) + '%');
                };
            };

            function Temp(id) {
                this.el = $('#' + id);
                this.set = function (val) {
                    val_norm = (val - 20) * (4 / 5);
                    this.el.css('width', (val_norm / 2) + '%');
                };
            };

            function CpuLoad() {
                this.el = $('#cpu-load-bar');
                this.set = function (val) {
                    val_norm = val * 100;
                    this.el.css('width', (val_norm / 2) + '%');
                };
            };

            function GpuLoad() {
                this.el = $('#gpu-load-bar');
                this.set = function (val) {
                    val_norm = val * 200;
                    this.el.css('width', (val_norm / 2) + '%');
                }
            }

            function Ram() {
                this.el = $('#ram-bar');
                this.set = function (val) {
                    val_norm = (val - 1) * (25 / 2);
                    this.el.css('width', (val_norm / 2) + '%');
                };
            };

            function MotorTemp() {
                this.el = $('#motor-temp-bar');
                this.set = function (val) {
                    val = val > 125 ? 125 : val;
                    val_norm = val - 25;
                    this.el.css('width', (val_norm / 2) + '%');
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
},{}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvY29udHJvbGxlcnMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9jb250cm9sbGVycy9yb2JvdENvbnRyb2xsZXIuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2NvbnRyb2xQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2xpc3RQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvcm9ib3RDYW52YXMuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL3NpbmdsZVBhbmVsLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL3NlcnZpY2VzL3JvYm90U2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzLmNvbnRyb2xsZXJzJyk7XG5cbmFwcC5jb250cm9sbGVyKCdyb2JvdENvbnRyb2xsZXInLCByZXF1aXJlKCcuL3JvYm90Q29udHJvbGxlcicpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHEsIHJvYm90U2VydmljZSkge1xuXG4gICAgdmFyIHJlc29sdmVSb2JvdHMgPSBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgJHNjb3BlLnJvYm90cyA9IHJlcztcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZVJvYm90cyhyb2JvdFNlcnZpY2UuY2FjaGVSb2JvdHMoKSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyBQUk9NSVNFLCBub3QgQXJyYXlcbiAgICB0aGlzLmdldFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVSb2JvdHMocm9ib3RTZXJ2aWNlLmdldFJvYm90cygpKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zZWxlY3RSb2JvdHMgPSBmdW5jdGlvbihyb2JvdCkge1xuICAgICAgICByb2JvdFNlcnZpY2Uuc2V0U2VsZWN0ZWRSb2JvdHMocm9ib3RzKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RSb2JvdHNCeUxvY2F0aW9uID0gZnVuY3Rpb24gKHhfY29yZCwgeV9jb3JkKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZV90aHJlc2hob2xkID0gKGFyZ3VtZW50c1syXSkgPyBhcmd1bWVudHNbMl06IDA7XG4gICAgICAgIHJvYm90U2VydmljZS5zZWxlY3RSb2JvdHNCeUxvY2F0aW9uKHhfY29yZCwgeV9jb3JkLCBkaXN0YW5jZV90aHJlc2hob2xkKTtcbiAgICB9O1xuICAgIHRoaXMuc2VsZWN0QWxsUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb2JvdFNlcnZpY2Uuc2VsZWN0QWxsUm9ib3RzKCk7XG4gICAgfTtcblxuICAgIHRoaXMudXBkYXRlU2VsZWN0ZWRSb2JvdCA9IGZ1bmN0aW9uICh1cGRhdGUpIHtcbiAgICAgICAgaWYgKCEkc2NvcGUuc2VsZWN0ZWRSb2JvdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJvYm90U2VydmljZS51cGRhdGVSb2JvdEJ5SW5kZXgoJHNjb3BlLnNlbGVjdGVkUm9ib3RbJ2tleSddLCB1cGRhdGUpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2VsZWN0ZWRSb2JvdCA9IG51bGw7XG4gICAgJHNjb3BlLnNlbGVjdGVkUm9ib3RzID0gW107XG4gICAgJHJvb3RTY29wZS4kb24oJ3VwZGF0ZS1zZWxlY3RlZC1yb2JvdHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvYm90U2VydmljZS5nZXRTZWxlY3RlZFJvYm90cygpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkUm9ib3QgPSByZXMubGVuZ3RoID09IDEgPyByZXNbMF0gOiBudWxsXG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRSb2JvdHMgPSByZXM7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlYXNvbik7XG4gICAgICAgIH0pXG4gICAgfSk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiBcIkVcIixcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlcjogXCJyb2JvdENvbnRyb2xsZXJcIixcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzY3JpcHRzL2NvbnRyb2xQYW5lbC5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgc2NvcGUudG9nZ2xlUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuaXNQYW5lbFZpc2libGUgPSAhc2NvcGUuaXNQYW5lbFZpc2libGU7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnZmxhc2gnKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRSb2JvdHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLnNlbGVjdGVkUm9ib3RzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXNQYW5lbFZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2ZsYXNoJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn07IiwidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdyb2JvdHMuZGlyZWN0aXZlcycpO1xuXG5hcHAuZGlyZWN0aXZlKCdyb2JvdENhbnZhcycsIHJlcXVpcmUoJy4vcm9ib3RDYW52YXMuanMnKSk7XG5hcHAuZGlyZWN0aXZlKCdjb250cm9sUGFuZWwnLCByZXF1aXJlKCcuL2NvbnRyb2xQYW5lbC5qcycpKTtcbmFwcC5kaXJlY3RpdmUoJ2xpc3RQYW5lbCcsIHJlcXVpcmUoJy4vbGlzdFBhbmVsLmpzJykpO1xuYXBwLmRpcmVjdGl2ZSgnc2luZ2xlUGFuZWwnLCByZXF1aXJlKCcuL3NpbmdsZVBhbmVsLmpzJykpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgY29udHJvbGxlcjogJ3JvYm90Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9saXN0UGFuZWwuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIHNjb3BlLnNlbGVjdFJvYm90ID0gZnVuY3Rpb24gKHJvYm90KSB7XG4gICAgICAgICAgICAgICAgcm9ib3RzID0gW3JvYm90XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udHJvbGxlci5zZWxlY3RSb2JvdHMocm9ib3RzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogXCJFXCIsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6IFwicm9ib3RDb250cm9sbGVyXCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9yb2JvdENhbnZhcy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcikge1xuXG4gICAgICAgICAgICB2YXIgY3R4ID0gZWxlbWVudFswXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgICAgIHZhciBSb2JvdCA9IGZ1bmN0aW9uIChyb2JvdF9kYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gcm9ib3RfZGF0YTtcblxuICAgICAgICAgICAgICAgIHRoaXMub25seV9ib3Rfc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoc2NvcGUuc2VsZWN0ZWRSb2JvdCkgPyBzY29wZS5zZWxlY3RlZFJvYm90WydrZXknXSA9PSByb2JvdF9kYXRhWydrZXknXSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmhhc250X3JlYWNoZWRfZ29hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVsneCddICE9IHRoaXMuZGF0YVsnZ29hbF94J10gfHwgdGhpcy5kYXRhWyd5J10gIT0gdGhpcy5kYXRhWydnb2FsX3knXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdfYm90ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gT3V0ZXIgcmluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbmx5X2JvdF9zZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiI0U2RTdFOFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiI0U2RTdFOFwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgsIHksIDEuNSwgMCwgMipNYXRoLlBJKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gXCIjMDBDNEZGXCI7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiMwMEM0RkZcIjtcblxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMoeCwgeSwgMSwgMCwgMipNYXRoLlBJKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdfZ29hbCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSAuNTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gXCIjRTZFN0U4XCI7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNFNkU3RThcIjtcblxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMoeCwgeSwgLjUsIDAsIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBMaW5lIHRvIGdvYWxcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh0aGlzLmRhdGFbJ3gnXSwgdGhpcy5kYXRhWyd5J10pO1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25seV9ib3Rfc2VsZWN0ZWQoKSAmJiB0aGlzLmhhc250X3JlYWNoZWRfZ29hbCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd19nb2FsKHRoaXMuZGF0YVsnZ29hbF94J10sIHRoaXMuZGF0YVsnZ29hbF95J10pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd19ib3QodGhpcy5kYXRhW1wieFwiXSwgdGhpcy5kYXRhW1wieVwiXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFpvb20gZmFjdG9yXG4gICAgICAgICAgICB2YXIgY2FudmFzX3pvb21feCA9IDg7XG4gICAgICAgICAgICB2YXIgY2FudmFzX3pvb21feSA9IDg7XG5cbiAgICAgICAgICAgIC8vIENlbnRlciBvZiBzY3JlZW4gb2Zmc2V0IGluIHBpeGVsc1xuICAgICAgICAgICAgdmFyIGNhbnZhc19vZmZzZXRfeCA9IDA7XG4gICAgICAgICAgICB2YXIgY2FudmFzX29mZnNldF95ID0gMDtcblxuICAgICAgICAgICAgLy8gQWJzb2x1dGUgdmFsdWUgb2YgcmVzcGVjdGl2ZSBvZmZzZXRzIG11c3Qgbm90IGV4Y2VlZFxuICAgICAgICAgICAgdmFyIGNhbnZhc19ib3VuZF94ID0gMDtcbiAgICAgICAgICAgIHZhciBjYW52YXNfYm91bmRfeSA9IDA7XG5cbiAgICAgICAgICAgIC8vIFBhcmVudCBjb250YWluZXIgc2l6ZVxuICAgICAgICAgICAgdmFyIHBhcmVudF93aWR0aCA9IGVsZW1lbnQucGFyZW50KCkud2lkdGgoKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRfaGVpZ2h0ID0gZWxlbWVudC5wYXJlbnQoKS5oZWlnaHQoKTtcblxuXG4gICAgICAgICAgICB2YXIgZHJhd19yb2JvdHMgPSBmdW5jdGlvbiAocm9ib3RzX2RhdGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJvYm90c19kYXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByb2JvdF9kYXRhID0gcm9ib3RzX2RhdGFbal07XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc19ib3VuZF94ID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzX2JvdW5kX3gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMocm9ib3RfZGF0YVsneCddKSAqIGNhbnZhc196b29tX3gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMocm9ib3RfZGF0YVsnZ29hbF94J10pICogY2FudmFzX3pvb21feCk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc19ib3VuZF95ID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzX2JvdW5kX3ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMocm9ib3RfZGF0YVsneCddKSAqIGNhbnZhc196b29tX3ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMocm9ib3RfZGF0YVsnZ29hbF95J10pICogY2FudmFzX3pvb21feSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3IFJvYm90KHJvYm90X2RhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBkcmF3X2NhbnZhcyA9IGZ1bmN0aW9uIChyb2JvdF9wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvYm90X3Byb21pc2UgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYGRyYXdfY2FudmFzYCBmdW5jdGlvbiByZXF1aXJlcyBhcmd1bWVudCBgcm9ib3RfcHJvbWlzZWBcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudF93aWR0aCA9IGVsZW1lbnQucGFyZW50KCkud2lkdGgoKTtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaGVpZ2h0ID0gZWxlbWVudC5wYXJlbnQoKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgICAgIGN0eC5jYW52YXMud2lkdGggPSBwYXJlbnRfd2lkdGg7XG4gICAgICAgICAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSBwYXJlbnRfaGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgY3R4LnRyYW5zZm9ybShjYW52YXNfem9vbV94LCAwLCAwLCBjYW52YXNfem9vbV95LCBwYXJlbnRfd2lkdGggLyAyICsgY2FudmFzX29mZnNldF94LCBwYXJlbnRfaGVpZ2h0IC8gMiArIGNhbnZhc19vZmZzZXRfeSk7XG4gICAgICAgICAgICAgICAgcm9ib3RfcHJvbWlzZS50aGVuKGRyYXdfcm9ib3RzKVxuICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICB2YXIgY2xpY2tYID0gY2xpY2tZID0gMDtcblxuICAgICAgICAgICAgJCh3aW5kb3cpLm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGNsaWNrWCA9IChlLmNsaWVudFggLSBwYXJlbnRfd2lkdGggLyAyIC0gY2FudmFzX29mZnNldF94KSAvIGNhbnZhc196b29tX3g7XG4gICAgICAgICAgICAgICAgY2xpY2tZID0gKGUuY2xpZW50WSAtIHBhcmVudF9oZWlnaHQgLyAyIC0gY2FudmFzX29mZnNldF95KSAvIGNhbnZhc196b29tX3k7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWxlbWVudC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGUud2hpY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5zZWxlY3RSb2JvdHNCeUxvY2F0aW9uKGNsaWNrWCwgY2xpY2tZLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci51cGRhdGVTZWxlY3RlZFJvYm90KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdvYWxfeFwiOiBjbGlja1gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJnb2FsX3lcIjogY2xpY2tZXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhd19jYW52YXMoY29udHJvbGxlci5nZXRSb2JvdHMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvLyBBcnJvdyBrZXkgbmF2aWdhdGlvbi4gU3BhY2ViYXIgdG8gcmVjZW50ZXJcbiAgICAgICAgICAgICQod2luZG93KS5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZGVsdGFfeCA9IDA7XG4gICAgICAgICAgICAgICAgZGVsdGFfeSA9IDA7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzMjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhc19vZmZzZXRfeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXNfb2Zmc2V0X3kgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzc6XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YV94ID0gMjA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFfeSArPSAyMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YV94IC09IDIwXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFfeSAtPSAyMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FudmFzX29mZnNldF94ICs9IE1hdGguYWJzKGNhbnZhc19vZmZzZXRfeCArIGRlbHRhX3gpIDwgY2FudmFzX2JvdW5kX3ggPyBkZWx0YV94IDogMDtcbiAgICAgICAgICAgICAgICBjYW52YXNfb2Zmc2V0X3kgKz0gTWF0aC5hYnMoY2FudmFzX29mZnNldF95ICsgZGVsdGFfeSkgPCBjYW52YXNfYm91bmRfeSA/IGRlbHRhX3kgOiAwO1xuXG4gICAgICAgICAgICAgICAgZHJhd19jYW52YXMoY29udHJvbGxlci5nZXRSb2JvdHMoKSk7XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZHJhd19jYW52YXMoY29udHJvbGxlci5jYWNoZVJvYm90cygpKTtcbiAgICAgICAgICAgIH0sIDMwMDApO1xuXG4gICAgICAgICAgICAvLyBSZWRyYXcgY2FudmFzIHdoZW4gYSByb2JvdCBpcyBzZWxlY3RlZFxuICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdzZWxlY3RlZFJvYm90JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRyYXdfY2FudmFzKGNvbnRyb2xsZXIuZ2V0Um9ib3RzKCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFJlZHJhdyBjYW52YXMgb24gcGFnZSByZXNpemVcbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRyYXdfY2FudmFzKGNvbnRyb2xsZXIuZ2V0Um9ib3RzKCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIE9uIHBhZ2UgbG9hZFxuICAgICAgICAgICAgZHJhd19jYW52YXMoY29udHJvbGxlci5nZXRSb2JvdHMoKSk7XG5cbiAgICAgICAgfVxuICAgIH07XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRyb290U2NvcGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogXCJFXCIsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6IFwicm9ib3RDb250cm9sbGVyXCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBcInNjcmlwdHMvc2luZ2xlUGFuZWwuaHRtbFwiLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFRhc2soKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyN0YXNrLXNlbGVjdCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLnZhbCh2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBGbHV4KCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjZmx1eC1zbGlkZXInKVxuICAgICAgICAgICAgICAgIHRoaXMuZWwuc2xpZGVyKHtcbiAgICAgICAgICAgICAgICAgICAgbWluOiAtMTAwLFxuICAgICAgICAgICAgICAgICAgICBtYXg6IDEwMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwgPiAxID8gMSA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gdmFsIDwgLTEgPyAtMSA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAxMDBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5zbGlkZXIoJ3ZhbHVlJywgdmFsX25vcm0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBCYXR0ZXJ5KCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjYmF0dGVyeS1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codmFsKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLmNzcygnd2lkdGgnLCB2YWwgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBSaXNrKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjcmlzay1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAxMFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLmNzcygnd2lkdGgnLCB2YWxfbm9ybSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIENlbGwoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNjZWxsLXN0cmVuZ3RoLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9ICh2YWwgKyA3MCkgKiAoMTAgLyAzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5jc3MoJ3dpZHRoJywgKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBXaWZpKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjd2lmaS1zdHJlbmd0aC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gdmFsID4gMCA/IDAgOiB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbCA8IC0xMDAgPyAtMTAwIDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCArIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5jc3MoJ3dpZHRoJywgKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBUZW1wKGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyMnICsgaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9ICh2YWwgLSAyMCkgKiAoNCAvIDUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLmNzcygnd2lkdGgnLCAodmFsX25vcm0gLyAyKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIENwdUxvYWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNjcHUtbG9hZC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAxMDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwuY3NzKCd3aWR0aCcsICh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gR3B1TG9hZCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI2dwdS1sb2FkLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAqIDIwMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5jc3MoJ3dpZHRoJywgKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gUmFtKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjcmFtLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9ICh2YWwgLSAxKSAqICgyNSAvIDIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLmNzcygnd2lkdGgnLCAodmFsX25vcm0gLyAyKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIE1vdG9yVGVtcCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI21vdG9yLXRlbXAtYmFyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbCA+IDEyNSA/IDEyNSA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgLSAyNTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5jc3MoJ3dpZHRoJywgKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgdGFzayA9IG5ldyBUYXNrKCk7XG4gICAgICAgICAgICB2YXIgYmF0dGVyeSA9IG5ldyBCYXR0ZXJ5KCk7XG4gICAgICAgICAgICB2YXIgZmx1eCA9IG5ldyBGbHV4KCk7XG4gICAgICAgICAgICB2YXIgcmlzayA9IG5ldyBSaXNrKCk7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IG5ldyBDZWxsKCk7XG4gICAgICAgICAgICB2YXIgd2lmaSA9IG5ldyBXaWZpKCk7XG4gICAgICAgICAgICB2YXIgY3B1X2xvYWQgPSBuZXcgQ3B1TG9hZCgpO1xuICAgICAgICAgICAgdmFyIGNwdV90ZW1wID0gbmV3IFRlbXAoJ2NwdS10ZW1wLWJhcicpO1xuICAgICAgICAgICAgdmFyIGdwdV9sb2FkID0gbmV3IEdwdUxvYWQoKTtcbiAgICAgICAgICAgIHZhciBncHVfdGVtcCA9IG5ldyBUZW1wKCdncHUtdGVtcC1iYXInKTtcbiAgICAgICAgICAgIHZhciByYW0gPSBuZXcgUmFtKCk7XG4gICAgICAgICAgICB2YXIgbW90b3JfdGVtcCA9IG5ldyBNb3RvclRlbXAoKTtcblxuICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdzZWxlY3RlZFJvYm90JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUuc2VsZWN0ZWRSb2JvdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcm9ib3QgPSBzY29wZS5zZWxlY3RlZFJvYm90O1xuXG4gICAgICAgICAgICAgICAgdGFzay5zZXQocm9ib3QudGFzayk7XG4gICAgICAgICAgICAgICAgYmF0dGVyeS5zZXQocm9ib3QuYmF0dGVyeSk7XG4gICAgICAgICAgICAgICAgZmx1eC5zZXQocm9ib3QuZmx1eF9jYXBhY2l0b3JfY2hhcmdlKTtcbiAgICAgICAgICAgICAgICByaXNrLnNldChyb2JvdC5yaXNrX2xldmVsKTtcbiAgICAgICAgICAgICAgICBjZWxsLnNldChyb2JvdC5jZWxsdWxhcl9zdHJlbmd0aCk7XG4gICAgICAgICAgICAgICAgd2lmaS5zZXQocm9ib3Qud2lmaV9zdHJlbmd0aCk7XG4gICAgICAgICAgICAgICAgY3B1X2xvYWQuc2V0KHJvYm90LmNwdV9sb2FkKTtcbiAgICAgICAgICAgICAgICBjcHVfdGVtcC5zZXQocm9ib3QuY3B1X3RlbXApO1xuICAgICAgICAgICAgICAgIGdwdV9sb2FkLnNldChyb2JvdC5ncHVfbG9hZCk7XG4gICAgICAgICAgICAgICAgZ3B1X3RlbXAuc2V0KHJvYm90LmdwdV90ZW1wKTtcbiAgICAgICAgICAgICAgICByYW0uc2V0KHJvYm90LnJhbSk7XG4gICAgICAgICAgICAgICAgbW90b3JfdGVtcC5zZXQocm9ib3QubW90b3JfdGVtcCk7XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJhbmd1bGFyLm1vZHVsZSgncm9ib3RzLnNlcnZpY2VzJywgW10pO1xuYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5jb250cm9sbGVycycsIFsncm9ib3RzLnNlcnZpY2VzJ10pO1xuYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5kaXJlY3RpdmVzJywgWydyb2JvdHMuY29udHJvbGxlcnMnLCAnc21hcnQtdGFibGUnXSk7XG5cbnZhciBpbnRlcmZhY2UgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzJywgW1xuICAgICduZ1JvdXRlJyxcbiAgICAnc21hcnQtdGFibGUnLFxuICAgICdyb2JvdHMuc2VydmljZXMnLFxuICAgICdyb2JvdHMuY29udHJvbGxlcnMnLFxuICAgICdyb2JvdHMuZGlyZWN0aXZlcycsXG5dKTtcblxucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJylcblxuaW50ZXJmYWNlLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICAgJHJvdXRlUHJvdmlkZXJcbiAgICAud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzY3JpcHRzL3JvYm90cy5odG1sJyxcbiAgICB9KTtcbn1dKTsiLCJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5zZXJ2aWNlcycpO1xuXG5hcHAuc2VydmljZSgncm9ib3RTZXJ2aWNlJywgcmVxdWlyZSgnLi9yb2JvdFNlcnZpY2UuanMnKSk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkcm9vdFNjb3BlLCAkaHR0cCwgJHEpIHtcblxuICAgIHZhciBzZXJ2aWNlID0ge307XG4gICAgdmFyIHJvYm90cywgc2VsZWN0ZWRSb2JvdHM7XG5cbiAgICBzZXJ2aWNlLmdldFNlbGVjdGVkUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZWN0ZWRSb2JvdHMgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRSb2JvdHMucHJvbWlzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmdldFJvYm90cygpXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5zZXRTZWxlY3RlZFJvYm90cyA9IGZ1bmN0aW9uIChzZWxlY3RlZCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIC8vIEZJWE1FOiBPbmx5IGNhbGwgdXBkYXRlIHNlbGVjdGVkIHdoZW4gbmVlZGVkLlxuICAgICAgICBzZXJ2aWNlLmdldFNlbGVjdGVkUm9ib3RzKCkudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICBpZiAodmFsICE9IHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShzZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRSb2JvdHMgPSBkZWZlcnJlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRSb2JvdHMgPSByb2JvdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pWydmaW5hbGx5J10odXBkYXRlU2VsZWN0ZWQpO1xuICAgIH07XG5cbiAgICBzZXJ2aWNlLmNhY2hlUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFJvYm90S2V5cyA9IFtdO1xuICAgICAgICBpZiAoc2VsZWN0ZWRSb2JvdHMpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkUm9ib3RzLnByb21pc2VcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcm9ib3QgPSByZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkUm9ib3RLZXlzLnB1c2gocm9ib3RbJ2tleSddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZFJvYm90c0RlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIHVybDogJy9hcGkvcm9ib3RzJ1xuICAgICAgICB9KVxuICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgdmFyIHJvYm90cyA9IFtdO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkUm9ib3RzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCBpbiBkYXRhWydyb2JvdHMnXSkge1xuICAgICAgICAgICAgICAgIHJvYm90X2RhdGEgPSBkYXRhWydyb2JvdHMnXVtpbmRleF07XG4gICAgICAgICAgICAgICAgcm9ib3RfZGF0YVtcImtleVwiXSA9IGluZGV4O1xuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkUm9ib3RLZXlzLmluZGV4T2YoaW5kZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkUm9ib3RzLnB1c2gocm9ib3RfZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcm9ib3RzLnB1c2gocm9ib3RfZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJvYm90cyk7XG4gICAgICAgICAgICBzZXJ2aWNlLnNldFNlbGVjdGVkUm9ib3RzKHNlbGVjdGVkUm9ib3RzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChcIkVycm9yIGluIHJvYm90Q29udHJvbGxlci5jYWNoZVJvYm90XCIpO1xuICAgICAgICAgICAgc2VsZWN0ZWRSb2JvdHNEZWZlcnJlZC5yZWplY3QoXCJFcnJvciBpbiByb2JvdENvbnRyb2xsZXIuY2FjaGVSb2JvdFwiKVxuICAgICAgICB9KVsnZmluYWxseSddKHVwZGF0ZVNlbGVjdGVkKTtcblxuXG4gICAgICAgIHJldHVybiAocm9ib3RzID0gZGVmZXJyZWQpLnByb21pc2VcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmdldFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHJvYm90cyAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByb2JvdHMucHJvbWlzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNhY2hlUm9ib3RzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS51cGRhdGVSb2JvdEJ5SW5kZXggPSBmdW5jdGlvbiAoa2V5LCB1cGRhdGVfZGF0YSkge1xuICAgICAgICB1cGRhdGVfZGF0YVsncm9ib3RfaWQnXSA9IGtleVxuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSxcbiAgICAgICAgICAgIHVybDogJy9hcGkvcm9ib3RzJyxcbiAgICAgICAgICAgIGRhdGE6IHVwZGF0ZV9kYXRhXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgIHJvYm90cy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzW2ldWydrZXknXSAhPSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciB1cGRhdGVfa2V5IGluIHVwZGF0ZV9kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1tpXVt1cGRhdGVfa2V5XSA9IHVwZGF0ZV9kYXRhW3VwZGF0ZV9rZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJvYm90cyA9IGRlZmVycmVkO1xuICAgIH07XG5cblxuICAgIHNlcnZpY2Uuc2VsZWN0Um9ib3RzQnlMb2NhdGlvbiA9IGZ1bmN0aW9uICh4X2NvcmQsIHlfY29yZCwgZGlzdGFuY2VfdGhyZXNoaG9sZCkge1xuICAgICAgICBzZXJ2aWNlLmdldFJvYm90cygpLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gW107XG4gICAgICAgICAgICB2YXIgdW5zZWxlY3RlZCA9IHZhbC5maWx0ZXIoZnVuY3Rpb24gKGkpIHtyZXR1cm4gc2VsZWN0ZWQuaW5kZXhPZihpKSA8IDA7fSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVuc2VsZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcm9ib3QgPSB1bnNlbGVjdGVkW2ldO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJvYm90X3ggPSByb2JvdFtcInhcIl07XG4gICAgICAgICAgICAgICAgdmFyIHJvYm90X3kgPSByb2JvdFtcInlcIl07XG5cbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoTWF0aC5wb3coeF9jb3JkIC0gcm9ib3RfeCwgMikgKyBNYXRoLnBvdyh5X2NvcmQgLSByb2JvdF95LCAyKSk7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDw9IGRpc3RhbmNlX3RocmVzaGhvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQucHVzaChyb2JvdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXJ2aWNlLnNldFNlbGVjdGVkUm9ib3RzKHNlbGVjdGVkKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBzZXJ2aWNlLnNlbGVjdEFsbFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VydmljZS5nZXRSb2JvdHMoKS50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHNlcnZpY2Uuc2V0U2VsZWN0ZWRSb2JvdHModmFsKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGVkKCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCd1cGRhdGUtc2VsZWN0ZWQtcm9ib3RzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlcnZpY2U7XG59OyJdfQ==
