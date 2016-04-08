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