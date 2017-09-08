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

var parameters = {
  k: {
    type: 'float',
    default: 0.98,
    min: 0,
    max: 1,
    step: 0.01
  }
  // debug: {
  //   type: 'boolean'
  // }
};

var toDeg = 180 / Math.PI;

/**
 * Input frame.data should ahve the following structure:
 *
 * - index 0 => rotationRate.alpha (yaw, rotation around z axis)
 * - index 1 => rotationRate.beta (pitch, rotation around x axis)
 * - index 2 => rotationRate.gamma (roll, rotation around y axis)
 * - index 3 => accelerationIncludingGravity.x
 * - index 4 => accelerationIncludingGravity.y
 * - index 5 => accelerationIncludingGravity.z
 */

var ComplementaryFilter = function (_BaseLfo) {
  (0, _inherits3.default)(ComplementaryFilter, _BaseLfo);

  function ComplementaryFilter(options) {
    (0, _classCallCheck3.default)(this, ComplementaryFilter);
    return (0, _possibleConstructorReturn3.default)(this, (ComplementaryFilter.__proto__ || (0, _getPrototypeOf2.default)(ComplementaryFilter)).call(this, parameters, options));
  }

  (0, _createClass3.default)(ComplementaryFilter, [{
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      // this.streamParams.frameSize = 3;
      // for debug
      this.streamParams.frameSize = 3 + 2 + 2;

      this.yaw = 0;
      this.pitch = 0;
      this.roll = 0;

      this.lastTime = null;

      this.propagateStreamParams();
    }

    // assume gyr data is index 0 to 2 [alpha, beta, gamma]
    // and acc data is index 3 to 5 [x, y, z]

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      if (!this.lastTime) {
        this.lastTime = frame.time;
        // this.yaw = frame.data[6]; // init with compass value
        return;
      }

      var input = frame.data;
      var output = this.frame.data;
      // @todo - define if we should calculate this or use logical period
      // aka `MotionEvent.interval`
      var dt = input[7] / 1000;
      // console.log(dt);
      var k = this.params.get('k');
      var orientationYaw = input[6];

      this.yaw += input[0] * dt;
      this.pitch += input[1] * dt;
      this.roll += input[2] * dt;

      // debug
      output[3] += input[1] * dt; // not corrected pitch integration
      output[4] += input[2] * dt; // not corrected yaw integration

      // cannot be rectified...
      var offset = 3;
      var pitchAcc = Math.atan2(input[1 + offset], input[2 + offset]) * toDeg;
      var rollAcc = -Math.atan2(input[0 + offset], input[2 + offset]) * toDeg;

      output[5] = pitchAcc; // not corrected pitch integration
      output[6] = rollAcc; // not corrected roll integration

      // ponderate gyro estimation with acceleration mesurements
      this.pitch = this.pitch * k + pitchAcc * (1 - k);
      this.roll = this.roll * k + rollAcc * (1 - k);

      output[0] = this.yaw;
      output[1] = this.pitch;
      output[2] = this.roll;
    }
  }]);
  return ComplementaryFilter;
}(_core.BaseLfo);

exports.default = ComplementaryFilter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBsZW1lbnRhcnlGaWx0ZXIuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsImsiLCJ0eXBlIiwiZGVmYXVsdCIsIm1pbiIsIm1heCIsInN0ZXAiLCJ0b0RlZyIsIk1hdGgiLCJQSSIsIkNvbXBsZW1lbnRhcnlGaWx0ZXIiLCJvcHRpb25zIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVNpemUiLCJ5YXciLCJwaXRjaCIsInJvbGwiLCJsYXN0VGltZSIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwidGltZSIsImlucHV0IiwiZGF0YSIsIm91dHB1dCIsImR0IiwicGFyYW1zIiwiZ2V0Iiwib3JpZW50YXRpb25ZYXciLCJvZmZzZXQiLCJwaXRjaEFjYyIsImF0YW4yIiwicm9sbEFjYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUVBLElBQU1BLGFBQWE7QUFDakJDLEtBQUc7QUFDREMsVUFBTSxPQURMO0FBRURDLGFBQVMsSUFGUjtBQUdEQyxTQUFLLENBSEo7QUFJREMsU0FBSyxDQUpKO0FBS0RDLFVBQU07QUFMTDtBQU9IO0FBQ0E7QUFDQTtBQVZpQixDQUFuQjs7QUFhQSxJQUFNQyxRQUFRLE1BQU1DLEtBQUtDLEVBQXpCOztBQUVBOzs7Ozs7Ozs7OztJQVVNQyxtQjs7O0FBQ0osK0JBQVlDLE9BQVosRUFBcUI7QUFBQTtBQUFBLDJKQUNiWCxVQURhLEVBQ0RXLE9BREM7QUFFcEI7Ozs7d0NBRW1CQyxnQixFQUFrQjtBQUNwQyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBO0FBQ0E7QUFDQSxXQUFLRSxZQUFMLENBQWtCQyxTQUFsQixHQUE4QixJQUFJLENBQUosR0FBUSxDQUF0Qzs7QUFFQSxXQUFLQyxHQUFMLEdBQVcsQ0FBWDtBQUNBLFdBQUtDLEtBQUwsR0FBYSxDQUFiO0FBQ0EsV0FBS0MsSUFBTCxHQUFZLENBQVo7O0FBRUEsV0FBS0MsUUFBTCxHQUFnQixJQUFoQjs7QUFFQSxXQUFLQyxxQkFBTDtBQUNEOztBQUVEO0FBQ0E7Ozs7a0NBQ2NDLEssRUFBTztBQUNuQixVQUFJLENBQUMsS0FBS0YsUUFBVixFQUFvQjtBQUNsQixhQUFLQSxRQUFMLEdBQWdCRSxNQUFNQyxJQUF0QjtBQUNBO0FBQ0E7QUFDRDs7QUFFRCxVQUFNQyxRQUFRRixNQUFNRyxJQUFwQjtBQUNBLFVBQU1DLFNBQVMsS0FBS0osS0FBTCxDQUFXRyxJQUExQjtBQUNBO0FBQ0E7QUFDQSxVQUFNRSxLQUFLSCxNQUFNLENBQU4sSUFBVyxJQUF0QjtBQUNBO0FBQ0EsVUFBTXRCLElBQUksS0FBSzBCLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixHQUFoQixDQUFWO0FBQ0EsVUFBTUMsaUJBQWlCTixNQUFNLENBQU4sQ0FBdkI7O0FBRUEsV0FBS1AsR0FBTCxJQUFZTyxNQUFNLENBQU4sSUFBV0csRUFBdkI7QUFDQSxXQUFLVCxLQUFMLElBQWNNLE1BQU0sQ0FBTixJQUFXRyxFQUF6QjtBQUNBLFdBQUtSLElBQUwsSUFBYUssTUFBTSxDQUFOLElBQVdHLEVBQXhCOztBQUVBO0FBQ0FELGFBQU8sQ0FBUCxLQUFhRixNQUFNLENBQU4sSUFBV0csRUFBeEIsQ0FyQm1CLENBcUJTO0FBQzVCRCxhQUFPLENBQVAsS0FBYUYsTUFBTSxDQUFOLElBQVdHLEVBQXhCLENBdEJtQixDQXNCUzs7QUFFNUI7QUFDQSxVQUFNSSxTQUFTLENBQWY7QUFDQSxVQUFNQyxXQUFXdkIsS0FBS3dCLEtBQUwsQ0FBV1QsTUFBTSxJQUFJTyxNQUFWLENBQVgsRUFBOEJQLE1BQU0sSUFBSU8sTUFBVixDQUE5QixJQUFtRHZCLEtBQXBFO0FBQ0EsVUFBTTBCLFVBQVUsQ0FBRXpCLEtBQUt3QixLQUFMLENBQVdULE1BQU0sSUFBSU8sTUFBVixDQUFYLEVBQThCUCxNQUFNLElBQUlPLE1BQVYsQ0FBOUIsQ0FBRixHQUFxRHZCLEtBQXJFOztBQUVBa0IsYUFBTyxDQUFQLElBQVlNLFFBQVosQ0E3Qm1CLENBNkJHO0FBQ3RCTixhQUFPLENBQVAsSUFBWVEsT0FBWixDQTlCbUIsQ0E4Qkc7O0FBRXRCO0FBQ0EsV0FBS2hCLEtBQUwsR0FBYSxLQUFLQSxLQUFMLEdBQWFoQixDQUFiLEdBQWlCOEIsWUFBWSxJQUFJOUIsQ0FBaEIsQ0FBOUI7QUFDQSxXQUFLaUIsSUFBTCxHQUFZLEtBQUtBLElBQUwsR0FBWWpCLENBQVosR0FBZ0JnQyxXQUFXLElBQUloQyxDQUFmLENBQTVCOztBQUVBd0IsYUFBTyxDQUFQLElBQVksS0FBS1QsR0FBakI7QUFDQVMsYUFBTyxDQUFQLElBQVksS0FBS1IsS0FBakI7QUFDQVEsYUFBTyxDQUFQLElBQVksS0FBS1AsSUFBakI7QUFDRDs7Ozs7a0JBR1lSLG1CIiwiZmlsZSI6IkNvbXBsZW1lbnRhcnlGaWx0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBrOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBkZWZhdWx0OiAwLjk4LFxuICAgIG1pbjogMCxcbiAgICBtYXg6IDEsXG4gICAgc3RlcDogMC4wMSxcbiAgfSxcbiAgLy8gZGVidWc6IHtcbiAgLy8gICB0eXBlOiAnYm9vbGVhbidcbiAgLy8gfVxufTtcblxuY29uc3QgdG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXG4vKipcbiAqIElucHV0IGZyYW1lLmRhdGEgc2hvdWxkIGFodmUgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG4gKlxuICogLSBpbmRleCAwID0+IHJvdGF0aW9uUmF0ZS5hbHBoYSAoeWF3LCByb3RhdGlvbiBhcm91bmQgeiBheGlzKVxuICogLSBpbmRleCAxID0+IHJvdGF0aW9uUmF0ZS5iZXRhIChwaXRjaCwgcm90YXRpb24gYXJvdW5kIHggYXhpcylcbiAqIC0gaW5kZXggMiA9PiByb3RhdGlvblJhdGUuZ2FtbWEgKHJvbGwsIHJvdGF0aW9uIGFyb3VuZCB5IGF4aXMpXG4gKiAtIGluZGV4IDMgPT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS54XG4gKiAtIGluZGV4IDQgPT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS55XG4gKiAtIGluZGV4IDUgPT4gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS56XG4gKi9cbmNsYXNzIENvbXBsZW1lbnRhcnlGaWx0ZXIgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuICB9XG5cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgLy8gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMztcbiAgICAvLyBmb3IgZGVidWdcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAzICsgMiArIDI7XG5cbiAgICB0aGlzLnlhdyA9IDA7XG4gICAgdGhpcy5waXRjaCA9IDA7XG4gICAgdGhpcy5yb2xsID0gMDtcblxuICAgIHRoaXMubGFzdFRpbWUgPSBudWxsO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8vIGFzc3VtZSBneXIgZGF0YSBpcyBpbmRleCAwIHRvIDIgW2FscGhhLCBiZXRhLCBnYW1tYV1cbiAgLy8gYW5kIGFjYyBkYXRhIGlzIGluZGV4IDMgdG8gNSBbeCwgeSwgel1cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGlmICghdGhpcy5sYXN0VGltZSkge1xuICAgICAgdGhpcy5sYXN0VGltZSA9IGZyYW1lLnRpbWU7XG4gICAgICAvLyB0aGlzLnlhdyA9IGZyYW1lLmRhdGFbNl07IC8vIGluaXQgd2l0aCBjb21wYXNzIHZhbHVlXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW5wdXQgPSBmcmFtZS5kYXRhO1xuICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuZnJhbWUuZGF0YTtcbiAgICAvLyBAdG9kbyAtIGRlZmluZSBpZiB3ZSBzaG91bGQgY2FsY3VsYXRlIHRoaXMgb3IgdXNlIGxvZ2ljYWwgcGVyaW9kXG4gICAgLy8gYWthIGBNb3Rpb25FdmVudC5pbnRlcnZhbGBcbiAgICBjb25zdCBkdCA9IGlucHV0WzddIC8gMTAwMDtcbiAgICAvLyBjb25zb2xlLmxvZyhkdCk7XG4gICAgY29uc3QgayA9IHRoaXMucGFyYW1zLmdldCgnaycpO1xuICAgIGNvbnN0IG9yaWVudGF0aW9uWWF3ID0gaW5wdXRbNl07XG5cbiAgICB0aGlzLnlhdyArPSBpbnB1dFswXSAqIGR0O1xuICAgIHRoaXMucGl0Y2ggKz0gaW5wdXRbMV0gKiBkdDtcbiAgICB0aGlzLnJvbGwgKz0gaW5wdXRbMl0gKiBkdDtcblxuICAgIC8vIGRlYnVnXG4gICAgb3V0cHV0WzNdICs9IGlucHV0WzFdICogZHQ7IC8vIG5vdCBjb3JyZWN0ZWQgcGl0Y2ggaW50ZWdyYXRpb25cbiAgICBvdXRwdXRbNF0gKz0gaW5wdXRbMl0gKiBkdDsgLy8gbm90IGNvcnJlY3RlZCB5YXcgaW50ZWdyYXRpb25cblxuICAgIC8vIGNhbm5vdCBiZSByZWN0aWZpZWQuLi5cbiAgICBjb25zdCBvZmZzZXQgPSAzO1xuICAgIGNvbnN0IHBpdGNoQWNjID0gTWF0aC5hdGFuMihpbnB1dFsxICsgb2Zmc2V0XSwgaW5wdXRbMiArIG9mZnNldF0pICogdG9EZWc7XG4gICAgY29uc3Qgcm9sbEFjYyA9IC0gTWF0aC5hdGFuMihpbnB1dFswICsgb2Zmc2V0XSwgaW5wdXRbMiArIG9mZnNldF0pICogdG9EZWc7XG5cbiAgICBvdXRwdXRbNV0gPSBwaXRjaEFjYzsgLy8gbm90IGNvcnJlY3RlZCBwaXRjaCBpbnRlZ3JhdGlvblxuICAgIG91dHB1dFs2XSA9IHJvbGxBY2M7ICAvLyBub3QgY29ycmVjdGVkIHJvbGwgaW50ZWdyYXRpb25cblxuICAgIC8vIHBvbmRlcmF0ZSBneXJvIGVzdGltYXRpb24gd2l0aCBhY2NlbGVyYXRpb24gbWVzdXJlbWVudHNcbiAgICB0aGlzLnBpdGNoID0gdGhpcy5waXRjaCAqIGsgKyBwaXRjaEFjYyAqICgxIC0gayk7XG4gICAgdGhpcy5yb2xsID0gdGhpcy5yb2xsICogayArIHJvbGxBY2MgKiAoMSAtIGspO1xuXG4gICAgb3V0cHV0WzBdID0gdGhpcy55YXc7XG4gICAgb3V0cHV0WzFdID0gdGhpcy5waXRjaDtcbiAgICBvdXRwdXRbMl0gPSB0aGlzLnJvbGw7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcGxlbWVudGFyeUZpbHRlcjtcbiJdfQ==