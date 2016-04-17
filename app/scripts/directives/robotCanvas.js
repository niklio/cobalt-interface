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