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

        if (dt < 0) return;

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
            gyroEstimate[2] = signYaw * sqrt(1 - gyroEstimateSquared);
          }
        }

        // interpolate between estimated values and raw values
        for (var _i2 = 0; _i2 < 3; _i2++) {
          accEstimate[_i2] = gyroEstimate[_i2] * k + accVector[_i2] * (1 - k);
        }normalize(accEstimate);
      }

      // for (let i = 0; i< 3; i++) {
      //   if (Number.isFinite(accEstimate[i])) {
      //     output[i] = accEstimate[i];
      //   } else {
      //     output[i] = lastAccEstimate[i];
      //     lastAccEstimate[i] = accEstimate[i];
      //   }
      // }

      output[0] = accEstimate[0];
      output[1] = accEstimate[1];
      output[2] = accEstimate[2];
    }
  }]);
  return Orientation;
}(_core.BaseLfo);

exports.default = Orientation;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJtYXgiLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJsYXN0QWNjRXN0aW1hdGUiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3IiwiZ3lyb0VzdGltYXRlU3F1YXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUVBO0FBQ0EsSUFBTUEsTUFBTUMsS0FBS0QsR0FBakI7QUFDQSxJQUFNRSxRQUFRRCxLQUFLQyxLQUFuQjtBQUNBLElBQU1DLE1BQU1GLEtBQUtFLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTUgsS0FBS0csR0FBakI7QUFDQSxJQUFNQyxPQUFPSixLQUFLSSxJQUFsQjtBQUNBLElBQU1DLE1BQU1MLEtBQUtLLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTU4sS0FBS00sR0FBakI7O0FBRUEsSUFBTUMsUUFBUSxNQUFNUCxLQUFLUSxFQUF6QjtBQUNBLElBQU1D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YXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG4vLyBwb3J0IG9mIG9yaWVudGF0aW9uLmNwcCBNYXggb2JqZWN0XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IGF0YW4yID0gTWF0aC5hdGFuMjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5jb25zdCB0YW4gPSBNYXRoLnRhbjtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG5cbiAgaWYgKG1hZyA+IDApIHtcbiAgICB2WzBdIC89IG1hZztcbiAgICB2WzFdIC89IG1hZztcbiAgICB2WzJdIC89IG1hZztcbiAgfVxuXG4gIHJldHVybiB2O1xufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICAgIHN0ZXA6IDAuMDEsXG4gICAgZGVmYXVsdDogMC45LFxuICB9LFxufTtcblxuLyoqXG4gKiBGaWx0ZXIgdGhhdCBpbnRlZ3JhdGUgZ3lyb3NzY29wZSBhbmQgYWNjZWxlcmF0aW9uIGluIG9yZGVyIHRvIHJlbW92ZSBub2lzZVxuICogZnJvbSBhY2NlbGVyb21ldGVycyBkYXRhIHdoaWxlIGtlZXBpbmcgYSBnb29kIHJlYWN0aXZpdHkuXG4gKiBUaGUgZmlsdGVyIG91cHV0cyBhIG5vcm1hbGl6ZWQgcHJvamVjdGlvbiB2ZWN0b3IuXG4gKiBCZSBhd2FyZSB0aGF0IHRoZSBvdXQgb2YgdGhlIGZpbHRlciBpbnZlcnQgdGhlIHggYW5kIHogaW4gcmVnYXJkIG9mIHRoZVxuICogZGV2aWNlIG1vdGlvbiBzcGVjaWZpY2F0aW9uIChsZWZ0LWhhbmQgYXhpcykuIFRoaXMgaXMgZG9uZSBmb3IgY29tcGF0aWJpbGl0eVxuICogd2l0aCB0aGUgUi1pb1Qgc2Vuc29yLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zXG4gKiBAcGFyYW0ge051bWJlcn0gayAtIFJhdGlvIGJldHdlZW4gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKiAgMSBtZWFucyBneXJvc2NvcGUgb25seVxuICogIDAgbWVhbiBhY2NlbGVyb21ldGVycyBvbmx5ICh0aGlzIGlzIGVxdWl2YWxlbnQgdG8gYSBsb3dwYXNzIGZpbHRlcilcbiAqXG4gKi9cbmNsYXNzIE9yaWVudGF0aW9uIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuXG4gICAgdGhpcy5pbml0ID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gICAgLy8gdGhpcy5rID0gMC45O1xuXG4gICAgLy8gbm9ybWFsaXplZCBhY2NlbGVyYXRpb24gdmVjdG9yXG4gICAgLy8gY29vcmRpbmF0ZXMgYXJlIGZsaXBwZWQgdG8gbWF0Y2ggUi1pb1QgY29vcmRzIHN5c3RlbVxuICAgIHRoaXMuYWNjVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBub3JtYWxpemUgZ3lybyBvcmRlciBhbmQgZGlyZWN0aW9uIGFjY29yZGluZyB0byBSLWlvVFxuICAgIHRoaXMuZ3lyb1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7IC8vIHRoaXJkIGNvbXBvbmVudCAoeWF3KSB3aWxsIG5ldmVyIGJlIHVzZWRcbiAgICAvLyBzYW1lIGFzIGJlZm9yZSBhcyBhIHByb2plY3Rpb24gdmVjdG9yXG4gICAgdGhpcy5neXJvRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIGZpbHRlcmVkIHZlY3RvclxuICAgIHRoaXMuYWNjRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB0aW1lID0gZnJhbWUudGltZTtcbiAgICBjb25zdCBpbnB1dCA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0VzdGltYXRlID0gdGhpcy5hY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBsYXN0QWNjRXN0aW1hdGUgPSB0aGlzLmxhc3RBY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBneXJvRXN0aW1hdGUgPSB0aGlzLmd5cm9Fc3RpbWF0ZTtcblxuICAgIGNvbnN0IGsgPSB0aGlzLnBhcmFtcy5nZXQoJ2snKTtcblxuICAgIC8qKlxuICAgICAqIFJlb3JkZXIgYWNjZWxlcm9tZXRlciBhbmQgZ3lybyB0byBjb25mb3JtIHRvIFItaW9UXG4gICAgICogY29vcmRpbmF0ZSBzeXN0ZW0gYW5kIGd5cm8gZGlyZWN0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0IGFjY1ZlY3RvciA9IHRoaXMuYWNjVmVjdG9yO1xuICAgIGNvbnN0IGFjY09mZnNldCA9IDA7XG4gICAgYWNjVmVjdG9yWzBdID0gLTEgKiBpbnB1dFswICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMV0gPSAgMSAqIGlucHV0WzEgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMiArIGFjY09mZnNldF07XG5cbiAgICBjb25zdCBneXJvVmVjdG9yID0gdGhpcy5neXJvVmVjdG9yO1xuICAgIGNvbnN0IGd5cm9PZmZzZXQgPSAzO1xuICAgIGd5cm9WZWN0b3JbMF0gPSAtMSAqIGlucHV0WzIgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzFdID0gLTEgKiBpbnB1dFsxICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMCArIGd5cm9PZmZzZXRdO1xuXG4gICAgbm9ybWFsaXplKGFjY1ZlY3Rvcik7XG5cbiAgICBpZiAoIXRoaXMubGFzdFRpbWUpIHtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuICAgICAgLy8gaW5pdGlhbGl6ZSBjb3JyZWN0ZWQgb3JpZW50YXRpb24gd2l0aCBub3JtYWxpemVkIGFjY2VsZXJvbWV0ZXIgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gYWNjVmVjdG9yW2ldO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlZmluZSBpZiB3ZSB1c2UgdGhhdCBvciB1c2UgdGhlIGxvZ2ljYWwgYE1vdGlvbkV2ZW50LmludGVydmFsYFxuICAgICAgY29uc3QgZHQgPSB0aW1lIC0gdGhpcy5sYXN0VGltZTtcblxuICAgICAgaWYgKGR0IDwgMCkgcmV0dXJuO1xuXG4gICAgICB0aGlzLmxhc3RUaW1lID0gdGltZTtcblxuICAgICAgLy8gYXMgYWNjRXN0aW1hdGUgaXMgYSBub3JtYWxpemVkIHZlY3RvciBtYXliZSB0aGlzIGNvdWxkIGJlIHZhcmlhYmxlXG4gICAgICAvLyBAdG9kbyAtIG5vIGlkZWEgd2hhdCdzIGdvaW5nIG9uIGhlcmUuLi5cbiAgICAgIGlmIChhYnMoYWNjRXN0aW1hdGVbMl0pIDwgMC4xKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgICAgIGd5cm9Fc3RpbWF0ZVtpXSA9IGFjY0VzdGltYXRlW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaW50ZWdyYXRlIGFuZ2xlIGZyb20gZ3lybyBjdXJyZW50IHZhbHVlcyBhbmQgbGFzdCByZXN1bHRcbiAgICAgICAgY29uc3Qgcm9sbERlbHRhID0gZ3lyb1ZlY3RvclswXSAqIGR0ICogdG9SYWQ7XG4gICAgICAgIGNvbnN0IHJvbGxBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzBdLCBhY2NFc3RpbWF0ZVsyXSkgKyByb2xsRGVsdGE7XG5cbiAgICAgICAgY29uc3QgcGl0Y2hEZWx0YSA9IGd5cm9WZWN0b3JbMV0gKiBkdCAqIHRvUmFkO1xuICAgICAgICBjb25zdCBwaXRjaEFuZ2xlID0gYXRhbjIoYWNjRXN0aW1hdGVbMV0sIGFjY0VzdGltYXRlWzJdKSArIHBpdGNoRGVsdGE7XG5cbiAgICAgICAgLy8gLy8gY2FsY3VsYXRlIHByb2plY3Rpb24gdmVjdG9yIGZyb20gYW5nbGVFc3RpbWF0ZXNcbiAgICAgICAgZ3lyb0VzdGltYXRlWzBdID0gc2luKHJvbGxBbmdsZSk7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVswXSAvPSBzcXJ0KDEgKyBwb3coY29zKHJvbGxBbmdsZSksIDIpICogcG93KHRhbihwaXRjaEFuZ2xlKSwgMikpO1xuXG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsxXSA9IHNpbihwaXRjaEFuZ2xlKTtcbiAgICAgICAgZ3lyb0VzdGltYXRlWzFdIC89IHNxcnQoMSArIHBvdyhjb3MocGl0Y2hBbmdsZSksIDIpICogcG93KHRhbihyb2xsQW5nbGUpLCAyKSk7XG5cbiAgICAgICAgLy8gZXN0aW1hdGUgc2lnbiBvZiBSekd5cm8gYnkgbG9va2luZyBpbiB3aGF0IHF1ZHJhbnQgdGhlIGFuZ2xlIEF4eiBpcyxcbiAgICAgICAgLy8gUnpHeXJvIGlzIHBvc2l0aXZlIGlmICBBeHogaW4gcmFuZ2UgLTkwIC4uOTAgPT4gY29zKEF3eikgPj0gMFxuICAgICAgICBjb25zdCBzaWduWWF3ID0gY29zKHJvbGxBbmdsZSkgPj0gMCA/IDEgOiAtMTtcblxuICAgICAgICAvLyBlc3RpbWF0ZSB5YXcgc2luY2UgdmVjdG9yIGlzIG5vcm1hbGl6ZWRcbiAgICAgICAgLy8gZ3lyb0VzdGltYXRlWzJdID0gc2lnbllhdyAqIHNxcnQoMSAtIHBvdyhneXJvRXN0aW1hdGVbMF0sIDIpIC0gcG93KGd5cm9Fc3RpbWF0ZVsxXSwgMikpO1xuXG4gICAgICAgIGNvbnN0IGd5cm9Fc3RpbWF0ZVNxdWFyZWQgPSBwb3coZ3lyb0VzdGltYXRlWzBdLCAyKSArIHBvdyhneXJvRXN0aW1hdGVbMV0sIDIpO1xuXG4gICAgICAgIGlmIChneXJvRXN0aW1hdGVTcXVhcmVkID4gMSkge1xuICAgICAgICAgIGd5cm9Fc3RpbWF0ZVsyXSA9IHNpZ25ZYXc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ3lyb0VzdGltYXRlWzJdID0gc2lnbllhdyAqIHNxcnQoMSAtIGd5cm9Fc3RpbWF0ZVNxdWFyZWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGludGVycG9sYXRlIGJldHdlZW4gZXN0aW1hdGVkIHZhbHVlcyBhbmQgcmF3IHZhbHVlc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gZ3lyb0VzdGltYXRlW2ldICogayArIGFjY1ZlY3RvcltpXSAqICgxIC0gayk7XG5cbiAgICAgIG5vcm1hbGl6ZShhY2NFc3RpbWF0ZSk7XG4gICAgfVxuXG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGk8IDM7IGkrKykge1xuICAgIC8vICAgaWYgKE51bWJlci5pc0Zpbml0ZShhY2NFc3RpbWF0ZVtpXSkpIHtcbiAgICAvLyAgICAgb3V0cHV0W2ldID0gYWNjRXN0aW1hdGVbaV07XG4gICAgLy8gICB9IGVsc2Uge1xuICAgIC8vICAgICBvdXRwdXRbaV0gPSBsYXN0QWNjRXN0aW1hdGVbaV07XG4gICAgLy8gICAgIGxhc3RBY2NFc3RpbWF0ZVtpXSA9IGFjY0VzdGltYXRlW2ldO1xuICAgIC8vICAgfVxuICAgIC8vIH1cblxuICAgIG91dHB1dFswXSA9IGFjY0VzdGltYXRlWzBdO1xuICAgIG91dHB1dFsxXSA9IGFjY0VzdGltYXRlWzFdO1xuICAgIG91dHB1dFsyXSA9IGFjY0VzdGltYXRlWzJdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9yaWVudGF0aW9uO1xuIl19