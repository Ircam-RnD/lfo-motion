'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _core = require('waves-lfo/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// port of orientation.cpp Max object
var abs = Math.abs;
var atan2 = Math.atan2;
var cos = Math.cos;
var sin = Math.sin;
var sqrt = Math.sqrt;
var pow = Math.pow;
var tan = Math.tan;
var max = Math.max;

var toDeg = 180 / Math.PI;
var toRad = Math.PI / 180;

function normalize(v) {
  var mag = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

  if (mag > 0) {
    v[0] /= mag;
    v[1] /= mag;
    v[2] /= mag;
  }

  return v;
}

var parameters = {
  k: {
    type: 'float',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.9
  }
};

/**
 * Filter that integrate gyrosscope and acceleration in order to remove noise
 * from accelerometers data while keeping a good reactivity.
 * The filter ouputs a normalized projection vector.
 * Be aware that the out of the filter invert the x and z in regard of the
 * device motion specification (left-hand axis). This is done for compatibility
 * with the R-ioT sensor.
 *
 * @param {Object} options - Override default options.
 * @param {Number} k - Ratio between the accelerometers and gyroscope.
 *  1 means gyroscope only
 *  0 mean accelerometers only (this is equivalent to a lowpass filter)
 *
 */

var Orientation = function (_BaseLfo) {
  (0, _inherits3.default)(Orientation, _BaseLfo);

  function Orientation(options) {
    (0, _classCallCheck3.default)(this, Orientation);
    return (0, _possibleConstructorReturn3.default)(this, (Orientation.__proto__ || (0, _getPrototypeOf2.default)(Orientation)).call(this, parameters, options));
  }

  /** @private */


  (0, _createClass3.default)(Orientation, [{
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      this.streamParams.frameSize = 3;

      this.init = false;
      this.lastTime = 0;
      this.interval = 0;
      // this.k = 0.9;

      // normalized acceleration vector
      // coordinates are flipped to match R-ioT coords system
      this.accVector = new Float32Array(3);
      // normalize gyro order and direction according to R-ioT
      this.gyroVector = new Float32Array(3); // third component (yaw) will never be used
      // same as before as a projection vector
      this.gyroEstimate = new Float32Array(3);
      // filtered vector
      this.accEstimate = new Float32Array(3);

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var time = frame.time;
      var input = frame.data;
      var output = this.frame.data;
      var accEstimate = this.accEstimate;
      var lastAccEstimate = this.lastAccEstimate;
      var gyroEstimate = this.gyroEstimate;

      var k = this.params.get('k');

      /**
       * Reorder accelerometer and gyro to conform to R-ioT
       * coordinate system and gyro directions
       */
      var accVector = this.accVector;
      var accOffset = 0;
      accVector[0] = -1 * input[0 + accOffset];
      accVector[1] = 1 * input[1 + accOffset];
      accVector[2] = -1 * input[2 + accOffset];

      var gyroVector = this.gyroVector;
      var gyroOffset = 3;
      gyroVector[0] = -1 * input[2 + gyroOffset];
      gyroVector[1] = -1 * input[1 + gyroOffset];
      gyroVector[2] = -1 * input[0 + gyroOffset];

      normalize(accVector);

      if (!this.lastTime) {
        this.lastTime = time;
        // initialize corrected orientation with normalized accelerometer data
        for (var i = 0; i < 3; i++) {
          accEstimate[i] = accVector[i];
        }return;
      } else {
        // define if we use that or use the logical `MotionEvent.interval`
        var dt = time - this.lastTime;

        this.lastTime = time;

        // as accEstimate is a normalized vector maybe this could be variable
        // @todo - no idea what's going on here...
        if (abs(accEstimate[2]) < 0.1) {
          for (var _i = 0; _i < 3; _i++) {
            gyroEstimate[_i] = accEstimate[_i];
          }
        } else {
          // integrate angle from gyro current values and last result
          var rollDelta = gyroVector[0] * dt * toRad;
          var rollAngle = atan2(accEstimate[0], accEstimate[2]) + rollDelta;

          var pitchDelta = gyroVector[1] * dt * toRad;
          var pitchAngle = atan2(accEstimate[1], accEstimate[2]) + pitchDelta;

          // // calculate projection vector from angleEstimates
          gyroEstimate[0] = sin(rollAngle);
          gyroEstimate[0] /= sqrt(1 + pow(cos(rollAngle), 2) * pow(tan(pitchAngle), 2));

          gyroEstimate[1] = sin(pitchAngle);
          gyroEstimate[1] /= sqrt(1 + pow(cos(pitchAngle), 2) * pow(tan(rollAngle), 2));

          // estimate sign of RzGyro by looking in what qudrant the angle Axz is,
          // RzGyro is positive if  Axz in range -90 ..90 => cos(Awz) >= 0
          var signYaw = cos(rollAngle) >= 0 ? 1 : -1;

          // estimate yaw since vector is normalized
          var gyroEstimateSquared = pow(gyroEstimate[0], 2) + pow(gyroEstimate[1], 2);
          gyroEstimate[2] = signYaw * sqrt(max(0, 1 - gyroEstimateSquared));
        }

        // interpolate between estimated values and raw values
        for (var _i2 = 0; _i2 < 3; _i2++) {
          accEstimate[_i2] = gyroEstimate[_i2] * k + accVector[_i2] * (1 - k);
        }normalize(accEstimate);
      }

      output[0] = accEstimate[0];
      output[1] = accEstimate[1];
      output[2] = accEstimate[2];
    }
  }]);
  return Orientation;
}(_core.BaseLfo);

exports.default = Orientation;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsIm1heCIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJsYXN0QWNjRXN0aW1hdGUiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3IiwiZ3lyb0VzdGltYXRlU3F1YXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUVBO0FBQ0EsSUFBTUEsTUFBTUMsS0FBS0QsR0FBakI7QUFDQSxJQUFNRSxRQUFRRCxLQUFLQyxLQUFuQjtBQUNBLElBQU1DLE1BQU1GLEtBQUtFLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTUgsS0FBS0csR0FBakI7QUFDQSxJQUFNQyxPQUFPSixLQUFLSSxJQUFsQjtBQUNBLElBQU1DLE1BQU1MLEtBQUtLLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTU4sS0FBS00sR0FBakI7QUFDQSxJQUFNQyxNQUFNUCxLQUFLTyxHQUFqQjs7QUFFQSxJQUFNQyxRQUFR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N0IsSUFBSStDLFVBQUosQ0FBbEI7QUFDQWxCLHVCQUFhLENBQWIsS0FBbUI1QixLQUFLLElBQUlDLElBQUlILElBQUlnRCxVQUFKLENBQUosRUFBcUIsQ0FBckIsSUFBMEI3QyxJQUFJQyxJQUFJMEMsU0FBSixDQUFKLEVBQW9CLENBQXBCLENBQW5DLENBQW5COztBQUVBO0FBQ0E7QUFDQSxjQUFNRyxVQUFVakQsSUFBSThDLFNBQUosS0FBa0IsQ0FBbEIsR0FBc0IsQ0FBdEIsR0FBMEIsQ0FBQyxDQUEzQzs7QUFFQTtBQUNBLGNBQU1JLHNCQUFzQi9DLElBQUkyQixhQUFhLENBQWIsQ0FBSixFQUFxQixDQUFyQixJQUEwQjNCLElBQUkyQixhQUFhLENBQWIsQ0FBSixFQUFxQixDQUFyQixDQUF0RDtBQUNBQSx1QkFBYSxDQUFiLElBQWtCbUIsVUFBVS9DLEtBQUtHLElBQUksQ0FBSixFQUFPLElBQUk2QyxtQkFBWCxDQUFMLENBQTVCO0FBQ0Q7O0FBRUQ7QUFDQSxhQUFLLElBQUlQLE1BQUksQ0FBYixFQUFnQkEsTUFBSSxDQUFwQixFQUF1QkEsS0FBdkI7QUFDRVosc0JBQVlZLEdBQVosSUFBaUJiLGFBQWFhLEdBQWIsSUFBa0I5QixDQUFsQixHQUFzQmMsVUFBVWdCLEdBQVYsS0FBZ0IsSUFBSTlCLENBQXBCLENBQXZDO0FBREYsU0FHQUosVUFBVXNCLFdBQVY7QUFDRDs7QUFFRE0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0FNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDRDs7Ozs7a0JBR1liLFciLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5cbi8vIHBvcnQgb2Ygb3JpZW50YXRpb24uY3BwIE1heCBvYmplY3RcbmNvbnN0IGFicyA9IE1hdGguYWJzO1xuY29uc3QgYXRhbjIgPSBNYXRoLmF0YW4yO1xuY29uc3QgY29zID0gTWF0aC5jb3M7XG5jb25zdCBzaW4gPSBNYXRoLnNpbjtcbmNvbnN0IHNxcnQgPSBNYXRoLnNxcnQ7XG5jb25zdCBwb3cgPSBNYXRoLnBvdztcbmNvbnN0IHRhbiA9IE1hdGgudGFuO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5cbmNvbnN0IHRvRGVnID0gMTgwIC8gTWF0aC5QSTtcbmNvbnN0IHRvUmFkID0gTWF0aC5QSSAvIDE4MDtcblxuZnVuY3Rpb24gbm9ybWFsaXplKHYpIHtcbiAgY29uc3QgbWFnID0gc3FydCh2WzBdICogdlswXSArIHZbMV0gKiB2WzFdICsgdlsyXSAqIHZbMl0pO1xuXG4gIGlmIChtYWcgPiAwKSB7XG4gICAgdlswXSAvPSBtYWc7XG4gICAgdlsxXSAvPSBtYWc7XG4gICAgdlsyXSAvPSBtYWc7XG4gIH1cblxuICByZXR1cm4gdjtcbn1cblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgazoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogMSxcbiAgICBzdGVwOiAwLjAxLFxuICAgIGRlZmF1bHQ6IDAuOSxcbiAgfSxcbn07XG5cbi8qKlxuICogRmlsdGVyIHRoYXQgaW50ZWdyYXRlIGd5cm9zc2NvcGUgYW5kIGFjY2VsZXJhdGlvbiBpbiBvcmRlciB0byByZW1vdmUgbm9pc2VcbiAqIGZyb20gYWNjZWxlcm9tZXRlcnMgZGF0YSB3aGlsZSBrZWVwaW5nIGEgZ29vZCByZWFjdGl2aXR5LlxuICogVGhlIGZpbHRlciBvdXB1dHMgYSBub3JtYWxpemVkIHByb2plY3Rpb24gdmVjdG9yLlxuICogQmUgYXdhcmUgdGhhdCB0aGUgb3V0IG9mIHRoZSBmaWx0ZXIgaW52ZXJ0IHRoZSB4IGFuZCB6IGluIHJlZ2FyZCBvZiB0aGVcbiAqIGRldmljZSBtb3Rpb24gc3BlY2lmaWNhdGlvbiAobGVmdC1oYW5kIGF4aXMpLiBUaGlzIGlzIGRvbmUgZm9yIGNvbXBhdGliaWxpdHlcbiAqIHdpdGggdGhlIFItaW9UIHNlbnNvci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlIGRlZmF1bHQgb3B0aW9ucy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBrIC0gUmF0aW8gYmV0d2VlbiB0aGUgYWNjZWxlcm9tZXRlcnMgYW5kIGd5cm9zY29wZS5cbiAqICAxIG1lYW5zIGd5cm9zY29wZSBvbmx5XG4gKiAgMCBtZWFuIGFjY2VsZXJvbWV0ZXJzIG9ubHkgKHRoaXMgaXMgZXF1aXZhbGVudCB0byBhIGxvd3Bhc3MgZmlsdGVyKVxuICpcbiAqL1xuY2xhc3MgT3JpZW50YXRpb24gZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDM7XG5cbiAgICB0aGlzLmluaXQgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcbiAgICB0aGlzLmludGVydmFsID0gMDtcbiAgICAvLyB0aGlzLmsgPSAwLjk7XG5cbiAgICAvLyBub3JtYWxpemVkIGFjY2VsZXJhdGlvbiB2ZWN0b3JcbiAgICAvLyBjb29yZGluYXRlcyBhcmUgZmxpcHBlZCB0byBtYXRjaCBSLWlvVCBjb29yZHMgc3lzdGVtXG4gICAgdGhpcy5hY2NWZWN0b3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIG5vcm1hbGl6ZSBneXJvIG9yZGVyIGFuZCBkaXJlY3Rpb24gYWNjb3JkaW5nIHRvIFItaW9UXG4gICAgdGhpcy5neXJvVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTsgLy8gdGhpcmQgY29tcG9uZW50ICh5YXcpIHdpbGwgbmV2ZXIgYmUgdXNlZFxuICAgIC8vIHNhbWUgYXMgYmVmb3JlIGFzIGEgcHJvamVjdGlvbiB2ZWN0b3JcbiAgICB0aGlzLmd5cm9Fc3RpbWF0ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgLy8gZmlsdGVyZWQgdmVjdG9yXG4gICAgdGhpcy5hY2NFc3RpbWF0ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG5cblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IHRpbWUgPSBmcmFtZS50aW1lO1xuICAgIGNvbnN0IGlucHV0ID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLmZyYW1lLmRhdGE7XG4gICAgY29uc3QgYWNjRXN0aW1hdGUgPSB0aGlzLmFjY0VzdGltYXRlO1xuICAgIGNvbnN0IGxhc3RBY2NFc3RpbWF0ZSA9IHRoaXMubGFzdEFjY0VzdGltYXRlO1xuICAgIGNvbnN0IGd5cm9Fc3RpbWF0ZSA9IHRoaXMuZ3lyb0VzdGltYXRlO1xuXG4gICAgY29uc3QgayA9IHRoaXMucGFyYW1zLmdldCgnaycpO1xuXG4gICAgLyoqXG4gICAgICogUmVvcmRlciBhY2NlbGVyb21ldGVyIGFuZCBneXJvIHRvIGNvbmZvcm0gdG8gUi1pb1RcbiAgICAgKiBjb29yZGluYXRlIHN5c3RlbSBhbmQgZ3lybyBkaXJlY3Rpb25zXG4gICAgICovXG4gICAgY29uc3QgYWNjVmVjdG9yID0gdGhpcy5hY2NWZWN0b3I7XG4gICAgY29uc3QgYWNjT2Zmc2V0ID0gMDtcbiAgICBhY2NWZWN0b3JbMF0gPSAtMSAqIGlucHV0WzAgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsxXSA9ICAxICogaW5wdXRbMSArIGFjY09mZnNldF07XG4gICAgYWNjVmVjdG9yWzJdID0gLTEgKiBpbnB1dFsyICsgYWNjT2Zmc2V0XTtcblxuICAgIGNvbnN0IGd5cm9WZWN0b3IgPSB0aGlzLmd5cm9WZWN0b3I7XG4gICAgY29uc3QgZ3lyb09mZnNldCA9IDM7XG4gICAgZ3lyb1ZlY3RvclswXSA9IC0xICogaW5wdXRbMiArIGd5cm9PZmZzZXRdO1xuICAgIGd5cm9WZWN0b3JbMV0gPSAtMSAqIGlucHV0WzEgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzJdID0gLTEgKiBpbnB1dFswICsgZ3lyb09mZnNldF07XG5cbiAgICBub3JtYWxpemUoYWNjVmVjdG9yKTtcblxuICAgIGlmICghdGhpcy5sYXN0VGltZSkge1xuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG4gICAgICAvLyBpbml0aWFsaXplIGNvcnJlY3RlZCBvcmllbnRhdGlvbiB3aXRoIG5vcm1hbGl6ZWQgYWNjZWxlcm9tZXRlciBkYXRhXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgYWNjRXN0aW1hdGVbaV0gPSBhY2NWZWN0b3JbaV07XG5cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZGVmaW5lIGlmIHdlIHVzZSB0aGF0IG9yIHVzZSB0aGUgbG9naWNhbCBgTW90aW9uRXZlbnQuaW50ZXJ2YWxgXG4gICAgICBjb25zdCBkdCA9IHRpbWUgLSB0aGlzLmxhc3RUaW1lO1xuXG4gICAgICB0aGlzLmxhc3RUaW1lID0gdGltZTtcblxuICAgICAgLy8gYXMgYWNjRXN0aW1hdGUgaXMgYSBub3JtYWxpemVkIHZlY3RvciBtYXliZSB0aGlzIGNvdWxkIGJlIHZhcmlhYmxlXG4gICAgICAvLyBAdG9kbyAtIG5vIGlkZWEgd2hhdCdzIGdvaW5nIG9uIGhlcmUuLi5cbiAgICAgIGlmIChhYnMoYWNjRXN0aW1hdGVbMl0pIDwgMC4xKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgICAgIGd5cm9Fc3RpbWF0ZVtpXSA9IGFjY0VzdGltYXRlW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaW50ZWdyYXRlIGFuZ2xlIGZyb20gZ3lybyBjdXJyZW50IHZhbHVlcyBhbmQgbGFzdCByZXN1bHRcbiAgICAgICAgY29uc3Qgcm9sbERlbHRhID0gZ3lyb1ZlY3RvclswXSAqIGR0ICogdG9SYWQ7XG4gICAgICAgIGNvbnN0IHJvbGxBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzBdLCBhY2NFc3RpbWF0ZVsyXSkgKyByb2xsRGVsdGE7XG5cbiAgICAgICAgY29uc3QgcGl0Y2hEZWx0YSA9IGd5cm9WZWN0b3JbMV0gKiBkdCAqIHRvUmFkO1xuICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gYXRhbjIoYWNjRXN0aW1hdGVbMV0sIGFjY0VzdGltYXRlWzJdKSArIHBpdGNoRGVsdGE7XG5cbiAgICAgICAgLy8gLy8gY2FsY3VsYXRlIHByb2plY3Rpb24gdmVjdG9yIGZyb20gYW5nbGVFc3RpbWF0ZXNcbiAgICAgICAgZ3lyb0VzdGltYXRlWzBdID0gc2luKHJvbGxBbmdsZSk7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVswXSAvPSBzcXJ0KDEgKyBwb3coY29zKHJvbGxBbmdsZSksIDIpICogcG93KHRhbihwaXRjaEFuZ2xlKSwgMikpO1xuXG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsxXSA9IHNpbihwaXRjaEFuZ2xlKTtcbiAgICAgICAgZ3lyb0VzdGltYXRlWzFdIC89IHNxcnQoMSArIHBvdyhjb3MocGl0Y2hBbmdsZSksIDIpICogcG93KHRhbihyb2xsQW5nbGUpLCAyKSk7XG5cbiAgICAgICAgLy8gZXN0aW1hdGUgc2lnbiBvZiBSekd5cm8gYnkgbG9va2luZyBpbiB3aGF0IHF1ZHJhbnQgdGhlIGFuZ2xlIEF4eiBpcyxcbiAgICAgICAgLy8gUnpHeXJvIGlzIHBvc2l0aXZlIGlmICBBeHogaW4gcmFuZ2UgLTkwIC4uOTAgPT4gY29zKEF3eikgPj0gMFxuICAgICAgICBjb25zdCBzaWduWWF3ID0gY29zKHJvbGxBbmdsZSkgPj0gMCA/IDEgOiAtMTtcblxuICAgICAgICAvLyBlc3RpbWF0ZSB5YXcgc2luY2UgdmVjdG9yIGlzIG5vcm1hbGl6ZWRcbiAgICAgICAgY29uc3QgZ3lyb0VzdGltYXRlU3F1YXJlZCA9IHBvdyhneXJvRXN0aW1hdGVbMF0sIDIpICsgcG93KGd5cm9Fc3RpbWF0ZVsxXSwgMik7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsyXSA9IHNpZ25ZYXcgKiBzcXJ0KG1heCgwLCAxIC0gZ3lyb0VzdGltYXRlU3F1YXJlZCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBpbnRlcnBvbGF0ZSBiZXR3ZWVuIGVzdGltYXRlZCB2YWx1ZXMgYW5kIHJhdyB2YWx1ZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgICBhY2NFc3RpbWF0ZVtpXSA9IGd5cm9Fc3RpbWF0ZVtpXSAqIGsgKyBhY2NWZWN0b3JbaV0gKiAoMSAtIGspO1xuXG4gICAgICBub3JtYWxpemUoYWNjRXN0aW1hdGUpO1xuICAgIH1cblxuICAgIG91dHB1dFswXSA9IGFjY0VzdGltYXRlWzBdO1xuICAgIG91dHB1dFsxXSA9IGFjY0VzdGltYXRlWzFdO1xuICAgIG91dHB1dFsyXSA9IGFjY0VzdGltYXRlWzJdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9yaWVudGF0aW9uO1xuIl19