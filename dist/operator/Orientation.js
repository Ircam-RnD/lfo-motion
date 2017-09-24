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

        if (dt <= 0) return;

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
          // gyroEstimate[2] = signYaw * sqrt(1 - pow(gyroEstimate[0], 2) - pow(gyroEstimate[1], 2));
          var gyroEstimateSquared = pow(gyroEstimate[0], 2) + pow(gyroEstimate[1], 2);

          if (gyroEstimateSquared > 1) {
            gyroEstimate[2] = signYaw;
          } else {
            gyroEstimate[2] = siqnYaw * sqrt(1 - gyroEstimateSquared);
          }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJtYXgiLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3IiwiZ3lyb0VzdGltYXRlU3F1YXJlZCIsInNpcW5ZYXciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFFQTtBQUNBLElBQU1BLE1BQU1DLEtBQUtELEdBQWpCO0FBQ0EsSUFBTUUsUUFBUUQsS0FBS0MsS0FBbkI7QUFDQSxJQUFNQyxNQUFNRixLQUFLRSxHQUFqQjtBQUNBLElBQU1DLE1BQU1ILEtBQUtHLEdBQWpCO0FBQ0EsSUFBTUMsT0FBT0osS0FBS0ksSUFBbEI7QUFDQSxJQUFNQyxNQUFNTCxLQUFLSyxHQUFqQjtBQUNBLElBQU1DLE1BQU1OLEtBQUtNLEdBQWpCOztBQUVBLElBQU1DLFFBQVEsTUFBTVAsS0FBS1EsRUFBekI7QUFDQSxJQUFNQyxRQUFRVCxL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QjVCLEtBQUssSUFBSUMsSUFBSUgsSUFBSStDLFVBQUosQ0FBSixFQUFxQixDQUFyQixJQUEwQjVDLElBQUlDLElBQUl5QyxTQUFKLENBQUosRUFBb0IsQ0FBcEIsQ0FBbkMsQ0FBbkI7O0FBRUE7QUFDQTtBQUNBLGNBQU1HLFVBQVVoRCxJQUFJNkMsU0FBSixLQUFrQixDQUFsQixHQUFzQixDQUF0QixHQUEwQixDQUFDLENBQTNDO0FBQ0E7QUFDQTtBQUNBLGNBQU1JLHNCQUFzQjlDLElBQUkyQixhQUFhLENBQWIsQ0FBSixFQUFxQixDQUFyQixJQUEwQjNCLElBQUkyQixhQUFhLENBQWIsQ0FBSixFQUFxQixDQUFyQixDQUF0RDs7QUFFQSxjQUFJbUIsc0JBQXNCLENBQTFCLEVBQTZCO0FBQzNCbkIseUJBQWEsQ0FBYixJQUFrQmtCLE9BQWxCO0FBQ0QsV0FGRCxNQUVPO0FBQ0xsQix5QkFBYSxDQUFiLElBQWtCb0IsVUFBVWhELEtBQUssSUFBSStDLG1CQUFULENBQTVCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBLGFBQUssSUFBSVAsTUFBSSxDQUFiLEVBQWdCQSxNQUFJLENBQXBCLEVBQXVCQSxLQUF2QjtBQUNFWCxzQkFBWVcsR0FBWixJQUFpQlosYUFBYVksR0FBYixJQUFrQjlCLENBQWxCLEdBQXNCZSxVQUFVZSxHQUFWLEtBQWdCLElBQUk5QixDQUFwQixDQUF2QztBQURGLFNBR0FKLFVBQVV1QixXQUFWO0FBQ0Q7O0FBRURNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDQU0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0Q7Ozs7O2tCQUdZYixXIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG4vLyBwb3J0IG9mIG9yaWVudGF0aW9uLmNwcCBNYXggb2JqZWN0XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IGF0YW4yID0gTWF0aC5hdGFuMjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5jb25zdCB0YW4gPSBNYXRoLnRhbjtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG5cbiAgaWYgKG1hZyA+IDApIHtcbiAgICB2WzBdIC89IG1hZztcbiAgICB2WzFdIC89IG1hZztcbiAgICB2WzJdIC89IG1hZztcbiAgfVxuXG4gIHJldHVybiB2O1xufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICAgIHN0ZXA6IDAuMDEsXG4gICAgZGVmYXVsdDogMC45LFxuICB9LFxufTtcblxuLyoqXG4gKiBGaWx0ZXIgdGhhdCBpbnRlZ3JhdGUgZ3lyb3NzY29wZSBhbmQgYWNjZWxlcmF0aW9uIGluIG9yZGVyIHRvIHJlbW92ZSBub2lzZVxuICogZnJvbSBhY2NlbGVyb21ldGVycyBkYXRhIHdoaWxlIGtlZXBpbmcgYSBnb29kIHJlYWN0aXZpdHkuXG4gKiBUaGUgZmlsdGVyIG91cHV0cyBhIG5vcm1hbGl6ZWQgcHJvamVjdGlvbiB2ZWN0b3IuXG4gKiBCZSBhd2FyZSB0aGF0IHRoZSBvdXQgb2YgdGhlIGZpbHRlciBpbnZlcnQgdGhlIHggYW5kIHogaW4gcmVnYXJkIG9mIHRoZVxuICogZGV2aWNlIG1vdGlvbiBzcGVjaWZpY2F0aW9uIChsZWZ0LWhhbmQgYXhpcykuIFRoaXMgaXMgZG9uZSBmb3IgY29tcGF0aWJpbGl0eVxuICogd2l0aCB0aGUgUi1pb1Qgc2Vuc29yLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zXG4gKiBAcGFyYW0ge051bWJlcn0gayAtIFJhdGlvIGJldHdlZW4gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKiAgMSBtZWFucyBneXJvc2NvcGUgb25seVxuICogIDAgbWVhbiBhY2NlbGVyb21ldGVycyBvbmx5ICh0aGlzIGlzIGVxdWl2YWxlbnQgdG8gYSBsb3dwYXNzIGZpbHRlcilcbiAqXG4gKi9cbmNsYXNzIE9yaWVudGF0aW9uIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuXG4gICAgdGhpcy5pbml0ID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gICAgLy8gdGhpcy5rID0gMC45O1xuXG4gICAgLy8gbm9ybWFsaXplZCBhY2NlbGVyYXRpb24gdmVjdG9yXG4gICAgLy8gY29vcmRpbmF0ZXMgYXJlIGZsaXBwZWQgdG8gbWF0Y2ggUi1pb1QgY29vcmRzIHN5c3RlbVxuICAgIHRoaXMuYWNjVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBub3JtYWxpemUgZ3lybyBvcmRlciBhbmQgZGlyZWN0aW9uIGFjY29yZGluZyB0byBSLWlvVFxuICAgIHRoaXMuZ3lyb1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7IC8vIHRoaXJkIGNvbXBvbmVudCAoeWF3KSB3aWxsIG5ldmVyIGJlIHVzZWRcbiAgICAvLyBzYW1lIGFzIGJlZm9yZSBhcyBhIHByb2plY3Rpb24gdmVjdG9yXG4gICAgdGhpcy5neXJvRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIGZpbHRlcmVkIHZlY3RvclxuICAgIHRoaXMuYWNjRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB0aW1lID0gZnJhbWUudGltZTtcbiAgICBjb25zdCBpbnB1dCA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0VzdGltYXRlID0gdGhpcy5hY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBneXJvRXN0aW1hdGUgPSB0aGlzLmd5cm9Fc3RpbWF0ZTtcblxuICAgIGNvbnN0IGsgPSB0aGlzLnBhcmFtcy5nZXQoJ2snKTtcblxuICAgIC8qKlxuICAgICAqIFJlb3JkZXIgYWNjZWxlcm9tZXRlciBhbmQgZ3lybyB0byBjb25mb3JtIHRvIFItaW9UXG4gICAgICogY29vcmRpbmF0ZSBzeXN0ZW0gYW5kIGd5cm8gZGlyZWN0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0IGFjY1ZlY3RvciA9IHRoaXMuYWNjVmVjdG9yO1xuICAgIGNvbnN0IGFjY09mZnNldCA9IDA7XG4gICAgYWNjVmVjdG9yWzBdID0gLTEgKiBpbnB1dFswICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMV0gPSAgMSAqIGlucHV0WzEgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMiArIGFjY09mZnNldF07XG5cbiAgICBjb25zdCBneXJvVmVjdG9yID0gdGhpcy5neXJvVmVjdG9yO1xuICAgIGNvbnN0IGd5cm9PZmZzZXQgPSAzO1xuICAgIGd5cm9WZWN0b3JbMF0gPSAtMSAqIGlucHV0WzIgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzFdID0gLTEgKiBpbnB1dFsxICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMCArIGd5cm9PZmZzZXRdO1xuXG4gICAgbm9ybWFsaXplKGFjY1ZlY3Rvcik7XG5cbiAgICBpZiAoIXRoaXMubGFzdFRpbWUpIHtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuICAgICAgLy8gaW5pdGlhbGl6ZSBjb3JyZWN0ZWQgb3JpZW50YXRpb24gd2l0aCBub3JtYWxpemVkIGFjY2VsZXJvbWV0ZXIgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gYWNjVmVjdG9yW2ldO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlZmluZSBpZiB3ZSB1c2UgdGhhdCBvciB1c2UgdGhlIGxvZ2ljYWwgYE1vdGlvbkV2ZW50LmludGVydmFsYFxuICAgICAgY29uc3QgZHQgPSB0aW1lIC0gdGhpcy5sYXN0VGltZTtcblxuICAgICAgaWYgKGR0IDw9IDApIHJldHVybjtcblxuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG5cbiAgICAgIC8vIGFzIGFjY0VzdGltYXRlIGlzIGEgbm9ybWFsaXplZCB2ZWN0b3IgbWF5YmUgdGhpcyBjb3VsZCBiZSB2YXJpYWJsZVxuICAgICAgLy8gQHRvZG8gLSBubyBpZGVhIHdoYXQncyBnb2luZyBvbiBoZXJlLi4uXG4gICAgICBpZiAoYWJzKGFjY0VzdGltYXRlWzJdKSA8IDAuMSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgICBneXJvRXN0aW1hdGVbaV0gPSBhY2NFc3RpbWF0ZVtpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGludGVncmF0ZSBhbmdsZSBmcm9tIGd5cm8gY3VycmVudCB2YWx1ZXMgYW5kIGxhc3QgcmVzdWx0XG4gICAgICAgIGNvbnN0IHJvbGxEZWx0YSA9IGd5cm9WZWN0b3JbMF0gKiBkdCAqIHRvUmFkO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSBhdGFuMihhY2NFc3RpbWF0ZVswXSwgYWNjRXN0aW1hdGVbMl0pICsgcm9sbERlbHRhO1xuXG4gICAgICAgIGNvbnN0IHBpdGNoRGVsdGEgPSBneXJvVmVjdG9yWzFdICogZHQgKiB0b1JhZDtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzFdLCBhY2NFc3RpbWF0ZVsyXSkgKyBwaXRjaERlbHRhO1xuXG4gICAgICAgIC8vIC8vIGNhbGN1bGF0ZSBwcm9qZWN0aW9uIHZlY3RvciBmcm9tIGFuZ2xlRXN0aW1hdGVzXG4gICAgICAgIGd5cm9Fc3RpbWF0ZVswXSA9IHNpbihyb2xsQW5nbGUpO1xuICAgICAgICBneXJvRXN0aW1hdGVbMF0gLz0gc3FydCgxICsgcG93KGNvcyhyb2xsQW5nbGUpLCAyKSAqIHBvdyh0YW4ocGl0Y2hBbmdsZSksIDIpKTtcblxuICAgICAgICBneXJvRXN0aW1hdGVbMV0gPSBzaW4ocGl0Y2hBbmdsZSk7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsxXSAvPSBzcXJ0KDEgKyBwb3coY29zKHBpdGNoQW5nbGUpLCAyKSAqIHBvdyh0YW4ocm9sbEFuZ2xlKSwgMikpO1xuXG4gICAgICAgIC8vIGVzdGltYXRlIHNpZ24gb2YgUnpHeXJvIGJ5IGxvb2tpbmcgaW4gd2hhdCBxdWRyYW50IHRoZSBhbmdsZSBBeHogaXMsXG4gICAgICAgIC8vIFJ6R3lybyBpcyBwb3NpdGl2ZSBpZiAgQXh6IGluIHJhbmdlIC05MCAuLjkwID0+IGNvcyhBd3opID49IDBcbiAgICAgICAgY29uc3Qgc2lnbllhdyA9IGNvcyhyb2xsQW5nbGUpID49IDAgPyAxIDogLTE7XG4gICAgICAgIC8vIGVzdGltYXRlIHlhdyBzaW5jZSB2ZWN0b3IgaXMgbm9ybWFsaXplZFxuICAgICAgICAvLyBneXJvRXN0aW1hdGVbMl0gPSBzaWduWWF3ICogc3FydCgxIC0gcG93KGd5cm9Fc3RpbWF0ZVswXSwgMikgLSBwb3coZ3lyb0VzdGltYXRlWzFdLCAyKSk7XG4gICAgICAgIGNvbnN0IGd5cm9Fc3RpbWF0ZVNxdWFyZWQgPSBwb3coZ3lyb0VzdGltYXRlWzBdLCAyKSArIHBvdyhneXJvRXN0aW1hdGVbMV0sIDIpO1xuXG4gICAgICAgIGlmIChneXJvRXN0aW1hdGVTcXVhcmVkID4gMSkge1xuICAgICAgICAgIGd5cm9Fc3RpbWF0ZVsyXSA9IHNpZ25ZYXc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ3lyb0VzdGltYXRlWzJdID0gc2lxbllhdyAqIHNxcnQoMSAtIGd5cm9Fc3RpbWF0ZVNxdWFyZWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGludGVycG9sYXRlIGJldHdlZW4gZXN0aW1hdGVkIHZhbHVlcyBhbmQgcmF3IHZhbHVlc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gZ3lyb0VzdGltYXRlW2ldICogayArIGFjY1ZlY3RvcltpXSAqICgxIC0gayk7XG5cbiAgICAgIG5vcm1hbGl6ZShhY2NFc3RpbWF0ZSk7XG4gICAgfVxuXG4gICAgb3V0cHV0WzBdID0gYWNjRXN0aW1hdGVbMF07XG4gICAgb3V0cHV0WzFdID0gYWNjRXN0aW1hdGVbMV07XG4gICAgb3V0cHV0WzJdID0gYWNjRXN0aW1hdGVbMl07XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT3JpZW50YXRpb247XG4iXX0=