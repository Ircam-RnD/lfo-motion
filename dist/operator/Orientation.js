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
 * @memberof operator
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.k=0.9] - Ratio between the accelerometers and gyroscope.
 *  1 means gyroscope only
 *  0 mean accelerometers only (this is equivalent to a lowpass filter)
 *
 * @example
 * import * as lfo from 'waves-lfo/client';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const motionInput = new lfoMotion.source.MotionInput();
 * const sampler = new lfoMotion.operator.Sampler({ frameRate: 50 });
 * const orientation = new lfoMotion.operator.Orientation();
 * const logger = new lfo.sink.Logger({ data: true });
 *
 * motionInput.connect(sampler);
 * sampler.connect(orientation);
 * orientation.connect(logger);
 *
 * motionInput.init().then(() => motionInput.start())
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsIm1heCIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJsYXN0QWNjRXN0aW1hdGUiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3IiwiZ3lyb0VzdGltYXRlU3F1YXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUVBO0FBQ0EsSUFBTUEsTUFBTUMsS0FBS0QsR0FBakI7QUFDQSxJQUFNRSxRQUFRRCxLQUFLQyxLQUFuQjtBQUNBLElBQU1DLE1BQU1GLEtBQUtFLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTUgsS0FBS0csR0FBakI7QUFDQSxJQUFNQyxPQUFPSixLQUFLSSxJQUFsQjtBQUNBLElBQU1DLE1BQU1MLEtBQUtLLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTU4sS0FBS00sR0FBakI7QUFDQSxJQUFNQyxNQUFNUCxLQUFLTyxHQUFqQjs7QUFFQSxJQUFNQyxRQUFR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LHVCQUFhLENBQWIsSUFBa0I3QixJQUFJK0MsVUFBSixDQUFsQjtBQUNBbEIsdUJBQWEsQ0FBYixLQUFtQjVCLEtBQUssSUFBSUMsSUFBSUgsSUFBSWdELFVBQUosQ0FBSixFQUFxQixDQUFyQixJQUEwQjdDLElBQUlDLElBQUkwQyxTQUFKLENBQUosRUFBb0IsQ0FBcEIsQ0FBbkMsQ0FBbkI7O0FBRUE7QUFDQTtBQUNBLGNBQU1HLFVBQVVqRCxJQUFJOEMsU0FBSixLQUFrQixDQUFsQixHQUFzQixDQUF0QixHQUEwQixDQUFDLENBQTNDOztBQUVBO0FBQ0EsY0FBTUksc0JBQXNCL0MsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLElBQTBCM0IsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLENBQXREO0FBQ0FBLHVCQUFhLENBQWIsSUFBa0JtQixVQUFVL0MsS0FBS0csSUFBSSxDQUFKLEVBQU8sSUFBSTZDLG1CQUFYLENBQUwsQ0FBNUI7QUFDRDs7QUFFRDtBQUNBLGFBQUssSUFBSVAsTUFBSSxDQUFiLEVBQWdCQSxNQUFJLENBQXBCLEVBQXVCQSxLQUF2QjtBQUNFWixzQkFBWVksR0FBWixJQUFpQmIsYUFBYWEsR0FBYixJQUFrQjlCLENBQWxCLEdBQXNCYyxVQUFVZ0IsR0FBVixLQUFnQixJQUFJOUIsQ0FBcEIsQ0FBdkM7QUFERixTQUdBSixVQUFVc0IsV0FBVjtBQUNEOztBQUVETSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDQU0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0FNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNEOzs7OztrQkFHWWIsVyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuLy8gcG9ydCBvZiBvcmllbnRhdGlvbi5jcHAgTWF4IG9iamVjdFxuY29uc3QgYWJzID0gTWF0aC5hYnM7XG5jb25zdCBhdGFuMiA9IE1hdGguYXRhbjI7XG5jb25zdCBjb3MgPSBNYXRoLmNvcztcbmNvbnN0IHNpbiA9IE1hdGguc2luO1xuY29uc3Qgc3FydCA9IE1hdGguc3FydDtcbmNvbnN0IHBvdyA9IE1hdGgucG93O1xuY29uc3QgdGFuID0gTWF0aC50YW47XG5jb25zdCBtYXggPSBNYXRoLm1heDtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG5cbiAgaWYgKG1hZyA+IDApIHtcbiAgICB2WzBdIC89IG1hZztcbiAgICB2WzFdIC89IG1hZztcbiAgICB2WzJdIC89IG1hZztcbiAgfVxuXG4gIHJldHVybiB2O1xufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICAgIHN0ZXA6IDAuMDEsXG4gICAgZGVmYXVsdDogMC45LFxuICB9LFxufTtcblxuLyoqXG4gKiBGaWx0ZXIgdGhhdCBpbnRlZ3JhdGUgZ3lyb3NzY29wZSBhbmQgYWNjZWxlcmF0aW9uIGluIG9yZGVyIHRvIHJlbW92ZSBub2lzZVxuICogZnJvbSBhY2NlbGVyb21ldGVycyBkYXRhIHdoaWxlIGtlZXBpbmcgYSBnb29kIHJlYWN0aXZpdHkuXG4gKiBUaGUgZmlsdGVyIG91cHV0cyBhIG5vcm1hbGl6ZWQgcHJvamVjdGlvbiB2ZWN0b3IuXG4gKiBCZSBhd2FyZSB0aGF0IHRoZSBvdXQgb2YgdGhlIGZpbHRlciBpbnZlcnQgdGhlIHggYW5kIHogaW4gcmVnYXJkIG9mIHRoZVxuICogZGV2aWNlIG1vdGlvbiBzcGVjaWZpY2F0aW9uIChsZWZ0LWhhbmQgYXhpcykuIFRoaXMgaXMgZG9uZSBmb3IgY29tcGF0aWJpbGl0eVxuICogd2l0aCB0aGUgUi1pb1Qgc2Vuc29yLlxuICpcbiAqIEBtZW1iZXJvZiBvcGVyYXRvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuaz0wLjldIC0gUmF0aW8gYmV0d2VlbiB0aGUgYWNjZWxlcm9tZXRlcnMgYW5kIGd5cm9zY29wZS5cbiAqICAxIG1lYW5zIGd5cm9zY29wZSBvbmx5XG4gKiAgMCBtZWFuIGFjY2VsZXJvbWV0ZXJzIG9ubHkgKHRoaXMgaXMgZXF1aXZhbGVudCB0byBhIGxvd3Bhc3MgZmlsdGVyKVxuICpcbiAqIEBleGFtcGxlXG4gKiBpbXBvcnQgKiBhcyBsZm8gZnJvbSAnd2F2ZXMtbGZvL2NsaWVudCc7XG4gKiBpbXBvcnQgKiBhcyBsZm9Nb3Rpb24gZnJvbSAnbGZvLW1vdGlvbic7XG4gKlxuICogY29uc3QgbW90aW9uSW5wdXQgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3Qgc2FtcGxlciA9IG5ldyBsZm9Nb3Rpb24ub3BlcmF0b3IuU2FtcGxlcih7IGZyYW1lUmF0ZTogNTAgfSk7XG4gKiBjb25zdCBvcmllbnRhdGlvbiA9IG5ldyBsZm9Nb3Rpb24ub3BlcmF0b3IuT3JpZW50YXRpb24oKTtcbiAqIGNvbnN0IGxvZ2dlciA9IG5ldyBsZm8uc2luay5Mb2dnZXIoeyBkYXRhOiB0cnVlIH0pO1xuICpcbiAqIG1vdGlvbklucHV0LmNvbm5lY3Qoc2FtcGxlcik7XG4gKiBzYW1wbGVyLmNvbm5lY3Qob3JpZW50YXRpb24pO1xuICogb3JpZW50YXRpb24uY29ubmVjdChsb2dnZXIpO1xuICpcbiAqIG1vdGlvbklucHV0LmluaXQoKS50aGVuKCgpID0+IG1vdGlvbklucHV0LnN0YXJ0KCkpXG4gKi9cbmNsYXNzIE9yaWVudGF0aW9uIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuXG4gICAgdGhpcy5pbml0ID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gICAgLy8gdGhpcy5rID0gMC45O1xuXG4gICAgLy8gbm9ybWFsaXplZCBhY2NlbGVyYXRpb24gdmVjdG9yXG4gICAgLy8gY29vcmRpbmF0ZXMgYXJlIGZsaXBwZWQgdG8gbWF0Y2ggUi1pb1QgY29vcmRzIHN5c3RlbVxuICAgIHRoaXMuYWNjVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBub3JtYWxpemUgZ3lybyBvcmRlciBhbmQgZGlyZWN0aW9uIGFjY29yZGluZyB0byBSLWlvVFxuICAgIHRoaXMuZ3lyb1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7IC8vIHRoaXJkIGNvbXBvbmVudCAoeWF3KSB3aWxsIG5ldmVyIGJlIHVzZWRcbiAgICAvLyBzYW1lIGFzIGJlZm9yZSBhcyBhIHByb2plY3Rpb24gdmVjdG9yXG4gICAgdGhpcy5neXJvRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIGZpbHRlcmVkIHZlY3RvclxuICAgIHRoaXMuYWNjRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB0aW1lID0gZnJhbWUudGltZTtcbiAgICBjb25zdCBpbnB1dCA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0VzdGltYXRlID0gdGhpcy5hY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBsYXN0QWNjRXN0aW1hdGUgPSB0aGlzLmxhc3RBY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBneXJvRXN0aW1hdGUgPSB0aGlzLmd5cm9Fc3RpbWF0ZTtcblxuICAgIGNvbnN0IGsgPSB0aGlzLnBhcmFtcy5nZXQoJ2snKTtcblxuICAgIC8qKlxuICAgICAqIFJlb3JkZXIgYWNjZWxlcm9tZXRlciBhbmQgZ3lybyB0byBjb25mb3JtIHRvIFItaW9UXG4gICAgICogY29vcmRpbmF0ZSBzeXN0ZW0gYW5kIGd5cm8gZGlyZWN0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0IGFjY1ZlY3RvciA9IHRoaXMuYWNjVmVjdG9yO1xuICAgIGNvbnN0IGFjY09mZnNldCA9IDA7XG4gICAgYWNjVmVjdG9yWzBdID0gLTEgKiBpbnB1dFswICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMV0gPSAgMSAqIGlucHV0WzEgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMiArIGFjY09mZnNldF07XG5cbiAgICBjb25zdCBneXJvVmVjdG9yID0gdGhpcy5neXJvVmVjdG9yO1xuICAgIGNvbnN0IGd5cm9PZmZzZXQgPSAzO1xuICAgIGd5cm9WZWN0b3JbMF0gPSAtMSAqIGlucHV0WzIgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzFdID0gLTEgKiBpbnB1dFsxICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMCArIGd5cm9PZmZzZXRdO1xuXG4gICAgbm9ybWFsaXplKGFjY1ZlY3Rvcik7XG5cbiAgICBpZiAoIXRoaXMubGFzdFRpbWUpIHtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuICAgICAgLy8gaW5pdGlhbGl6ZSBjb3JyZWN0ZWQgb3JpZW50YXRpb24gd2l0aCBub3JtYWxpemVkIGFjY2VsZXJvbWV0ZXIgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gYWNjVmVjdG9yW2ldO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlZmluZSBpZiB3ZSB1c2UgdGhhdCBvciB1c2UgdGhlIGxvZ2ljYWwgYE1vdGlvbkV2ZW50LmludGVydmFsYFxuICAgICAgY29uc3QgZHQgPSB0aW1lIC0gdGhpcy5sYXN0VGltZTtcblxuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG5cbiAgICAgIC8vIGFzIGFjY0VzdGltYXRlIGlzIGEgbm9ybWFsaXplZCB2ZWN0b3IgbWF5YmUgdGhpcyBjb3VsZCBiZSB2YXJpYWJsZVxuICAgICAgLy8gQHRvZG8gLSBubyBpZGVhIHdoYXQncyBnb2luZyBvbiBoZXJlLi4uXG4gICAgICBpZiAoYWJzKGFjY0VzdGltYXRlWzJdKSA8IDAuMSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgICBneXJvRXN0aW1hdGVbaV0gPSBhY2NFc3RpbWF0ZVtpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGludGVncmF0ZSBhbmdsZSBmcm9tIGd5cm8gY3VycmVudCB2YWx1ZXMgYW5kIGxhc3QgcmVzdWx0XG4gICAgICAgIGNvbnN0IHJvbGxEZWx0YSA9IGd5cm9WZWN0b3JbMF0gKiBkdCAqIHRvUmFkO1xuICAgICAgICBjb25zdCByb2xsQW5nbGUgPSBhdGFuMihhY2NFc3RpbWF0ZVswXSwgYWNjRXN0aW1hdGVbMl0pICsgcm9sbERlbHRhO1xuXG4gICAgICAgIGNvbnN0IHBpdGNoRGVsdGEgPSBneXJvVmVjdG9yWzFdICogZHQgKiB0b1JhZDtcbiAgICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzFdLCBhY2NFc3RpbWF0ZVsyXSkgKyBwaXRjaERlbHRhO1xuXG4gICAgICAgIC8vIC8vIGNhbGN1bGF0ZSBwcm9qZWN0aW9uIHZlY3RvciBmcm9tIGFuZ2xlRXN0aW1hdGVzXG4gICAgICAgIGd5cm9Fc3RpbWF0ZVswXSA9IHNpbihyb2xsQW5nbGUpO1xuICAgICAgICBneXJvRXN0aW1hdGVbMF0gLz0gc3FydCgxICsgcG93KGNvcyhyb2xsQW5nbGUpLCAyKSAqIHBvdyh0YW4ocGl0Y2hBbmdsZSksIDIpKTtcblxuICAgICAgICBneXJvRXN0aW1hdGVbMV0gPSBzaW4ocGl0Y2hBbmdsZSk7XG4gICAgICAgIGd5cm9Fc3RpbWF0ZVsxXSAvPSBzcXJ0KDEgKyBwb3coY29zKHBpdGNoQW5nbGUpLCAyKSAqIHBvdyh0YW4ocm9sbEFuZ2xlKSwgMikpO1xuXG4gICAgICAgIC8vIGVzdGltYXRlIHNpZ24gb2YgUnpHeXJvIGJ5IGxvb2tpbmcgaW4gd2hhdCBxdWRyYW50IHRoZSBhbmdsZSBBeHogaXMsXG4gICAgICAgIC8vIFJ6R3lybyBpcyBwb3NpdGl2ZSBpZiAgQXh6IGluIHJhbmdlIC05MCAuLjkwID0+IGNvcyhBd3opID49IDBcbiAgICAgICAgY29uc3Qgc2lnbllhdyA9IGNvcyhyb2xsQW5nbGUpID49IDAgPyAxIDogLTE7XG5cbiAgICAgICAgLy8gZXN0aW1hdGUgeWF3IHNpbmNlIHZlY3RvciBpcyBub3JtYWxpemVkXG4gICAgICAgIGNvbnN0IGd5cm9Fc3RpbWF0ZVNxdWFyZWQgPSBwb3coZ3lyb0VzdGltYXRlWzBdLCAyKSArIHBvdyhneXJvRXN0aW1hdGVbMV0sIDIpO1xuICAgICAgICBneXJvRXN0aW1hdGVbMl0gPSBzaWduWWF3ICogc3FydChtYXgoMCwgMSAtIGd5cm9Fc3RpbWF0ZVNxdWFyZWQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gaW50ZXJwb2xhdGUgYmV0d2VlbiBlc3RpbWF0ZWQgdmFsdWVzIGFuZCByYXcgdmFsdWVzXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKylcbiAgICAgICAgYWNjRXN0aW1hdGVbaV0gPSBneXJvRXN0aW1hdGVbaV0gKiBrICsgYWNjVmVjdG9yW2ldICogKDEgLSBrKTtcblxuICAgICAgbm9ybWFsaXplKGFjY0VzdGltYXRlKTtcbiAgICB9XG5cbiAgICBvdXRwdXRbMF0gPSBhY2NFc3RpbWF0ZVswXTtcbiAgICBvdXRwdXRbMV0gPSBhY2NFc3RpbWF0ZVsxXTtcbiAgICBvdXRwdXRbMl0gPSBhY2NFc3RpbWF0ZVsyXTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBPcmllbnRhdGlvbjtcbiJdfQ==