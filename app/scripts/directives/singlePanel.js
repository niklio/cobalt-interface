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