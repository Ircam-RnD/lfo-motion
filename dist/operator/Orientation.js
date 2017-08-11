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
 * device motion specification. This is done for compatibility with the R-ioT
 * sensor.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJtYXgiLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUE7QUFDQSxJQUFNQSxNQUFNQyxLQUFLRCxHQUFqQjtBQUNBLElBQU1FLFFBQVFELEtBQUtDLEtBQW5CO0FBQ0EsSUFBTUMsTUFBTUYsS0FBS0UsR0FBakI7QUFDQSxJQUFNQyxNQUFNSCxLQUFLRyxHQUFqQjtBQUNBLElBQU1DLE9BQU9KLEtBQUtJLElBQWxCO0FBQ0EsSUFBTUMsTUFBTUwsS0FBS0ssR0FBakI7QUFDQSxJQUFNQyxNQUFNTixLQUFLTSxHQUFqQjs7QUFFQSxJQUFNQyxRQUFRLE1BQU1QLEtBQUtRLEVBQXpCO0FBQ0EsSUFBTUMsUUFBUVQsS0FBS1EsRUFBTCxHQUFVLEdBQXhCOztBQUVBLFNBQVNF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QUFuQyxDQUFuQjs7QUFFQTtBQUNBO0FBQ0EsY0FBTUcsVUFBVWhELElBQUk2QyxTQUFKLEtBQWtCLENBQWxCLEdBQXNCLENBQXRCLEdBQTBCLENBQUMsQ0FBM0M7QUFDQTtBQUNBZix1QkFBYSxDQUFiLElBQWtCa0IsVUFBVTlDLEtBQUssSUFBSUMsSUFBSTJCLGFBQWEsQ0FBYixDQUFKLEVBQXFCLENBQXJCLENBQUosR0FBOEIzQixJQUFJMkIsYUFBYSxDQUFiLENBQUosRUFBcUIsQ0FBckIsQ0FBbkMsQ0FBNUI7QUFDRDs7QUFFRDtBQUNBLGFBQUssSUFBSVksTUFBSSxDQUFiLEVBQWdCQSxNQUFJLENBQXBCLEVBQXVCQSxLQUF2QjtBQUNFWCxzQkFBWVcsR0FBWixJQUFpQlosYUFBYVksR0FBYixJQUFrQjlCLENBQWxCLEdBQXNCZSxVQUFVZSxHQUFWLEtBQWdCLElBQUk5QixDQUFwQixDQUF2QztBQURGLFNBR0FKLFVBQVV1QixXQUFWO0FBQ0Q7O0FBRURNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDQU0sYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0Q7Ozs7O2tCQUdZYixXIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG4vLyBwb3J0IG9mIG9yaWVudGF0aW9uLmNwcCBNYXggb2JqZWN0XG5jb25zdCBhYnMgPSBNYXRoLmFicztcbmNvbnN0IGF0YW4yID0gTWF0aC5hdGFuMjtcbmNvbnN0IGNvcyA9IE1hdGguY29zO1xuY29uc3Qgc2luID0gTWF0aC5zaW47XG5jb25zdCBzcXJ0ID0gTWF0aC5zcXJ0O1xuY29uc3QgcG93ID0gTWF0aC5wb3c7XG5jb25zdCB0YW4gPSBNYXRoLnRhbjtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuY29uc3QgdG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXG5mdW5jdGlvbiBub3JtYWxpemUodikge1xuICBjb25zdCBtYWcgPSBzcXJ0KHZbMF0gKiB2WzBdICsgdlsxXSAqIHZbMV0gKyB2WzJdICogdlsyXSk7XG4gIHZbMF0gLz0gbWFnO1xuICB2WzFdIC89IG1hZztcbiAgdlsyXSAvPSBtYWc7XG5cbiAgcmV0dXJuIHY7XG59XG5cbmNvbnN0IHBhcmFtZXRlcnMgPSB7XG4gIGs6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6IDEsXG4gICAgc3RlcDogMC4wMSxcbiAgICBkZWZhdWx0OiAwLjksXG4gIH0sXG59O1xuXG4vKipcbiAqIEZpbHRlciB0aGF0IGludGVncmF0ZSBneXJvc3Njb3BlIGFuZCBhY2NlbGVyYXRpb24gaW4gb3JkZXIgdG8gcmVtb3ZlIG5vaXNlXG4gKiBmcm9tIGFjY2VsZXJvbWV0ZXJzIGRhdGEgd2hpbGUga2VlcGluZyBhIGdvb2QgcmVhY3Rpdml0eS5cbiAqIFRoZSBmaWx0ZXIgb3VwdXRzIGEgbm9ybWFsaXplZCBwcm9qZWN0aW9uIHZlY3Rvci5cbiAqIEJlIGF3YXJlIHRoYXQgdGhlIG91dCBvZiB0aGUgZmlsdGVyIGludmVydCB0aGUgeCBhbmQgeiBpbiByZWdhcmQgb2YgdGhlXG4gKiBkZXZpY2UgbW90aW9uIHNwZWNpZmljYXRpb24uIFRoaXMgaXMgZG9uZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBSLWlvVFxuICogc2Vuc29yLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zXG4gKiBAcGFyYW0ge051bWJlcn0gayAtIFJhdGlvIGJldHdlZW4gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKiAgMSBtZWFucyBneXJvc2NvcGUgb25seVxuICogIDAgbWVhbiBhY2NlbGVyb21ldGVycyBvbmx5ICh0aGlzIGlzIGVxdWl2YWxlbnQgdG8gYSBsb3dwYXNzIGZpbHRlcilcbiAqXG4gKi9cbmNsYXNzIE9yaWVudGF0aW9uIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzO1xuXG4gICAgdGhpcy5pbml0ID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0VGltZSA9IDA7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gICAgLy8gdGhpcy5rID0gMC45O1xuXG4gICAgLy8gbm9ybWFsaXplZCBhY2NlbGVyYXRpb24gdmVjdG9yXG4gICAgLy8gY29vcmRpbmF0ZXMgYXJlIGZsaXBwZWQgdG8gbWF0Y2ggUi1pb1QgY29vcmRzIHN5c3RlbVxuICAgIHRoaXMuYWNjVmVjdG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBub3JtYWxpemUgZ3lybyBvcmRlciBhbmQgZGlyZWN0aW9uIGFjY29yZGluZyB0byBSLWlvVFxuICAgIHRoaXMuZ3lyb1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7IC8vIHRoaXJkIGNvbXBvbmVudCAoeWF3KSB3aWxsIG5ldmVyIGJlIHVzZWRcbiAgICAvLyBzYW1lIGFzIGJlZm9yZSBhcyBhIHByb2plY3Rpb24gdmVjdG9yXG4gICAgdGhpcy5neXJvRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgIC8vIGZpbHRlcmVkIHZlY3RvclxuICAgIHRoaXMuYWNjRXN0aW1hdGUgPSBuZXcgRmxvYXQzMkFycmF5KDMpO1xuXG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB0aW1lID0gZnJhbWUudGltZTtcbiAgICBjb25zdCBpbnB1dCA9IGZyYW1lLmRhdGE7XG4gICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5mcmFtZS5kYXRhO1xuICAgIGNvbnN0IGFjY0VzdGltYXRlID0gdGhpcy5hY2NFc3RpbWF0ZTtcbiAgICBjb25zdCBneXJvRXN0aW1hdGUgPSB0aGlzLmd5cm9Fc3RpbWF0ZTtcblxuICAgIGNvbnN0IGsgPSB0aGlzLnBhcmFtcy5nZXQoJ2snKTtcblxuICAgIC8qKlxuICAgICAqIFJlb3JkZXIgYWNjZWxlcm9tZXRlciBhbmQgZ3lybyB0byBjb25mb3JtIHRvIFItaW9UXG4gICAgICogY29vcmRpbmF0ZSBzeXN0ZW0gYW5kIGd5cm8gZGlyZWN0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0IGFjY1ZlY3RvciA9IHRoaXMuYWNjVmVjdG9yO1xuICAgIGNvbnN0IGFjY09mZnNldCA9IDA7XG4gICAgYWNjVmVjdG9yWzBdID0gLTEgKiBpbnB1dFswICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMV0gPSAgMSAqIGlucHV0WzEgKyBhY2NPZmZzZXRdO1xuICAgIGFjY1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMiArIGFjY09mZnNldF07XG5cbiAgICBjb25zdCBneXJvVmVjdG9yID0gdGhpcy5neXJvVmVjdG9yO1xuICAgIGNvbnN0IGd5cm9PZmZzZXQgPSAzO1xuICAgIGd5cm9WZWN0b3JbMF0gPSAtMSAqIGlucHV0WzIgKyBneXJvT2Zmc2V0XTtcbiAgICBneXJvVmVjdG9yWzFdID0gLTEgKiBpbnB1dFsxICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsyXSA9IC0xICogaW5wdXRbMCArIGd5cm9PZmZzZXRdO1xuXG4gICAgbm9ybWFsaXplKGFjY1ZlY3Rvcik7XG5cbiAgICBpZiAoIXRoaXMubGFzdFRpbWUpIHtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuICAgICAgLy8gaW5pdGlhbGl6ZSBjb3JyZWN0ZWQgb3JpZW50YXRpb24gd2l0aCBub3JtYWxpemVkIGFjY2VsZXJvbWV0ZXIgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gYWNjVmVjdG9yW2ldO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRlZmluZSBpZiB3ZSB1c2UgdGhhdCBvciB1c2UgdGhlIGxvZ2ljYWwgYE1vdGlvbkV2ZW50LmludGVydmFsYFxuICAgICAgY29uc3QgZHQgPSB0aW1lIC0gdGhpcy5sYXN0VGltZTtcbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuXG4gICAgICAvLyBhcyBhY2NFc3RpbWF0ZSBpcyBhIG5vcm1hbGl6ZWQgdmVjdG9yIG1heWJlIHRoaXMgY291bGQgYmUgdmFyaWFibGVcbiAgICAgIC8vIEB0b2RvIC0gbm8gaWRlYSB3aGF0J3MgZ29pbmcgb24gaGVyZS4uLlxuICAgICAgaWYgKGFicyhhY2NFc3RpbWF0ZVsyXSkgPCAwLjEpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspXG4gICAgICAgICAgZ3lyb0VzdGltYXRlW2ldID0gYWNjRXN0aW1hdGVbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpbnRlZ3JhdGUgYW5nbGUgZnJvbSBneXJvIGN1cnJlbnQgdmFsdWVzIGFuZCBsYXN0IHJlc3VsdFxuICAgICAgICBjb25zdCByb2xsRGVsdGEgPSBneXJvVmVjdG9yWzBdICogZHQgKiB0b1JhZDtcbiAgICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gYXRhbjIoYWNjRXN0aW1hdGVbMF0sIGFjY0VzdGltYXRlWzJdKSArIHJvbGxEZWx0YTtcblxuICAgICAgICBjb25zdCBwaXRjaERlbHRhID0gZ3lyb1ZlY3RvclsxXSAqIGR0ICogdG9SYWQ7XG4gICAgICAgIGNvbnN0IHBpdGNoQW5nbGUgPSBhdGFuMihhY2NFc3RpbWF0ZVsxXSwgYWNjRXN0aW1hdGVbMl0pICsgcGl0Y2hEZWx0YTtcblxuICAgICAgICAvLyAvLyBjYWxjdWxhdGUgcHJvamVjdGlvbiB2ZWN0b3IgZnJvbSBhbmdsZUVzdGltYXRlc1xuICAgICAgICBneXJvRXN0aW1hdGVbMF0gPSBzaW4ocm9sbEFuZ2xlKTtcbiAgICAgICAgZ3lyb0VzdGltYXRlWzBdIC89IHNxcnQoMSArIHBvdyhjb3Mocm9sbEFuZ2xlKSwgMikgKiBwb3codGFuKHBpdGNoQW5nbGUpLCAyKSk7XG5cbiAgICAgICAgZ3lyb0VzdGltYXRlWzFdID0gc2luKHBpdGNoQW5nbGUpO1xuICAgICAgICBneXJvRXN0aW1hdGVbMV0gLz0gc3FydCgxICsgcG93KGNvcyhwaXRjaEFuZ2xlKSwgMikgKiBwb3codGFuKHJvbGxBbmdsZSksIDIpKTtcblxuICAgICAgICAvLyBlc3RpbWF0ZSBzaWduIG9mIFJ6R3lybyBieSBsb29raW5nIGluIHdoYXQgcXVkcmFudCB0aGUgYW5nbGUgQXh6IGlzLFxuICAgICAgICAvLyBSekd5cm8gaXMgcG9zaXRpdmUgaWYgIEF4eiBpbiByYW5nZSAtOTAgLi45MCA9PiBjb3MoQXd6KSA+PSAwXG4gICAgICAgIGNvbnN0IHNpZ25ZYXcgPSBjb3Mocm9sbEFuZ2xlKSA+PSAwID8gMSA6IC0xO1xuICAgICAgICAvLyBlc3RpbWF0ZSB5YXcgc2luY2UgdmVjdG9yIGlzIG5vcm1hbGl6ZWRcbiAgICAgICAgZ3lyb0VzdGltYXRlWzJdID0gc2lnbllhdyAqIHNxcnQoMSAtIHBvdyhneXJvRXN0aW1hdGVbMF0sIDIpIC0gcG93KGd5cm9Fc3RpbWF0ZVsxXSwgMikpO1xuICAgICAgfVxuXG4gICAgICAvLyBpbnRlcnBvbGF0ZSBiZXR3ZWVuIGVzdGltYXRlZCB2YWx1ZXMgYW5kIHJhdyB2YWx1ZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgICBhY2NFc3RpbWF0ZVtpXSA9IGd5cm9Fc3RpbWF0ZVtpXSAqIGsgKyBhY2NWZWN0b3JbaV0gKiAoMSAtIGspO1xuXG4gICAgICBub3JtYWxpemUoYWNjRXN0aW1hdGUpO1xuICAgIH1cblxuICAgIG91dHB1dFswXSA9IGFjY0VzdGltYXRlWzBdO1xuICAgIG91dHB1dFsxXSA9IGFjY0VzdGltYXRlWzFdO1xuICAgIG91dHB1dFsyXSA9IGFjY0VzdGltYXRlWzJdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9yaWVudGF0aW9uO1xuIl19