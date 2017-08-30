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

var toDeg = 180 / Math.PI;
var toRad = Math.PI / 180;

function normalize(v) {
  var mag = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  v[0] /= mag;
  v[1] /= mag;
  v[2] /= mag;

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
 * @param {Object} options - Override default options
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
          gyroEstimate[2] = signYaw * sqrt(1 - pow(gyroEstimate[0], 2) - pow(gyroEstimate[1], 2));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJtYXgiLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUE7QUFDQSxJQUFNQSxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1FLFFBQVFELEtBQUtDLEtBQW5CO0FBQ0EsSUFBTUMsTUFBTUYsS0FBS0UsR0FBakI7QUFDQSxJQUFNQyxNQUFNSCxLQUFLRyxHQUFqQjtBQUNBLElBQU1DLE9BQU9KLEtBQUtJLElBQWxCO0FBQ0EsSUFBTUMsTUFBTUwsS0FBS0ssR0FBakI7QUFDQSxJQUFNQyxNQUFNTixLQUFLTSxHQUFqQjs7QUFFQSxJQUFNQyxRQUFRLE1BQU1QLEtBQUtRLEVBQXpCO0FBQ0EsSUFBTUMsUUFBUVQsS0FBS1EsRUFBTCxHQUFVLEdBQXhCOztBQUVBLFNBQVNF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QUFuQyxDQUFuQjs7QUFFQTtBQUNBO0FBQ0EsY0FBTUcsVUFBVWhELElBQUk2QyxTQUFKLEtBQWtCLENBQWxCLEdBQXNCLENBQXRCLEdBQTBCLENBQUMsQ0FBM0M7QUFDQTtBQUNBZix1QkFBYSxDQUFiLElBQWtCa0IsVUFBVTlDLEtBQUssSUFBSUMsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLENBQUosR0FBOEIzQixJQUFJMkIsYUFBYSxDQUFiLENBQUosRUFBcUIsQ0FBckIsQ0FBbkMsQ0FBNUI7QUFDRDs7QUFFRDtBQUNBLGFBQUssSUFBSVksTUFBSSxDQUFiLEVBQWdCQSxNQUFJLENBQXBCLEVBQXVCQSxLQUF2QjtBQUNFWCxzQkFBWVcsR0FBWixJQUFpQlosYUFBYVksR0FBYixJQUFrQjlCLENBQWxCLEdBQXNCZSxVQUFVZSxHQUFWLEtBQWdCLElBQUk5QixDQUFwQixDQUF2QztBQURGLFNBR0FKLFVBQVV1QixXQUFWO0FBQ0Q7O0FBRURNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDQU0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0Q7Ozs7O2tCQUdZYixXIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG4vLyBwb3J0IG9mIG9yaWVudGF0aW9uLmNwcCBNYXggb2JqZWN0XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IGF0YW4yID0gTWF0aC5hdGFuMjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5jb25zdCB0YW4gPSBNYXRoLnRhbjtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG4gIHZbMF0gLz0gbWFnO1xuICB2WzFdIC89IG1hZztcbiAgdlsyXSAvPSBtYWc7XG5cbiAgcmV0dXJuIHY7XG59XG5cbmNvbnN0IHBhcmFtZXRlcnMgPSB7XG4gIGs6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IDEsXG4gICAgc3RlcDogMC4wMSxcbiAgICBkZWZhdWx0OiAwLjksXG4gIH0sXG59O1xuXG4vKipcbiAqIEZpbHRlciB0aGF0IGludGVncmF0ZSBneXJvc3Njb3BlIGFuZCBhY2NlbGVyYXRpb24gaW4gb3JkZXIgdG8gcmVtb3ZlIG5vaXNlXG4gKiBmcm9tIGFjY2VsZXJvbWV0ZXJzIGRhdGEgd2hpbGUga2VlcGluZyBhIGdvb2QgcmVhY3Rpdml0eS5cbiAqIFRoZSBmaWx0ZXIgb3VwdXRzIGEgbm9ybWFsaXplZCBwcm9qZWN0aW9uIHZlY3Rvci5cbiAqIEJlIGF3YXJlIHRoYXQgdGhlIG91dCBvZiB0aGUgZmlsdGVyIGludmVydCB0aGUgeCBhbmQgeiBpbiByZWdhcmQgb2YgdGhlXG4gKiBkZXZpY2UgbW90aW9uIHNwZWNpZmljYXRpb24gKGxlZnQtaGFuZCBheGlzKS4gVGhpcyBpcyBkb25lIGZvciBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIHRoZSBSLWlvVCBzZW5zb3IuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBrIC0gUmF0aW8gYmV0d2VlbiB0aGUgYWNjZWxlcm9tZXRlcnMgYW5kIGd5cm9zY29wZS5cbiAqICAxIG1lYW5zIGd5cm9zY29wZSBvbmx5XG4gKiAgMCBtZWFuIGFjY2VsZXJvbWV0ZXJzIG9ubHkgKHRoaXMgaXMgZXF1aXZhbGVudCB0byBhIGxvd3Bhc3MgZmlsdGVyKVxuICpcbiAqL1xuY2xhc3MgT3JpZW50YXRpb24gZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDM7XG5cbiAgICB0aGlzLmluaXQgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3RUaW1lID0gMDtcbiAgICB0aGlzLmludGVydmFsID0gMDtcbiAgICAvLyB0aGlzLmsgPSAwLjk7XG5cbiAgICAvLyBub3JtYWxpemVkIGFjY2VsZXJhdGlvbiB2ZWN0b3JcbiAgICAvLyBjb29yZGluYXRlcyBhcmUgZmxpcHBlZCB0byBtYXRjaCBSLWlvVCBjb29yZHMgc3lzdGVtXG4gICAgdGhpcy5hY2NWZWN0b3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIG5vcm1hbGl6ZSBneXJvIG9yZGVyIGFuZCBkaXJlY3Rpb24gYWNjb3JkaW5nIHRvIFItaW9UXG4gICAgdGhpcy5neXJvVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTsgLy8gdGhpcmQgY29tcG9uZW50ICh5YXcpIHdpbGwgbmV2ZXIgYmUgdXNlZFxuICAgIC8vIHNhbWUgYXMgYmVmb3JlIGFzIGEgcHJvamVjdGlvbiB2ZWN0b3JcbiAgICB0aGlzLmd5cm9Fc3RpbWF0ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgLy8gZmlsdGVyZWQgdmVjdG9yXG4gICAgdGhpcy5hY2NFc3RpbWF0ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG5cblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IHRpbWUgPSBmcmFtZS50aW1lO1xuICAgIGNvbnN0IGlucHV0ID0gZnJhbWUuZGF0YTtcbiAgICBjb25zdCBvdXRwdXQgPSB0aGlzLmZyYW1lLmRhdGE7XG4gICAgY29uc3QgYWNjRXN0aW1hdGUgPSB0aGlzLmFjY0VzdGltYXRlO1xuICAgIGNvbnN0IGd5cm9Fc3RpbWF0ZSA9IHRoaXMuZ3lyb0VzdGltYXRlO1xuXG4gICAgY29uc3QgayA9IHRoaXMucGFyYW1zLmdldCgnaycpO1xuXG4gICAgLyoqXG4gICAgICogUmVvcmRlciBhY2NlbGVyb21ldGVyIGFuZCBneXJvIHRvIGNvbmZvcm0gdG8gUi1pb1RcbiAgICAgKiBjb29yZGluYXRlIHN5c3RlbSBhbmQgZ3lybyBkaXJlY3Rpb25zXG4gICAgICovXG4gICAgY29uc3QgYWNjVmVjdG9yID0gdGhpcy5hY2NWZWN0b3I7XG4gICAgY29uc3QgYWNjT2Zmc2V0ID0gMDtcbiAgICBhY2NWZWN0b3JbMF0gPSAtMSAqIGlucHV0WzAgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsxXSA9ICAxICogaW5wdXRbMSArIGFjY09mZnNldF07XG4gICAgYWNjVmVjdG9yWzJdID0gLTEgKiBpbnB1dFsyICsgYWNjT2Zmc2V0XTtcblxuICAgIGNvbnN0IGd5cm9WZWN0b3IgPSB0aGlzLmd5cm9WZWN0b3I7XG4gICAgY29uc3QgZ3lyb09mZnNldCA9IDM7XG4gICAgZ3lyb1ZlY3RvclswXSA9IC0xICogaW5wdXRbMiArIGd5cm9PZmZzZXRdO1xuICAgIGd5cm9WZWN0b3JbMV0gPSAtMSAqIGlucHV0WzEgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzJdID0gLTEgKiBpbnB1dFswICsgZ3lyb09mZnNldF07XG5cbiAgICBub3JtYWxpemUoYWNjVmVjdG9yKTtcblxuICAgIGlmICghdGhpcy5sYXN0VGltZSkge1xuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG4gICAgICAvLyBpbml0aWFsaXplIGNvcnJlY3RlZCBvcmllbnRhdGlvbiB3aXRoIG5vcm1hbGl6ZWQgYWNjZWxlcm9tZXRlciBkYXRhXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgYWNjRXN0aW1hdGVbaV0gPSBhY2NWZWN0b3JbaV07XG5cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZGVmaW5lIGlmIHdlIHVzZSB0aGF0IG9yIHVzZSB0aGUgbG9naWNhbCBgTW90aW9uRXZlbnQuaW50ZXJ2YWxgXG4gICAgICBjb25zdCBkdCA9IHRpbWUgLSB0aGlzLmxhc3RUaW1lO1xuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG5cbiAgICAgIC8vIGFzIGFjY0VzdGltYXRlIGlzIGEgbm9ybWFsaXplZCB2ZWN0b3IgbWF5YmUgdGhpcyBjb3VsZCBiZSB2YXJpYWJsZVxuICAgICAgLy8gQHRvZG8gLSBubyBpZGVhIHdoYXQncyBnb2luZyBvbiBoZXJlLi4uXG4gICAgICBpZiAoYWJzKGFjY0VzdGltYXRlWzJdKSA8IDAuMSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgICBneXJvRXN0aW1hdGVbaV0gPSBhY2NFc3RpbWF0ZVtpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGludGVncmF0ZSBhbmdsZSBmcm9tIGd5cm8gY3VycmVudCB2YWx1ZXMgYW5kIGxhc3QgcmVzdWx0XG4gICAgICAgIGNvbnN0IHJvbGxEZWx0YSA9IGd5cm9WZWN0b3JbMF0gKiBkdCAqIHRvUmFkO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSBhdGFuMihhY2NFc3RpbWF0ZVswXSwgYWNjRXN0aW1hdGVbMl0pICsgcm9sbERlbHRhO1xuXG4gICAgICAgIGNvbnN0IHBpdGNoRGVsdGEgPSBneXJvVmVjdG9yWzFdICogZHQgKiB0b1JhZDtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzFdLCBhY2NFc3RpbWF0ZVsyXSkgKyBwaXRjaERlbHRhO1xuXG4gICAgICAgIC8vIC8vIGNhbGN1bGF0ZSBwcm9qZWN0aW9uIHZlY3RvciBmcm9tIGFuZ2xlRXN0aW1hdGVzXG4gICAgICAgIGd5cm9Fc3RpbWF0ZVswXSA9IHNpbihyb2xsQW5nbGUpO1xuICAgICAgICBneXJvRXN0aW1hdGVbMF0gLz0gc3FydCgxICsgcG93KGNvcyhyb2xsQW5nbGUpLCAyKSAqIHBvdyh0YW4ocGl0Y2hBbmdsZSksIDIpKTtcblxuICAgICAgICBneXJvRXN0aW1hdGVbMV0gPSBzaW4ocGl0Y2hBbmdsZSk7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsxXSAvPSBzcXJ0KDEgKyBwb3coY29zKHBpdGNoQW5nbGUpLCAyKSAqIHBvdyh0YW4ocm9sbEFuZ2xlKSwgMikpO1xuXG4gICAgICAgIC8vIGVzdGltYXRlIHNpZ24gb2YgUnpHeXJvIGJ5IGxvb2tpbmcgaW4gd2hhdCBxdWRyYW50IHRoZSBhbmdsZSBBeHogaXMsXG4gICAgICAgIC8vIFJ6R3lybyBpcyBwb3NpdGl2ZSBpZiAgQXh6IGluIHJhbmdlIC05MCAuLjkwID0+IGNvcyhBd3opID49IDBcbiAgICAgICAgY29uc3Qgc2lnbllhdyA9IGNvcyhyb2xsQW5nbGUpID49IDAgPyAxIDogLTE7XG4gICAgICAgIC8vIGVzdGltYXRlIHlhdyBzaW5jZSB2ZWN0b3IgaXMgbm9ybWFsaXplZFxuICAgICAgICBneXJvRXN0aW1hdGVbMl0gPSBzaWduWWF3ICogc3FydCgxIC0gcG93KGd5cm9Fc3RpbWF0ZVswXSwgMikgLSBwb3coZ3lyb0VzdGltYXRlWzFdLCAyKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGludGVycG9sYXRlIGJldHdlZW4gZXN0aW1hdGVkIHZhbHVlcyBhbmQgcmF3IHZhbHVlc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gZ3lyb0VzdGltYXRlW2ldICogayArIGFjY1ZlY3RvcltpXSAqICgxIC0gayk7XG5cbiAgICAgIG5vcm1hbGl6ZShhY2NFc3RpbWF0ZSk7XG4gICAgfVxuXG4gICAgb3V0cHV0WzBdID0gYWNjRXN0aW1hdGVbMF07XG4gICAgb3V0cHV0WzFdID0gYWNjRXN0aW1hdGVbMV07XG4gICAgb3V0cHV0WzJdID0gYWNjRXN0aW1hdGVbMl07XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT3JpZW50YXRpb247XG4iXX0=