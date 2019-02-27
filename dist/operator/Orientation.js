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

        // Rz is too small and because it is used as reference for computing Axz, Ayz
        // it's error fluctuations will amplify leading to bad results. In this case
        // skip the gyro data and just use previous estimate
        if (abs(accEstimate[2]) < 0.1) {
          // use input instead of estimation
          // accVector is already normalized
          for (var _i2 = 0; _i2 < 3; _i2++) {
            accEstimate[_i2] = accVector[_i2];
          }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiYWJzIiwiTWF0aCIsImF0YW4yIiwiY29zIiwic2luIiwic3FydCIsInBvdyIsInRhbiIsIm1heCIsInRvRGVnIiwiUEkiLCJ0b1JhZCIsIm5vcm1hbGl6ZSIsInYiLCJtYWciLCJwYXJhbWV0ZXJzIiwiayIsInR5cGUiLCJtaW4iLCJzdGVwIiwiZGVmYXVsdCIsIk9yaWVudGF0aW9uIiwib3B0aW9ucyIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVTaXplIiwiaW5pdCIsImxhc3RUaW1lIiwiaW50ZXJ2YWwiLCJhY2NWZWN0b3IiLCJGbG9hdDMyQXJyYXkiLCJneXJvVmVjdG9yIiwiZ3lyb0VzdGltYXRlIiwiYWNjRXN0aW1hdGUiLCJwcm9wYWdhdGVTdHJlYW1QYXJhbXMiLCJmcmFtZSIsInRpbWUiLCJpbnB1dCIsImRhdGEiLCJvdXRwdXQiLCJwYXJhbXMiLCJnZXQiLCJhY2NPZmZzZXQiLCJneXJvT2Zmc2V0IiwiaSIsImR0Iiwicm9sbERlbHRhIiwicm9sbEFuZ2xlIiwicGl0Y2hEZWx0YSIsInBpdGNoQW5nbGUiLCJzaWduWWF3IiwiZ3lyb0VzdGltYXRlU3F1YXJlZCIsIkJhc2VMZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFFQTtBQUNBLElBQU1BLE1BQU1DLEtBQUtELEdBQWpCO0FBQ0EsSUFBTUUsUUFBUUQsS0FBS0MsS0FBbkI7QUFDQSxJQUFNQyxNQUFNRixLQUFLRSxHQUFqQjtBQUNBLElBQU1DLE1BQU1ILEtBQUtHLEdBQWpCO0FBQ0EsSUFBTUMsT0FBT0osS0FBS0ksSUFBbEI7QUFDQSxJQUFNQyxNQUFNTCxLQUFLSyxHQUFqQjtBQUNBLElBQU1DLE1BQU1OLEtBQUtNLEdBQWpCO0FBQ0EsSUFBTUMsTUFBTVAsS0FBS08sR0FBakI7O0FBRUEsSUFBTUMsUUFBUSxNQUFNUixL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QWxCLEdBQXNCLENBQXRCLEdBQTBCLENBQUMsQ0FBM0M7O0FBRUE7QUFDQSxZQUFNSSxzQkFBc0I5QyxJQUFJMkIsYUFBYSxDQUFiLENBQUosRUFBcUIsQ0FBckIsSUFBMEIzQixJQUFJMkIsYUFBYSxDQUFiLENBQUosRUFBcUIsQ0FBckIsQ0FBdEQ7O0FBRUFBLHFCQUFhLENBQWIsSUFBa0JrQixVQUFVOUMsS0FBS0csSUFBSSxDQUFKLEVBQU8sSUFBSTRDLG1CQUFYLENBQUwsQ0FBNUI7O0FBRUE7QUFDQSxhQUFLLElBQUlQLEtBQUksQ0FBYixFQUFnQkEsS0FBSSxDQUFwQixFQUF1QkEsSUFBdkIsRUFBNEI7QUFDMUJYLHNCQUFZVyxFQUFaLElBQWlCWixhQUFhWSxFQUFiLElBQWtCN0IsQ0FBbEIsR0FBc0JjLFVBQVVlLEVBQVYsS0FBZ0IsSUFBSTdCLENBQXBCLENBQXZDO0FBQ0Q7O0FBRURKLGtCQUFVc0IsV0FBVjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFJbEMsSUFBSWtDLFlBQVksQ0FBWixDQUFKLElBQXNCLEdBQTFCLEVBQStCO0FBQzdCO0FBQ0E7QUFDQSxlQUFJLElBQUlXLE1BQUksQ0FBWixFQUFlQSxNQUFHLENBQWxCLEVBQXFCQSxLQUFyQixFQUEwQjtBQUN4Qlgsd0JBQVlXLEdBQVosSUFBaUJmLFVBQVVlLEdBQVYsQ0FBakI7QUFDRDtBQUNGO0FBRUY7QUFDREwsYUFBTyxDQUFQLElBQVlOLFlBQVksQ0FBWixDQUFaO0FBQ0FNLGFBQU8sQ0FBUCxJQUFZTixZQUFZLENBQVosQ0FBWjtBQUNBTSxhQUFPLENBQVAsSUFBWU4sWUFBWSxDQUFaLENBQVo7QUFDRDs7O0VBdkh1Qm1CLGE7O2tCQTBIWGhDLFciLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VMZm8gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5cbi8vIHBvcnQgb2Ygb3JpZW50YXRpb24uY3BwIE1heCBvYmplY3RcbmNvbnN0IGFicyA9IE1hdGguYWJzO1xuY29uc3QgYXRhbjIgPSBNYXRoLmF0YW4yO1xuY29uc3QgY29zID0gTWF0aC5jb3M7XG5jb25zdCBzaW4gPSBNYXRoLnNpbjtcbmNvbnN0IHNxcnQgPSBNYXRoLnNxcnQ7XG5jb25zdCBwb3cgPSBNYXRoLnBvdztcbmNvbnN0IHRhbiA9IE1hdGgudGFuO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5cbmNvbnN0IHRvRGVnID0gMTgwIC8gTWF0aC5QSTtcbmNvbnN0IHRvUmFkID0gTWF0aC5QSSAvIDE4MDtcblxuZnVuY3Rpb24gbm9ybWFsaXplKHYpIHtcbiAgY29uc3QgbWFnID0gc3FydCh2WzBdICogdlswXSArIHZbMV0gKiB2WzFdICsgdlsyXSAqIHZbMl0pO1xuXG4gIGlmIChtYWcgPiAwKSB7XG4gICAgdlswXSAvPSBtYWc7XG4gICAgdlsxXSAvPSBtYWc7XG4gICAgdlsyXSAvPSBtYWc7XG4gIH1cblxuICByZXR1cm4gdjtcbn1cblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgazoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogMSxcbiAgICBzdGVwOiAwLjAxLFxuICAgIGRlZmF1bHQ6IDAuOSxcbiAgfSxcbn07XG5cbi8qKlxuICogRmlsdGVyIHRoYXQgaW50ZWdyYXRlIGd5cm9zc2NvcGUgYW5kIGFjY2VsZXJhdGlvbiBpbiBvcmRlciB0byByZW1vdmUgbm9pc2VcbiAqIGZyb20gYWNjZWxlcm9tZXRlcnMgZGF0YSB3aGlsZSBrZWVwaW5nIGEgZ29vZCByZWFjdGl2aXR5LlxuICogVGhlIGZpbHRlciBvdXB1dHMgYSBub3JtYWxpemVkIHByb2plY3Rpb24gdmVjdG9yLlxuICogQmUgYXdhcmUgdGhhdCB0aGUgb3V0IG9mIHRoZSBmaWx0ZXIgaW52ZXJ0IHRoZSB4IGFuZCB6IGluIHJlZ2FyZCBvZiB0aGVcbiAqIGRldmljZSBtb3Rpb24gc3BlY2lmaWNhdGlvbiAobGVmdC1oYW5kIGF4aXMpLiBUaGlzIGlzIGRvbmUgZm9yIGNvbXBhdGliaWxpdHlcbiAqIHdpdGggdGhlIFItaW9UIHNlbnNvci5cbiAqXG4gKiBAbWVtYmVyb2Ygb3BlcmF0b3JcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLms9MC45XSAtIFJhdGlvIGJldHdlZW4gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKiAgMSBtZWFucyBneXJvc2NvcGUgb25seVxuICogIDAgbWVhbiBhY2NlbGVyb21ldGVycyBvbmx5ICh0aGlzIGlzIGVxdWl2YWxlbnQgdG8gYSBsb3dwYXNzIGZpbHRlcilcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jbGllbnQnO1xuICogaW1wb3J0ICogYXMgbGZvTW90aW9uIGZyb20gJ2xmby1tb3Rpb24nO1xuICpcbiAqIGNvbnN0IG1vdGlvbklucHV0ID0gbmV3IGxmb01vdGlvbi5zb3VyY2UuTW90aW9uSW5wdXQoKTtcbiAqIGNvbnN0IHNhbXBsZXIgPSBuZXcgbGZvTW90aW9uLm9wZXJhdG9yLlNhbXBsZXIoeyBmcmFtZVJhdGU6IDUwIH0pO1xuICogY29uc3Qgb3JpZW50YXRpb24gPSBuZXcgbGZvTW90aW9uLm9wZXJhdG9yLk9yaWVudGF0aW9uKCk7XG4gKiBjb25zdCBsb2dnZXIgPSBuZXcgbGZvLnNpbmsuTG9nZ2VyKHsgZGF0YTogdHJ1ZSB9KTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5jb25uZWN0KHNhbXBsZXIpO1xuICogc2FtcGxlci5jb25uZWN0KG9yaWVudGF0aW9uKTtcbiAqIG9yaWVudGF0aW9uLmNvbm5lY3QobG9nZ2VyKTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5pbml0KCkudGhlbigoKSA9PiBtb3Rpb25JbnB1dC5zdGFydCgpKVxuICovXG5jbGFzcyBPcmllbnRhdGlvbiBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMztcblxuICAgIHRoaXMuaW5pdCA9IGZhbHNlO1xuICAgIHRoaXMubGFzdFRpbWUgPSAwO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSAwO1xuICAgIC8vIHRoaXMuayA9IDAuOTtcblxuICAgIC8vIG5vcm1hbGl6ZWQgYWNjZWxlcmF0aW9uIHZlY3RvclxuICAgIC8vIGNvb3JkaW5hdGVzIGFyZSBmbGlwcGVkIHRvIG1hdGNoIFItaW9UIGNvb3JkcyBzeXN0ZW1cbiAgICB0aGlzLmFjY1ZlY3RvciA9IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgLy8gbm9ybWFsaXplIGd5cm8gb3JkZXIgYW5kIGRpcmVjdGlvbiBhY2NvcmRpbmcgdG8gUi1pb1RcbiAgICB0aGlzLmd5cm9WZWN0b3IgPSBuZXcgRmxvYXQzMkFycmF5KDMpOyAvLyB0aGlyZCBjb21wb25lbnQgKHlhdykgd2lsbCBuZXZlciBiZSB1c2VkXG4gICAgLy8gc2FtZSBhcyBiZWZvcmUgYXMgYSBwcm9qZWN0aW9uIHZlY3RvclxuICAgIHRoaXMuZ3lyb0VzdGltYXRlID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAvLyBmaWx0ZXJlZCB2ZWN0b3JcbiAgICB0aGlzLmFjY0VzdGltYXRlID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcblxuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgdGltZSA9IGZyYW1lLnRpbWU7XG4gICAgY29uc3QgaW5wdXQgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICBjb25zdCBhY2NFc3RpbWF0ZSA9IHRoaXMuYWNjRXN0aW1hdGU7XG4gICAgY29uc3QgZ3lyb0VzdGltYXRlID0gdGhpcy5neXJvRXN0aW1hdGU7XG5cbiAgICBjb25zdCBrID0gdGhpcy5wYXJhbXMuZ2V0KCdrJyk7XG5cbiAgICAvKipcbiAgICAgKiBSZW9yZGVyIGFjY2VsZXJvbWV0ZXIgYW5kIGd5cm8gdG8gY29uZm9ybSB0byBSLWlvVFxuICAgICAqIGNvb3JkaW5hdGUgc3lzdGVtIGFuZCBneXJvIGRpcmVjdGlvbnNcbiAgICAgKi9cbiAgICBjb25zdCBhY2NWZWN0b3IgPSB0aGlzLmFjY1ZlY3RvcjtcbiAgICBjb25zdCBhY2NPZmZzZXQgPSAwO1xuICAgIGFjY1ZlY3RvclswXSA9IC0xICogaW5wdXRbMCArIGFjY09mZnNldF07XG4gICAgYWNjVmVjdG9yWzFdID0gIDEgKiBpbnB1dFsxICsgYWNjT2Zmc2V0XTtcbiAgICBhY2NWZWN0b3JbMl0gPSAtMSAqIGlucHV0WzIgKyBhY2NPZmZzZXRdO1xuXG4gICAgY29uc3QgZ3lyb1ZlY3RvciA9IHRoaXMuZ3lyb1ZlY3RvcjtcbiAgICBjb25zdCBneXJvT2Zmc2V0ID0gMztcbiAgICBneXJvVmVjdG9yWzBdID0gLTEgKiBpbnB1dFsyICsgZ3lyb09mZnNldF07XG4gICAgZ3lyb1ZlY3RvclsxXSA9IC0xICogaW5wdXRbMSArIGd5cm9PZmZzZXRdO1xuICAgIGd5cm9WZWN0b3JbMl0gPSAtMSAqIGlucHV0WzAgKyBneXJvT2Zmc2V0XTtcblxuICAgIG5vcm1hbGl6ZShhY2NWZWN0b3IpO1xuXG4gICAgaWYgKCF0aGlzLmxhc3RUaW1lKSB7XG4gICAgICB0aGlzLmxhc3RUaW1lID0gdGltZTtcbiAgICAgIC8vIGluaXRpYWxpemUgY29ycmVjdGVkIG9yaWVudGF0aW9uIHdpdGggbm9ybWFsaXplZCBhY2NlbGVyb21ldGVyIGRhdGFcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKVxuICAgICAgICBhY2NFc3RpbWF0ZVtpXSA9IGFjY1ZlY3RvcltpXTtcblxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkZWZpbmUgaWYgd2UgdXNlIHRoYXQgb3IgdXNlIHRoZSBsb2dpY2FsIGBNb3Rpb25FdmVudC5pbnRlcnZhbGBcbiAgICAgIGNvbnN0IGR0ID0gdGltZSAtIHRoaXMubGFzdFRpbWU7XG5cbiAgICAgIHRoaXMubGFzdFRpbWUgPSB0aW1lO1xuXG4gICAgICAvLyBpbnRlZ3JhdGUgYW5nbGUgZnJvbSBneXJvIGN1cnJlbnQgdmFsdWVzIGFuZCBsYXN0IHJlc3VsdFxuICAgICAgLy8gZ2V0IGFuZ2xlcyBiZXR3ZWVuIHByb2plY3Rpb24gb2YgUiBvbiBaWC9aWSBwbGFuZSBhbmQgWiBheGlzLCBiYXNlZCBvbiBsYXN0IGFjY0VzdGltYXRlXG5cbiAgICAgIC8vIGd5cm9WZWN0b3IgaW4gZGVnL3MsIGRlbHRhIGFuZCBhbmdsZSBpbiByYWRcbiAgICAgIGNvbnN0IHJvbGxEZWx0YSA9IGd5cm9WZWN0b3JbMF0gKiBkdCAqIHRvUmFkO1xuICAgICAgY29uc3Qgcm9sbEFuZ2xlID0gYXRhbjIoYWNjRXN0aW1hdGVbMF0sIGFjY0VzdGltYXRlWzJdKSArIHJvbGxEZWx0YTtcblxuICAgICAgY29uc3QgcGl0Y2hEZWx0YSA9IGd5cm9WZWN0b3JbMV0gKiBkdCAqIHRvUmFkO1xuICAgICAgY29uc3QgcGl0Y2hBbmdsZSA9IGF0YW4yKGFjY0VzdGltYXRlWzFdLCBhY2NFc3RpbWF0ZVsyXSkgKyBwaXRjaERlbHRhO1xuXG4gICAgICAvLyBjYWxjdWxhdGUgcHJvamVjdGlvbiB2ZWN0b3IgZnJvbSBhbmdsZSBFc3RpbWF0ZXNcbiAgICAgIGd5cm9Fc3RpbWF0ZVswXSA9IHNpbihyb2xsQW5nbGUpO1xuICAgICAgZ3lyb0VzdGltYXRlWzBdIC89IHNxcnQoMSArIHBvdyhjb3Mocm9sbEFuZ2xlKSwgMikgKiBwb3codGFuKHBpdGNoQW5nbGUpLCAyKSk7XG5cbiAgICAgIGd5cm9Fc3RpbWF0ZVsxXSA9IHNpbihwaXRjaEFuZ2xlKTtcbiAgICAgIGd5cm9Fc3RpbWF0ZVsxXSAvPSBzcXJ0KDEgKyBwb3coY29zKHBpdGNoQW5nbGUpLCAyKSAqIHBvdyh0YW4ocm9sbEFuZ2xlKSwgMikpO1xuXG4gICAgICAvLyBlc3RpbWF0ZSBzaWduIG9mIFJ6R3lybyBieSBsb29raW5nIGluIHdoYXQgcXVkcmFudCB0aGUgYW5nbGUgQXh6IGlzLFxuICAgICAgLy8gUnpHeXJvIGlzIHBvc2l0aXZlIGlmICBBeHogaW4gcmFuZ2UgLTkwIC4uOTAgPT4gY29zKEF3eikgPj0gMFxuICAgICAgY29uc3Qgc2lnbllhdyA9IGNvcyhyb2xsQW5nbGUpID49IDAgPyAxIDogLTE7XG5cbiAgICAgIC8vIGVzdGltYXRlIHlhdyBzaW5jZSB2ZWN0b3IgaXMgbm9ybWFsaXplZFxuICAgICAgY29uc3QgZ3lyb0VzdGltYXRlU3F1YXJlZCA9IHBvdyhneXJvRXN0aW1hdGVbMF0sIDIpICsgcG93KGd5cm9Fc3RpbWF0ZVsxXSwgMik7XG5cbiAgICAgIGd5cm9Fc3RpbWF0ZVsyXSA9IHNpZ25ZYXcgKiBzcXJ0KG1heCgwLCAxIC0gZ3lyb0VzdGltYXRlU3F1YXJlZCkpO1xuXG4gICAgICAvLyBpbnRlcnBvbGF0ZSBiZXR3ZWVuIGVzdGltYXRlZCB2YWx1ZXMgYW5kIHJhdyB2YWx1ZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGFjY0VzdGltYXRlW2ldID0gZ3lyb0VzdGltYXRlW2ldICogayArIGFjY1ZlY3RvcltpXSAqICgxIC0gayk7XG4gICAgICB9XG5cbiAgICAgIG5vcm1hbGl6ZShhY2NFc3RpbWF0ZSk7XG5cbiAgICAgIC8vIFJ6IGlzIHRvbyBzbWFsbCBhbmQgYmVjYXVzZSBpdCBpcyB1c2VkIGFzIHJlZmVyZW5jZSBmb3IgY29tcHV0aW5nIEF4eiwgQXl6XG4gICAgICAvLyBpdCdzIGVycm9yIGZsdWN0dWF0aW9ucyB3aWxsIGFtcGxpZnkgbGVhZGluZyB0byBiYWQgcmVzdWx0cy4gSW4gdGhpcyBjYXNlXG4gICAgICAvLyBza2lwIHRoZSBneXJvIGRhdGEgYW5kIGp1c3QgdXNlIHByZXZpb3VzIGVzdGltYXRlXG4gICAgICBpZiAoYWJzKGFjY0VzdGltYXRlWzJdKSA8IDAuMSkge1xuICAgICAgICAvLyB1c2UgaW5wdXQgaW5zdGVhZCBvZiBlc3RpbWF0aW9uXG4gICAgICAgIC8vIGFjY1ZlY3RvciBpcyBhbHJlYWR5IG5vcm1hbGl6ZWRcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaTwgMzsgaSsrKSB7XG4gICAgICAgICAgYWNjRXN0aW1hdGVbaV0gPSBhY2NWZWN0b3JbaV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH1cbiAgICBvdXRwdXRbMF0gPSBhY2NFc3RpbWF0ZVswXTtcbiAgICBvdXRwdXRbMV0gPSBhY2NFc3RpbWF0ZVsxXTtcbiAgICBvdXRwdXRbMl0gPSBhY2NFc3RpbWF0ZVsyXTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBPcmllbnRhdGlvbjtcbiJdfQ==