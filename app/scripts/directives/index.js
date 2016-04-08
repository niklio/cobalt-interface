var app = angular.module('robots.directives');

app.directive('robotCanvas', require('./robotCanvas.js'));
app.directive('controlPanel', require('./controlPanel.js'));
app.directive('listPanel', require('./listPanel.js'));
app.directive('singlePanel', require('./singlePanel.js'));