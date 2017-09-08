'use strict';

var _client = require('../../../../node_modules/waves-lfo/client');

var lfo = _interopRequireWildcard(_client);

var _basicControllers = require('basic-controllers');

var controllers = _interopRequireWildcard(_basicControllers);

var _dist = require('../../../../dist');

var lfoMotion = _interopRequireWildcard(_dist);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var motionInput = new lfoMotion.source.MotionInput();
var onOff = new lfo.operator.OnOff({ state: 'on' });
var socketSend = new lfo.sink.SocketSend({ port: 5000 });

motionInput.connect(onOff);
onOff.connect(socketSend);

motionInput.init().then(function () {
  return motionInput.start();
}).catch(function (err) {
  return console.log(err.stack);
});

// ---------------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------------

var toggleStream = new controllers.Toggle({
  label: 'On / Off',
  active: true,
  container: '#controls',
  callback: function callback(value) {
    if (value) onOff.setState('on');else onOff.setState('off');
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vYmlsZS5qcyJdLCJuYW1lcyI6WyJsZm8iLCJjb250cm9sbGVycyIsImxmb01vdGlvbiIsIm1vdGlvbklucHV0Iiwic291cmNlIiwiTW90aW9uSW5wdXQiLCJvbk9mZiIsIm9wZXJhdG9yIiwiT25PZmYiLCJzdGF0ZSIsInNvY2tldFNlbmQiLCJzaW5rIiwiU29ja2V0U2VuZCIsInBvcnQiLCJjb25uZWN0IiwiaW5pdCIsInRoZW4iLCJzdGFydCIsImNhdGNoIiwiY29uc29sZSIsImxvZyIsImVyciIsInN0YWNrIiwidG9nZ2xlU3RyZWFtIiwiVG9nZ2xlIiwibGFiZWwiLCJhY3RpdmUiLCJjb250YWluZXIiLCJjYWxsYmFjayIsInZhbHVlIiwic2V0U3RhdGUiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0lBQVlBLEc7O0FBQ1o7O0lBQVlDLFc7O0FBQ1o7O0lBQVlDLFM7Ozs7QUFFWixJQUFNQyxjQUFjLElBQUlELFVBQVVFLE1BQVYsQ0FBaUJDLFdBQXJCLEVBQXBCO0FBQ0EsSUFBTUMsUUFBUSxJQUFJTixJQUFJTyxRQUFKLENBQWFDLEtBQWpCLENBQXVCLEVBQUVDLE9BQU8sSUFBVCxFQUF2QixDQUFkO0FBQ0EsSUFBTUMsYUFBYSxJQUFJVixJQUFJVyxJQUFKLENBQVNDLFVBQWIsQ0FBd0IsRUFBRUMsTUFBTSxJQUFSLEVBQXhCLENBQW5COztBQUVBVixZQUFZVyxPQUFaLENBQW9CUixLQUFwQjtBQUNBQSxNQUFNUSxPQUFOLENBQWNKLFVBQWQ7O0FBRUFQLFlBQ0dZLElBREgsR0FFR0MsSUFGSCxDQUVRO0FBQUEsU0FBTWIsWUFBWWMsS0FBWixFQUFOO0FBQUEsQ0FGUixFQUdHQyxLQUhILENBR1M7QUFBQSxTQUFPQyxRQUFRQyxHQUFSLENBQVlDLElBQUlDLEtBQWhCLENBQVA7QUFBQSxDQUhUOztBQU1BO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQyxlQUFlLElBQUl0QixZQUFZdUIsTUFBaEIsQ0FBdUI7QUFDMUNDLFNBQU8sVUFEbUM7QUFFMUNDLFVBQVEsSUFGa0M7QUFHMUNDLGFBQVcsV0FIK0I7QUFJMUNDLFlBQVUseUJBQVM7QUFDakIsUUFBSUMsS0FBSixFQUNFdkIsTUFBTXdCLFFBQU4sQ0FBZSxJQUFmLEVBREYsS0FHRXhCLE1BQU13QixRQUFOLENBQWUsS0FBZjtBQUNIO0FBVHlDLENBQXZCLENBQXJCIiwiZmlsZSI6Im1vYmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICcuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd2F2ZXMtbGZvL2NsaWVudCc7XG5pbXBvcnQgKiBhcyBjb250cm9sbGVycyBmcm9tICdiYXNpYy1jb250cm9sbGVycydcbmltcG9ydCAqIGFzIGxmb01vdGlvbiBmcm9tICcuLi8uLi8uLi8uLi9kaXN0JztcblxuY29uc3QgbW90aW9uSW5wdXQgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuY29uc3Qgb25PZmYgPSBuZXcgbGZvLm9wZXJhdG9yLk9uT2ZmKHsgc3RhdGU6ICdvbicgfSk7XG5jb25zdCBzb2NrZXRTZW5kID0gbmV3IGxmby5zaW5rLlNvY2tldFNlbmQoeyBwb3J0OiA1MDAwIH0pO1xuXG5tb3Rpb25JbnB1dC5jb25uZWN0KG9uT2ZmKTtcbm9uT2ZmLmNvbm5lY3Qoc29ja2V0U2VuZCk7XG5cbm1vdGlvbklucHV0XG4gIC5pbml0KClcbiAgLnRoZW4oKCkgPT4gbW90aW9uSW5wdXQuc3RhcnQoKSlcbiAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIuc3RhY2spKTtcblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENPTlRST0xTXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgdG9nZ2xlU3RyZWFtID0gbmV3IGNvbnRyb2xsZXJzLlRvZ2dsZSh7XG4gIGxhYmVsOiAnT24gLyBPZmYnLFxuICBhY3RpdmU6IHRydWUsXG4gIGNvbnRhaW5lcjogJyNjb250cm9scycsXG4gIGNhbGxiYWNrOiB2YWx1ZSA9PiB7XG4gICAgaWYgKHZhbHVlKVxuICAgICAgb25PZmYuc2V0U3RhdGUoJ29uJyk7XG4gICAgZWxzZVxuICAgICAgb25PZmYuc2V0U3RhdGUoJ29mZicpO1xuICB9XG59KVxuIl19