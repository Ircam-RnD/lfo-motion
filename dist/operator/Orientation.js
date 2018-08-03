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

        // integrate angle from gyro current values and last result
        // get angles between projection of R on ZX/ZY plane and Z axis, based on last accEstimate

        // gyroVector in deg/s, delta and angle in rad
        var rollDelta = gyroVector[0] * dt * toRad;
        var rollAngle = atan2(accEstimate[0], accEstimate[2]) + rollDelta;

        var pitchDelta = gyroVector[1] * dt * toRad;
        var pitchAngle = atan2(accEstimate[1], accEstimate[2]) + pitchDelta;

        // calculate projection vector from angle Estimates
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

        // interpolate between estimated values and raw values
        for (var _i = 0; _i < 3; _i++) {
          accEstimate[_i] = gyroEstimate[_i] * k + accVector[_i] * (1 - k);
        }

        normalize(accEstimate);

        //Rz is too small and because it is used as reference for computing Axz, Ayz
        //it's error fluctuations will amplify leading to bad results. In this case
        //skip the gyro data and just use previous estimate
        if (abs(accEstimate[2]) < 0.1) {
          // use input instead of estimation
          // accVector is already normalized
          for (var _i2 = 0; _i2 < 3; _i2++) {
            accEstimate[_i2] = accVector[_i2];
          }
          outlet(1, "coince");
        }
      }
      output[0] = accEstimate[0];
      output[1] = accEstimate[1];
      output[2] = accEstimate[2];
    }
  }]);
  return Orientation;
}(_core.BaseLfo);

exports.default = Orientation;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9yaWVudGF0aW9uLmpzIl0sIm5hbWVzIjpbImFicyIsIk1hdGgiLCJhdGFuMiIsImNvcyIsInNpbiIsInNxcnQiLCJwb3ciLCJ0YW4iLCJtYXgiLCJ0b0RlZyIsIlBJIiwidG9SYWQiLCJub3JtYWxpemUiLCJ2IiwibWFnIiwicGFyYW1ldGVycyIsImsiLCJ0eXBlIiwibWluIiwic3RlcCIsImRlZmF1bHQiLCJPcmllbnRhdGlvbiIsIm9wdGlvbnMiLCJwcmV2U3RyZWFtUGFyYW1zIiwicHJlcGFyZVN0cmVhbVBhcmFtcyIsInN0cmVhbVBhcmFtcyIsImZyYW1lU2l6ZSIsImluaXQiLCJsYXN0VGltZSIsImludGVydmFsIiwiYWNjVmVjdG9yIiwiRmxvYXQzMkFycmF5IiwiZ3lyb1ZlY3RvciIsImd5cm9Fc3RpbWF0ZSIsImFjY0VzdGltYXRlIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJ0aW1lIiwiaW5wdXQiLCJkYXRhIiwib3V0cHV0IiwicGFyYW1zIiwiZ2V0IiwiYWNjT2Zmc2V0IiwiZ3lyb09mZnNldCIsImkiLCJkdCIsInJvbGxEZWx0YSIsInJvbGxBbmdsZSIsInBpdGNoRGVsdGEiLCJwaXRjaEFuZ2xlIiwic2lnbllhdyIsImd5cm9Fc3RpbWF0ZVNxdWFyZWQiLCJvdXRsZXQiLCJCYXNlTGZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUE7QUFDQSxJQUFNQSxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1FLFFBQVFELEtBQUtDLEtBQW5CO0FBQ0EsSUFBTUMsTUFBTUYsS0FBS0UsR0FBakI7QUFDQSxJQUFNQyxNQUFNSCxLQUFLRyxHQUFqQjtBQUNBLElBQU1DLE9BQU9KLEtBQUtJLElBQWxCO0FBQ0EsSUFBTUMsTUFBTUwsS0FBS0ssR0FBakI7QUFDQSxJQUFNQyxNQUFNTixLQUFLTSxHQUFqQjtBQUNBLElBQU1DLE1BQU1QLEtBQUtPLEdBQWpCOztBQUVBLElBQU1DLFFB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SixLQUFrQixDQUFsQixHQUFzQixDQUF0QixHQUEwQixDQUFDLENBQTNDOztBQUVBO0FBQ0EsWUFBTUksc0JBQXNCOUMsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLElBQTBCM0IsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLENBQXREOztBQUVBQSxxQkFBYSxDQUFiLElBQWtCa0IsVUFBVTlDLEtBQUtHLElBQUksQ0FBSixFQUFPLElBQUk0QyxtQkFBWCxDQUFMLENBQTVCOztBQUVBO0FBQ0EsYUFBSyxJQUFJUCxLQUFJLENBQWIsRUFBZ0JBLEtBQUksQ0FBcEIsRUFBdUJBLElBQXZCLEVBQTRCO0FBQzFCWCxzQkFBWVcsRUFBWixJQUFpQlosYUFBYVksRUFBYixJQUFrQjdCLENBQWxCLEdBQXNCYyxVQUFVZSxFQUFWLEtBQWdCLElBQUk3QixDQUFwQixDQUF2QztBQUNEOztBQUVESixrQkFBVXNCLFdBQVY7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBSWxDLElBQUlrQyxZQUFZLENBQVosQ0FBSixJQUFzQixHQUExQixFQUErQjtBQUM3QjtBQUNBO0FBQ0EsZUFBSSxJQUFJVyxNQUFJLENBQVosRUFBZUEsTUFBRyxDQUFsQixFQUFxQkEsS0FBckIsRUFBMEI7QUFDeEJYLHdCQUFZVyxHQUFaLElBQWlCZixVQUFVZSxHQUFWLENBQWpCO0FBQ0Q7QUFDRFEsaUJBQU8sQ0FBUCxFQUFVLFFBQVY7QUFDRDtBQUVGO0FBQ0RiLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDQU0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0Q7OztFQXhIdUJvQixhOztrQkEySFhqQyxXIiwiZmlsZSI6Ik9yaWVudGF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuLy8gcG9ydCBvZiBvcmllbnRhdGlvbi5jcHAgTWF4IG9iamVjdFxuY29uc3QgYWJzID0gTWF0aC5hYnM7XG5jb25zdCBhdGFuMiA9IE1hdGguYXRhbjI7XG5jb25zdCBjb3MgPSBNYXRoLmNvcztcbmNvbnN0IHNpbiA9IE1hdGguc2luO1xuY29uc3Qgc3FydCA9IE1hdGguc3FydDtcbmNvbnN0IHBvdyA9IE1hdGgucG93O1xuY29uc3QgdGFuID0gTWF0aC50YW47XG5jb25zdCBtYXggPSBNYXRoLm1heDtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG5cbiAgaWYgKG1hZyA+IDApIHtcbiAgICB2WzBdIC89IG1hZztcbiAgICB2WzFdIC89IG1hZztcbiAgICB2WzJdIC89IG1hZztcbiAgfVxuXG4gIHJldHVybiB2O1xufVxuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICAgIHN0ZXA6IDAuMDEsXG4gICAgZGVmYXVsdDogMC45LFxuICB9LFxufTtcblxuLyoqXG4gKiBGaWx0ZXIgdGhhdCBpbnRlZ3JhdGUgZ3lyb3NzY29wZSBhbmQgYWNjZWxlcmF0aW9uIGluIG9yZGVyIHRvIHJlbW92ZSBub2lzZVxuICogZnJvbSBhY2NlbGVyb21ldGVycyBkYXRhIHdoaWxlIGtlZXBpbmcgYSBnb29kIHJlYWN0aXZpdHkuXG4gKiBUaGUgZmlsdGVyIG91cHV0cyBhIG5vcm1hbGl6ZWQgcHJvamVjdGlvbiB2ZWN0b3IuXG4gKiBCZSBhd2FyZSB0aGF0IHRoZSBvdXQgb2YgdGhlIGZpbHRlciBpbnZlcnQgdGhlIHggYW5kIHogaW4gcmVnYXJkIG9mIHRoZVxuICogZGV2aWNlIG1vdGlvbiBzcGVjaWZpY2F0aW9uIChsZWZ0LWhhbmQgYXhpcykuIFRoaXMgaXMgZG9uZSBmb3IgY29tcGF0aWJpbGl0eVxuICogd2l0aCB0aGUgUi1pb1Qgc2Vuc29yLlxuICpcbiAqIEBtZW1iZXJvZiBvcGVyYXRvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuaz0wLjldIC0gUmF0aW8gYmV0d2VlbiB0aGUgYWNjZWxlcm9tZXRlcnMgYW5kIGd5cm9zY29wZS5cbiAqICAxIG1lYW5zIGd5cm9zY29wZSBvbmx5XG4gKiAgMCBtZWFuIGFjY2VsZXJvbWV0ZXJzIG9ubHkgKHRoaXMgaXMgZXF1aXZhbGVudCB0byBhIGxvd3Bhc3MgZmlsdGVyKVxuICpcbiAqIEBleGFtcGxlXG4gKiBpbXBvcnQgKiBhcyBsZm8gZnJvbSAnd2F2ZXMtbGZvL2NsaWVudCc7XG4gKiBpbXBvcnQgKiBhcyBsZm9Nb3Rpb24gZnJvbSAnbGZvLW1vdGlvbic7XG4gKlxuICogY29uc3QgbW90aW9uSW5wdXQgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3Qgc2FtcGxlciA9IG5ldyBsZm9Nb3Rpb24ub3BlcmF0b3IuU2FtcGxlcih7IGZyYW1lUmF0ZTogNTAgfSk7XG4gKiBjb25zdCBvcmllbnRhdGlvbiA9IG5ldyBsZm9Nb3Rpb24ub3BlcmF0b3IuT3JpZW50YXRpb24oKTtcbiAqIGNvbnN0IGxvZ2dlciA9IG5ldyBsZm8uc2luay5Mb2dnZXIoeyBkYXRhOiB0cnVlIH0pO1xuICpcbiAqIG1vdGlvbklucHV0LmNvbm5lY3Qoc2FtcGxlcik7XG4gKiBzYW1wbGVyLmNvbm5lY3Qob3JpZW50YXRpb24pO1xuICogb3JpZW50YXRpb24uY29ubmVjdChsb2dnZXIpO1xuICpcbiAqIG1vdGlvbklucHV0LmluaXQoKS50aGVuKCgpID0+IG1vdGlvbklucHV0LnN0YXJ0KCkpXG4gKi9cbmNsYXNzIE9yaWVudGF0aW9uIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuXG4gICAgdGhpcy5pbml0ID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gICAgLy8gdGhpcy5rID0gMC45O1xuXG4gICAgLy8gbm9ybWFsaXplZCBhY2NlbGVyYXRpb24gdmVjdG9yXG4gICAgLy8gY29vcmRpbmF0ZXMgYXJlIGZsaXBwZWQgdG8gbWF0Y2ggUi1pb1QgY29vcmRzIHN5c3RlbVxuICAgIHRoaXMuYWNjVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBub3JtYWxpemUgZ3lybyBvcmRlciBhbmQgZGlyZWN0aW9uIGFjY29yZGluZyB0byBSLWlvVFxuICAgIHRoaXMuZ3lyb1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7IC8vIHRoaXJkIGNvbXBvbmVudCAoeWF3KSB3aWxsIG5ldmVyIGJlIHVzZWRcbiAgICAvLyBzYW1lIGFzIGJlZm9yZSBhcyBhIHByb2plY3Rpb24gdmVjdG9yXG4gICAgdGhpcy5neXJvRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIGZpbHRlcmVkIHZlY3RvclxuICAgIHRoaXMuYWNjRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB0aW1lID0gZnJhbWUudGltZTtcbiAgICBjb25zdCBpbnB1dCA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0VzdGltYXRlID0gdGhpcy5hY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBneXJvRXN0aW1hdGUgPSB0aGlzLmd5cm9Fc3RpbWF0ZTtcblxuICAgIGNvbnN0IGsgPSB0aGlzLnBhcmFtcy5nZXQoJ2snKTtcblxuICAgIC8qKlxuICAgICAqIFJlb3JkZXIgYWNjZWxlcm9tZXRlciBhbmQgZ3lybyB0byBjb25mb3JtIHRvIFItaW9UXG4gICAgICogY29vcmRpbmF0ZSBzeXN0ZW0gYW5kIGd5cm8gZGlyZWN0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0IGFjY1ZlY3RvciA9IHRoaXMuYWNjVmVjdG9yO1xuICAgIGNvbnN0IGFjY09mZnNldCA9IDA7XG4gICAgYWNjVmVjdG9yWzBdID0gLTEgKiBpbnB1dFswICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMV0gPSAgMSAqIGlucHV0WzEgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMiArIGFjY09mZnNldF07XG5cbiAgICBjb25zdCBneXJvVmVjdG9yID0gdGhpcy5neXJvVmVjdG9yO1xuICAgIGNvbnN0IGd5cm9PZmZzZXQgPSAzO1xuICAgIGd5cm9WZWN0b3JbMF0gPSAtMSAqIGlucHV0WzIgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzFdID0gLTEgKiBpbnB1dFsxICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMCArIGd5cm9PZmZzZXRdO1xuXG4gICAgbm9ybWFsaXplKGFjY1ZlY3Rvcik7XG5cbiAgICBpZiAoIXRoaXMubGFzdFRpbWUpIHtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuICAgICAgLy8gaW5pdGlhbGl6ZSBjb3JyZWN0ZWQgb3JpZW50YXRpb24gd2l0aCBub3JtYWxpemVkIGFjY2VsZXJvbWV0ZXIgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gYWNjVmVjdG9yW2ldO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlZmluZSBpZiB3ZSB1c2UgdGhhdCBvciB1c2UgdGhlIGxvZ2ljYWwgYE1vdGlvbkV2ZW50LmludGVydmFsYFxuICAgICAgY29uc3QgZHQgPSB0aW1lIC0gdGhpcy5sYXN0VGltZTtcblxuICAgICAgdGhpcy5sYXN0VGltZSA9IHRpbWU7XG5cbiAgICAgIC8vIGludGVncmF0ZSBhbmdsZSBmcm9tIGd5cm8gY3VycmVudCB2YWx1ZXMgYW5kIGxhc3QgcmVzdWx0XG4gICAgICAvLyBnZXQgYW5nbGVzIGJldHdlZW4gcHJvamVjdGlvbiBvZiBSIG9uIFpYL1pZIHBsYW5lIGFuZCBaIGF4aXMsIGJhc2VkIG9uIGxhc3QgYWNjRXN0aW1hdGVcblxuICAgICAgLy8gZ3lyb1ZlY3RvciBpbiBkZWcvcywgZGVsdGEgYW5kIGFuZ2xlIGluIHJhZFxuICAgICAgY29uc3Qgcm9sbERlbHRhID0gZ3lyb1ZlY3RvclswXSAqIGR0ICogdG9SYWQ7XG4gICAgICBjb25zdCByb2xsQW5nbGUgPSBhdGFuMihhY2NFc3RpbWF0ZVswXSwgYWNjRXN0aW1hdGVbMl0pICsgcm9sbERlbHRhO1xuXG4gICAgICBjb25zdCBwaXRjaERlbHRhID0gZ3lyb1ZlY3RvclsxXSAqIGR0ICogdG9SYWQ7XG4gICAgICBjb25zdCBwaXRjaEFuZ2xlID0gYXRhbjIoYWNjRXN0aW1hdGVbMV0sIGFjY0VzdGltYXRlWzJdKSArIHBpdGNoRGVsdGE7XG5cbiAgICAgIC8vIGNhbGN1bGF0ZSBwcm9qZWN0aW9uIHZlY3RvciBmcm9tIGFuZ2xlIEVzdGltYXRlc1xuICAgICAgZ3lyb0VzdGltYXRlWzBdID0gc2luKHJvbGxBbmdsZSk7XG4gICAgICBneXJvRXN0aW1hdGVbMF0gLz0gc3FydCgxICsgcG93KGNvcyhyb2xsQW5nbGUpLCAyKSAqIHBvdyh0YW4ocGl0Y2hBbmdsZSksIDIpKTtcblxuICAgICAgZ3lyb0VzdGltYXRlWzFdID0gc2luKHBpdGNoQW5nbGUpO1xuICAgICAgZ3lyb0VzdGltYXRlWzFdIC89IHNxcnQoMSArIHBvdyhjb3MocGl0Y2hBbmdsZSksIDIpICogcG93KHRhbihyb2xsQW5nbGUpLCAyKSk7XG5cbiAgICAgIC8vIGVzdGltYXRlIHNpZ24gb2YgUnpHeXJvIGJ5IGxvb2tpbmcgaW4gd2hhdCBxdWRyYW50IHRoZSBhbmdsZSBBeHogaXMsXG4gICAgICAvLyBSekd5cm8gaXMgcG9zaXRpdmUgaWYgIEF4eiBpbiByYW5nZSAtOTAgLi45MCA9PiBjb3MoQXd6KSA+PSAwXG4gICAgICBjb25zdCBzaWduWWF3ID0gY29zKHJvbGxBbmdsZSkgPj0gMCA/IDEgOiAtMTtcblxuICAgICAgLy8gZXN0aW1hdGUgeWF3IHNpbmNlIHZlY3RvciBpcyBub3JtYWxpemVkXG4gICAgICBjb25zdCBneXJvRXN0aW1hdGVTcXVhcmVkID0gcG93KGd5cm9Fc3RpbWF0ZVswXSwgMikgKyBwb3coZ3lyb0VzdGltYXRlWzFdLCAyKTtcblxuICAgICAgZ3lyb0VzdGltYXRlWzJdID0gc2lnbllhdyAqIHNxcnQobWF4KDAsIDEgLSBneXJvRXN0aW1hdGVTcXVhcmVkKSk7XG5cbiAgICAgIC8vIGludGVycG9sYXRlIGJldHdlZW4gZXN0aW1hdGVkIHZhbHVlcyBhbmQgcmF3IHZhbHVlc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgYWNjRXN0aW1hdGVbaV0gPSBneXJvRXN0aW1hdGVbaV0gKiBrICsgYWNjVmVjdG9yW2ldICogKDEgLSBrKTtcbiAgICAgIH1cblxuICAgICAgbm9ybWFsaXplKGFjY0VzdGltYXRlKTtcblxuICAgICAgLy9SeiBpcyB0b28gc21hbGwgYW5kIGJlY2F1c2UgaXQgaXMgdXNlZCBhcyByZWZlcmVuY2UgZm9yIGNvbXB1dGluZyBBeHosIEF5elxuICAgICAgLy9pdCdzIGVycm9yIGZsdWN0dWF0aW9ucyB3aWxsIGFtcGxpZnkgbGVhZGluZyB0byBiYWQgcmVzdWx0cy4gSW4gdGhpcyBjYXNlXG4gICAgICAvL3NraXAgdGhlIGd5cm8gZGF0YSBhbmQganVzdCB1c2UgcHJldmlvdXMgZXN0aW1hdGVcbiAgICAgIGlmIChhYnMoYWNjRXN0aW1hdGVbMl0pIDwgMC4xKSB7XG4gICAgICAgIC8vIHVzZSBpbnB1dCBpbnN0ZWFkIG9mIGVzdGltYXRpb25cbiAgICAgICAgLy8gYWNjVmVjdG9yIGlzIGFscmVhZHkgbm9ybWFsaXplZFxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpPCAzOyBpKyspIHtcbiAgICAgICAgICBhY2NFc3RpbWF0ZVtpXSA9IGFjY1ZlY3RvcltpXTtcbiAgICAgICAgfVxuICAgICAgICBvdXRsZXQoMSwgXCJjb2luY2VcIik7XG4gICAgICB9XG5cbiAgICB9XG4gICAgb3V0cHV0WzBdID0gYWNjRXN0aW1hdGVbMF07XG4gICAgb3V0cHV0WzFdID0gYWNjRXN0aW1hdGVbMV07XG4gICAgb3V0cHV0WzJdID0gYWNjRXN0aW1hdGVbMl07XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT3JpZW50YXRpb247XG4iXX0=