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
},{}],3:[function(require,module,exports){
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

            var canvas_offset_x = function () {
                return center["x"] * ctx.canvas.width / deviation / 2;
            }
            var canvas_offset_y = function () {
                return center["y"] * ctx.canvas.height / deviation / 2;
            }

            const deviation_scale_factor = 2;
            var deviation = 0;
            var center = {
                "x": 0,
                "y": 0,
            }

            var robots = {
                circle_rad: 10,
                circles: [],
                empty: function() {
                    this.circles = [];
                },
                draw: function(robot) {
                    x = robot["x"] * (ctx.canvas.width / 2) / deviation / deviation_scale_factor;
                    y = robot["y"] * (ctx.canvas.height / 2) / deviation / deviation_scale_factor;

                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#00C4FF";
                    ctx.fillStyle = "#00C4FF";

                    ctx.beginPath();
                    ctx.arc(x, y, this.circle_rad, 0, 2*Math.PI);
                    ctx.stroke();
                    ctx.fill();

                    circle_center = {
                        "x_cord": robot["x"],
                        "y_cord": robot["y"],
                        "x": x,
                        "y": y,
                    }
                    this.circles.push(circle_center);
                    return circle_center;
                },

            }

            function fit_canvas_to_document() {
                var doc_width = $(window).width();
                var doc_height = $(window).height();

                ctx.canvas.width = doc_width;
                ctx.canvas.height = doc_height;

                ctx.translate(canvas_offset_x(), canvas_offset_y());
            }

            function draw_robot_canvas() {
                controller.getRobots()
                .then(function (res) {

                    // Calculate center of canvas
                    for (var i = 0; i < res.length; i++) {
                        center["x"] = (center["x"] * i + res[i]["x"]) / (i + 1);
                        center["y"] = (center["y"] * i + res[i]["y"]) / (i + 1);
                    }

                    for (var k = 0; k < res.length; k++) {
                        x_deviation = center["x"] - res[k]["x"];
                        y_deviation = center["y"] - res[k]["y"];
                        new_deviation = Math.sqrt(Math.pow(x_deviation, 2) + Math.pow(y_deviation, 2));
                        if (new_deviation > deviation) {
                            deviation = new_deviation;
                        }
                    }

                    fit_canvas_to_document();

                    for (var j = 0; j < res.length; j++) {
                        robots.draw(res[j]);
                    }

                }, function (reason) {
                    alert("Error getting robots")
                });
            };

            element.on('mouseup', function(event) {
                click_x = event.clientX - canvas_offset_x();
                click_y = event.clientY - canvas_offset_y();

                clicked = [];
                for (var i = 0; i < robots.circles.length; i++) {
                    robot_circle = robots.circles[i]

                    x = robot_circle["x"];
                    y = robot_circle["y"];

                    distance = Math.sqrt(Math.pow(click_x - x, 2) + Math.pow(click_y - y, 2));
                    if (distance <= robots.circle_rad) {
                        clicked.push(robot_circle);
                    }
                }
                if (!clicked.length) {
                    controller.selectAllRobots();
                    return;
                }
                for (var k = 0; k < clicked.length; k++) {

                    x_cord = clicked[k]["x_cord"];
                    y_cord = clicked[k]["y_cord"];

                    controller.selectRobotsByLocation(x_cord, y_cord);
                }
            });

            $(window).on('resize', draw_robot_canvas);

            // On page load
            draw_robot_canvas();
        }
    }
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
},{}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvY29udHJvbGxlcnMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9jb250cm9sbGVycy9yb2JvdENvbnRyb2xsZXIuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2NvbnRyb2xQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL2xpc3RQYW5lbC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL2RpcmVjdGl2ZXMvcm9ib3RDYW52YXMuanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9kaXJlY3RpdmVzL3NpbmdsZVBhbmVsLmpzIiwiL1VzZXJzL25pa2xpb2xpb3MvcHJvamVjdHMvY29iYWx0LWNoYWxsZW5nZS9pbnRlcmZhY2UvYXBwL3NjcmlwdHMvaW5kZXguanMiLCIvVXNlcnMvbmlrbGlvbGlvcy9wcm9qZWN0cy9jb2JhbHQtY2hhbGxlbmdlL2ludGVyZmFjZS9hcHAvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyIsIi9Vc2Vycy9uaWtsaW9saW9zL3Byb2plY3RzL2NvYmFsdC1jaGFsbGVuZ2UvaW50ZXJmYWNlL2FwcC9zY3JpcHRzL3NlcnZpY2VzL3JvYm90U2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzLmNvbnRyb2xsZXJzJyk7XG5cbmFwcC5jb250cm9sbGVyKCdyb2JvdENvbnRyb2xsZXInLCByZXF1aXJlKCcuL3JvYm90Q29udHJvbGxlcicpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHEsIHJvYm90U2VydmljZSkge1xuXG4gICAgLy8gUmV0dXJucyBQUk9NSVNFLCBub3QgQXJyYXlcbiAgICB0aGlzLmdldFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgcm9ib3RTZXJ2aWNlLmdldFJvYm90cygpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICRzY29wZS5yb2JvdHMgPSByZXM7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlcyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHRoaXMuc2VsZWN0Um9ib3RzID0gZnVuY3Rpb24ocm9ib3QpIHtcbiAgICAgICAgcmV0dXJuIHJvYm90U2VydmljZS5zZXRTZWxlY3RlZFJvYm90cyhyb2JvdHMpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdFJvYm90c0J5TG9jYXRpb24gPSBmdW5jdGlvbiAoeF9jb3JkLCB5X2NvcmQpIHtcbiAgICAgICAgcmV0dXJuIHJvYm90U2VydmljZS5zZWxlY3RSb2JvdHNCeUxvY2F0aW9uKHhfY29yZCwgeV9jb3JkKTtcbiAgICB9O1xuICAgIHRoaXMuc2VsZWN0QWxsUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcm9ib3RTZXJ2aWNlLnNlbGVjdEFsbFJvYm90cygpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuc2VsZWN0ZWRSb2JvdHMgPSBbXTtcbiAgICAkcm9vdFNjb3BlLiRvbigndXBkYXRlLXNlbGVjdGVkLXJvYm90cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9ib3RTZXJ2aWNlLmdldFNlbGVjdGVkUm9ib3RzKCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICBpZiAocmVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkUm9ib3QgPSByZXNbMF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZFJvYm90cyA9IHJlcztcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVhc29uKTtcbiAgICAgICAgfSlcbiAgICB9KTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyOiBcInJvYm90Q29udHJvbGxlclwiLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvY29udHJvbFBhbmVsLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBzY29wZS5pc1BhbmVsVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUudG9nZ2xlUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuaXNQYW5lbFZpc2libGUgPSAhc2NvcGUuaXNQYW5lbFZpc2libGU7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgIH07XG59OyIsInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncm9ib3RzLmRpcmVjdGl2ZXMnKTtcblxuYXBwLmRpcmVjdGl2ZSgncm9ib3RDYW52YXMnLCByZXF1aXJlKCcuL3JvYm90Q2FudmFzLmpzJykpO1xuYXBwLmRpcmVjdGl2ZSgnY29udHJvbFBhbmVsJywgcmVxdWlyZSgnLi9jb250cm9sUGFuZWwuanMnKSk7XG5hcHAuZGlyZWN0aXZlKCdsaXN0UGFuZWwnLCByZXF1aXJlKCcuL2xpc3RQYW5lbC5qcycpKTtcbmFwcC5kaXJlY3RpdmUoJ3NpbmdsZVBhbmVsJywgcmVxdWlyZSgnLi9zaW5nbGVQYW5lbC5qcycpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdyb2JvdENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvbGlzdFBhbmVsLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBzY29wZS5zZWxlY3RSb2JvdCA9IGZ1bmN0aW9uIChyb2JvdCkge1xuICAgICAgICAgICAgICAgIHJvYm90cyA9IFtyb2JvdF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRyb2xsZXIuc2VsZWN0Um9ib3RzKHJvYm90cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICBjb250cm9sbGVyOiBcInJvYm90Q29udHJvbGxlclwiLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NjcmlwdHMvcm9ib3RDYW52YXMuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcblxuICAgICAgICAgICAgdmFyIGN0eCA9IGVsZW1lbnRbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICB2YXIgY2FudmFzX29mZnNldF94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjZW50ZXJbXCJ4XCJdICogY3R4LmNhbnZhcy53aWR0aCAvIGRldmlhdGlvbiAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY2FudmFzX29mZnNldF95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjZW50ZXJbXCJ5XCJdICogY3R4LmNhbnZhcy5oZWlnaHQgLyBkZXZpYXRpb24gLyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkZXZpYXRpb25fc2NhbGVfZmFjdG9yID0gMjtcbiAgICAgICAgICAgIHZhciBkZXZpYXRpb24gPSAwO1xuICAgICAgICAgICAgdmFyIGNlbnRlciA9IHtcbiAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJvYm90cyA9IHtcbiAgICAgICAgICAgICAgICBjaXJjbGVfcmFkOiAxMCxcbiAgICAgICAgICAgICAgICBjaXJjbGVzOiBbXSxcbiAgICAgICAgICAgICAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2lyY2xlcyA9IFtdO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZHJhdzogZnVuY3Rpb24ocm9ib3QpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9IHJvYm90W1wieFwiXSAqIChjdHguY2FudmFzLndpZHRoIC8gMikgLyBkZXZpYXRpb24gLyBkZXZpYXRpb25fc2NhbGVfZmFjdG9yO1xuICAgICAgICAgICAgICAgICAgICB5ID0gcm9ib3RbXCJ5XCJdICogKGN0eC5jYW52YXMuaGVpZ2h0IC8gMikgLyBkZXZpYXRpb24gLyBkZXZpYXRpb25fc2NhbGVfZmFjdG9yO1xuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBcIiMwMEM0RkZcIjtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiIzAwQzRGRlwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyh4LCB5LCB0aGlzLmNpcmNsZV9yYWQsIDAsIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcblxuICAgICAgICAgICAgICAgICAgICBjaXJjbGVfY2VudGVyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4X2NvcmRcIjogcm9ib3RbXCJ4XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ5X2NvcmRcIjogcm9ib3RbXCJ5XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IHgsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInlcIjogeSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNpcmNsZXMucHVzaChjaXJjbGVfY2VudGVyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNpcmNsZV9jZW50ZXI7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBmaXRfY2FudmFzX3RvX2RvY3VtZW50KCkge1xuICAgICAgICAgICAgICAgIHZhciBkb2Nfd2lkdGggPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICAgICAgICAgICAgICB2YXIgZG9jX2hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgICAgIGN0eC5jYW52YXMud2lkdGggPSBkb2Nfd2lkdGg7XG4gICAgICAgICAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSBkb2NfaGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShjYW52YXNfb2Zmc2V0X3goKSwgY2FudmFzX29mZnNldF95KCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBkcmF3X3JvYm90X2NhbnZhcygpIHtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyLmdldFJvYm90cygpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBjZW50ZXIgb2YgY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJbXCJ4XCJdID0gKGNlbnRlcltcInhcIl0gKiBpICsgcmVzW2ldW1wieFwiXSkgLyAoaSArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyW1wieVwiXSA9IChjZW50ZXJbXCJ5XCJdICogaSArIHJlc1tpXVtcInlcIl0pIC8gKGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgcmVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4X2RldmlhdGlvbiA9IGNlbnRlcltcInhcIl0gLSByZXNba11bXCJ4XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeV9kZXZpYXRpb24gPSBjZW50ZXJbXCJ5XCJdIC0gcmVzW2tdW1wieVwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19kZXZpYXRpb24gPSBNYXRoLnNxcnQoTWF0aC5wb3coeF9kZXZpYXRpb24sIDIpICsgTWF0aC5wb3coeV9kZXZpYXRpb24sIDIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdfZGV2aWF0aW9uID4gZGV2aWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWF0aW9uID0gbmV3X2RldmlhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZpdF9jYW52YXNfdG9fZG9jdW1lbnQoKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9ib3RzLmRyYXcocmVzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcIkVycm9yIGdldHRpbmcgcm9ib3RzXCIpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjbGlja194ID0gZXZlbnQuY2xpZW50WCAtIGNhbnZhc19vZmZzZXRfeCgpO1xuICAgICAgICAgICAgICAgIGNsaWNrX3kgPSBldmVudC5jbGllbnRZIC0gY2FudmFzX29mZnNldF95KCk7XG5cbiAgICAgICAgICAgICAgICBjbGlja2VkID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb2JvdHMuY2lyY2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByb2JvdF9jaXJjbGUgPSByb2JvdHMuY2lyY2xlc1tpXVxuXG4gICAgICAgICAgICAgICAgICAgIHggPSByb2JvdF9jaXJjbGVbXCJ4XCJdO1xuICAgICAgICAgICAgICAgICAgICB5ID0gcm9ib3RfY2lyY2xlW1wieVwiXTtcblxuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IE1hdGguc3FydChNYXRoLnBvdyhjbGlja194IC0geCwgMikgKyBNYXRoLnBvdyhjbGlja195IC0geSwgMikpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgPD0gcm9ib3RzLmNpcmNsZV9yYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrZWQucHVzaChyb2JvdF9jaXJjbGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghY2xpY2tlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5zZWxlY3RBbGxSb2JvdHMoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGNsaWNrZWQubGVuZ3RoOyBrKyspIHtcblxuICAgICAgICAgICAgICAgICAgICB4X2NvcmQgPSBjbGlja2VkW2tdW1wieF9jb3JkXCJdO1xuICAgICAgICAgICAgICAgICAgICB5X2NvcmQgPSBjbGlja2VkW2tdW1wieV9jb3JkXCJdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuc2VsZWN0Um9ib3RzQnlMb2NhdGlvbih4X2NvcmQsIHlfY29yZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgZHJhd19yb2JvdF9jYW52YXMpO1xuXG4gICAgICAgICAgICAvLyBPbiBwYWdlIGxvYWRcbiAgICAgICAgICAgIGRyYXdfcm9ib3RfY2FudmFzKCk7XG4gICAgICAgIH1cbiAgICB9XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCRyb290U2NvcGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogXCJFXCIsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIGNvbnRyb2xsZXI6IFwicm9ib3RDb250cm9sbGVyXCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBcInNjcmlwdHMvc2luZ2xlUGFuZWwuaHRtbFwiLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIFRhc2soKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyN0YXNrLXNlbGVjdCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLnZhbCh2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBGbHV4KCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjZmx1eC1zbGlkZXInKVxuICAgICAgICAgICAgICAgIHRoaXMuZWwuc2xpZGVyKHtcbiAgICAgICAgICAgICAgICAgICAgbWluOiAtMTAwLFxuICAgICAgICAgICAgICAgICAgICBtYXg6IDEwMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwgPiAxID8gMSA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gdmFsIDwgLTEgPyAtMSA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAxMDBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC5zbGlkZXIoJ3ZhbHVlJywgdmFsX25vcm0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBCYXR0ZXJ5KCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjYmF0dGVyeS1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC53aWR0aCh2YWwgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBSaXNrKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjcmlzay1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAxMFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKHZhbF9ub3JtICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gQ2VsbCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI2NlbGwtc3RyZW5ndGgtYmFyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbF9ub3JtID0gKHZhbCArIDcwKSAqICgxMCAvIDMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKCh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gV2lmaSgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI3dpZmktc3RyZW5ndGgtYmFyJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbCA+IDAgPyAwIDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWwgPCAtMTAwID8gLTEwMCA6IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKyAxMDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBUZW1wKGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyMnICsgaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9ICh2YWwgLSAyMCkgKiAoNCAvIDUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKCh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gQ3B1TG9hZCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsID0gJCgnI2NwdS1sb2FkLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAqIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbC53aWR0aCgodmFsX25vcm0gLyAyKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIEdwdUxvYWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9ICQoJyNncHUtbG9hZC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsX25vcm0gPSB2YWwgKiAyMDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWwud2lkdGgoKHZhbF9ub3JtIC8gMikgKyAnJScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gUmFtKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjcmFtLWJhcicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9ICh2YWwgLSAxKSAqICg1MCAvIDMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKCh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gTW90b3JUZW1wKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSAkKCcjbW90b3ItdGVtcC1iYXInKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gdmFsID4gMTI1ID8gMTI1IDogdmFsO1xuICAgICAgICAgICAgICAgICAgICB2YWxfbm9ybSA9IHZhbCAtIDI1O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLndpZHRoKCh2YWxfbm9ybSAvIDIpICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHRhc2sgPSBuZXcgVGFzaygpO1xuICAgICAgICAgICAgdmFyIGJhdHRlcnkgPSBuZXcgQmF0dGVyeSgpO1xuICAgICAgICAgICAgdmFyIGZsdXggPSBuZXcgRmx1eCgpO1xuICAgICAgICAgICAgdmFyIHJpc2sgPSBuZXcgUmlzaygpO1xuICAgICAgICAgICAgdmFyIGNlbGwgPSBuZXcgQ2VsbCgpO1xuICAgICAgICAgICAgdmFyIHdpZmkgPSBuZXcgV2lmaSgpO1xuICAgICAgICAgICAgdmFyIGNwdV9sb2FkID0gbmV3IENwdUxvYWQoKTtcbiAgICAgICAgICAgIHZhciBjcHVfdGVtcCA9IG5ldyBUZW1wKCdjcHUtdGVtcC1iYXInKTtcbiAgICAgICAgICAgIHZhciBncHVfbG9hZCA9IG5ldyBHcHVMb2FkKCk7XG4gICAgICAgICAgICB2YXIgZ3B1X3RlbXAgPSBuZXcgVGVtcCgnZ3B1LXRlbXAtYmFyJyk7XG4gICAgICAgICAgICB2YXIgcmFtID0gbmV3IFJhbSgpO1xuICAgICAgICAgICAgdmFyIG1vdG9yX3RlbXAgPSBuZXcgTW90b3JUZW1wKCk7XG5cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgnc2VsZWN0ZWRSb2JvdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLnNlbGVjdGVkUm9ib3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJvYm90ID0gc2NvcGUuc2VsZWN0ZWRSb2JvdDtcblxuICAgICAgICAgICAgICAgIHRhc2suc2V0KHJvYm90LnRhc2spO1xuICAgICAgICAgICAgICAgIGJhdHRlcnkuc2V0KHJvYm90LmJhdHRlcnkpO1xuICAgICAgICAgICAgICAgIGZsdXguc2V0KHJvYm90LmZsdXhfY2FwYWNpdG9yX2NoYXJnZSk7XG4gICAgICAgICAgICAgICAgcmlzay5zZXQocm9ib3Qucmlza19sZXZlbCk7XG4gICAgICAgICAgICAgICAgY2VsbC5zZXQocm9ib3QuY2VsbHVsYXJfc3RyZW5ndGgpO1xuICAgICAgICAgICAgICAgIHdpZmkuc2V0KHJvYm90LndpZmlfc3RyZW5ndGgpO1xuICAgICAgICAgICAgICAgIGNwdV9sb2FkLnNldChyb2JvdC5jcHVfbG9hZCk7XG4gICAgICAgICAgICAgICAgY3B1X3RlbXAuc2V0KHJvYm90LmNwdV90ZW1wKTtcbiAgICAgICAgICAgICAgICBncHVfbG9hZC5zZXQocm9ib3QuZ3B1X2xvYWQpO1xuICAgICAgICAgICAgICAgIGdwdV90ZW1wLnNldChyb2JvdC5ncHVfdGVtcCk7XG4gICAgICAgICAgICAgICAgcmFtLnNldChyb2JvdC5yYW0pO1xuICAgICAgICAgICAgICAgIG1vdG9yX3RlbXAuc2V0KHJvYm90Lm1vdG9yX3RlbXApO1xuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwiYW5ndWxhci5tb2R1bGUoJ3JvYm90cy5zZXJ2aWNlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdyb2JvdHMuY29udHJvbGxlcnMnLCBbJ3JvYm90cy5zZXJ2aWNlcyddKTtcbmFuZ3VsYXIubW9kdWxlKCdyb2JvdHMuZGlyZWN0aXZlcycsIFsncm9ib3RzLmNvbnRyb2xsZXJzJywgJ3NtYXJ0LXRhYmxlJ10pO1xuXG52YXIgaW50ZXJmYWNlID0gYW5ndWxhci5tb2R1bGUoJ3JvYm90cycsIFtcbiAgICAnbmdSb3V0ZScsXG4gICAgJ3NtYXJ0LXRhYmxlJyxcbiAgICAncm9ib3RzLnNlcnZpY2VzJyxcbiAgICAncm9ib3RzLmNvbnRyb2xsZXJzJyxcbiAgICAncm9ib3RzLmRpcmVjdGl2ZXMnLFxuXSk7XG5cbnJlcXVpcmUoJy4vc2VydmljZXMnKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpXG5cbmludGVyZmFjZS5jb25maWcoWyckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uICgkcm91dGVQcm92aWRlcikge1xuICAgICRyb3V0ZVByb3ZpZGVyXG4gICAgLndoZW4oJy8nLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2NyaXB0cy9yb2JvdHMuaHRtbCcsXG4gICAgfSk7XG59XSk7IiwidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdyb2JvdHMuc2VydmljZXMnKTtcblxuYXBwLnNlcnZpY2UoJ3JvYm90U2VydmljZScsIHJlcXVpcmUoJy4vcm9ib3RTZXJ2aWNlLmpzJykpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHJvb3RTY29wZSwgJGh0dHAsICRxKSB7XG5cbiAgICB2YXIgc2VydmljZSA9IHt9O1xuICAgIHZhciByb2JvdHMsIHNlbGVjdGVkUm9ib3RzO1xuXG4gICAgc2VydmljZS5nZXRSb2JvdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChyb2JvdHMgIT0gdW5kZWZpbmVkKSByZXR1cm4gcm9ib3RzLnByb21pc2U7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgICdtZXRob2QnIDogJ0dFVCcsXG4gICAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hcGkvcm9ib3RzJyxcbiAgICAgICAgfSlcbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4IGluIGRhdGFbJ3JvYm90cyddKSB7XG4gICAgICAgICAgICAgICAgcmV0LnB1c2goZGF0YVsncm9ib3RzJ11baW5kZXhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChcIkVycm9yIGluIHJvYm90Q29udHJvbGxlci5nZXRSb2JvdFwiKVxuICAgICAgICB9KVsnZmluYWxseSddKHVwZGF0ZVNlbGVjdGVkKTtcbiAgICAgICAgcmV0dXJuIChyb2JvdHMgPSBzZWxlY3RlZFJvYm90cyA9IGRlZmVycmVkKS5wcm9taXNlXG4gICAgfTtcblxuICAgIHNlcnZpY2UuZ2V0U2VsZWN0ZWRSb2JvdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxlY3RlZFJvYm90cyAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZFJvYm90cy5wcm9taXNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuZ2V0Um9ib3RzKClcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2VydmljZS5zZXRTZWxlY3RlZFJvYm90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZWN0ZWQgPSAoYXJndW1lbnRzWzBdKSA/IGFyZ3VtZW50c1swXSA6IHJvYm90cztcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgc2VydmljZS5nZXRTZWxlY3RlZFJvYm90cygpLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgaWYgKHZhbCAhPSBzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkUm9ib3RzID0gZGVmZXJyZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pWydmaW5hbGx5J10odXBkYXRlU2VsZWN0ZWQpO1xuICAgIH07XG4gICAgc2VydmljZS5zZWxlY3RSb2JvdHNCeUxvY2F0aW9uID0gZnVuY3Rpb24gKHhfY29yZCwgeV9jb3JkKSB7XG4gICAgICAgIHNlcnZpY2UuZ2V0Um9ib3RzKCkudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICB2YXIgZGlzdGFuY2VfdGhyZXNoaG9sZCA9IChhcmd1bWVudHNbMl0pID8gYXJndW1lbnRzWzJdOiAwO1xuXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciB1bnNlbGVjdGVkID0gdmFsLmZpbHRlcihmdW5jdGlvbiAoaSkge3JldHVybiBzZWxlY3RlZC5pbmRleE9mKGkpIDwgMDt9KTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdW5zZWxlY3RlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByb2JvdCA9IHVuc2VsZWN0ZWRbaV07XG5cbiAgICAgICAgICAgICAgICB2YXIgcm9ib3RfeCA9IHJvYm90W1wieFwiXTtcbiAgICAgICAgICAgICAgICB2YXIgcm9ib3RfeSA9IHJvYm90W1wieVwiXTtcblxuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChNYXRoLnBvdyh4X2NvcmQgLSByb2JvdF94LCAyKSArIE1hdGgucG93KHlfY29yZCAtIHJvYm90X3ksIDIpKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgPD0gZGlzdGFuY2VfdGhyZXNoaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZC5wdXNoKHJvYm90KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlcnZpY2Uuc2V0U2VsZWN0ZWRSb2JvdHMoc2VsZWN0ZWQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNlcnZpY2Uuc2VsZWN0QWxsUm9ib3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXJ2aWNlLmdldFJvYm90cygpLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgc2VydmljZS5zZXRTZWxlY3RlZFJvYm90cyh2YWwpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlU2VsZWN0ZWQoKSB7XG4gICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3VwZGF0ZS1zZWxlY3RlZC1yb2JvdHMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VydmljZTtcbn07Il19
