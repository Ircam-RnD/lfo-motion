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
  onThreshold: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.005
  },
  offThreshold: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.0001
  },
  offDelay: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 200
  }

  /**
   * Simple switch control using intensity input to output sparse frames
   * of length 1, containing either 1 (start moving) or 0 (stop moving).
   * The detection is based on a schmitt trigger system, and also features
   * a timeout duration allowing to go below the low threshold for a certain
   * amount of time without sending the 0 value.
   *
   * @param {Object} options - Override default options.
   * @param {Number} onThreshold - The threshold above which moving starts.
   * @param {Number} offThreshold - The threshold below which moving stops.
   * @param {Number} offDelay - The allowed duration to go below the low threshold without sending .
   */
};
var StillAutoTrigger = function (_lfo$BaseLfo) {
  (0, _inherits3.default)(StillAutoTrigger, _lfo$BaseLfo);

  function StillAutoTrigger() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, StillAutoTrigger);

    var _this = (0, _possibleConstructorReturn3.default)(this, (StillAutoTrigger.__proto__ || (0, _getPrototypeOf2.default)(StillAutoTrigger)).call(this, parameters, options));

    _this.isMoving = false;
    _this.timeoutId = null;

    _this._stop = _this._stop.bind(_this);
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(StillAutoTrigger, [{
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      this.streamParams.frameRate = undefined;
      this.streamParams.frameSize = 1;

      this.propagateStreamParams();
    }

    /** @private */

  }, {
    key: 'processFrame',
    value: function processFrame(frame) {
      this.prepareFrame();
      this.processFunction(frame);
    }

    /** @private */

  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var value = frame.data[0];

      if (value > this.params.get('onThreshold') && !this.isMoving) {
        this.isMoving = true;

        if (this.timeoutId !== null) {
          this._start(frame);
        }
      } else if (value < this.params.get('offThreshold') && this.isMoving) {
        this.isMoving = false; // keep this out of the timeout

        if (this.timeoutId === null) {
          this.timeoutId = setTimeout(this._stop, this.params.get('offDelay'), frame.time);
        }
      }
    }

    /** @private */

  }, {
    key: '_start',
    value: function _start(frame) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;

      this.frame.time = frame.time;
      this.frame.data[0] = 1;
      this.propagateFrame();
    }

    /** @private */

  }, {
    key: '_stop',
    value: function _stop(timeoutDate) {
      this.frame.time = timeoutDate + this.params.get('offDelay') * 0.001;
      this.frame.data[0] = 0;
      this.propagateFrame();
    }
  }]);
  return StillAutoTrigger;
}(lfo.BaseLfo);

exports.default = StillAutoTrigger;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm9uVGhyZXNob2xkIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsIm9mZlRocmVzaG9sZCIsIm9mZkRlbGF5IiwiU3RpbGxBdXRvVHJpZ2dlciIsIm9wdGlvbnMiLCJpc01vdmluZyIsInRpbWVvdXRJZCIsIl9zdG9wIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwidW5kZWZpbmVkIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJ2YWx1ZSIsImRhdGEiLCJwYXJhbXMiLCJnZXQiLCJfc3RhcnQiLCJzZXRUaW1lb3V0IiwidGltZSIsImNsZWFyVGltZW91dCIsInByb3BhZ2F0ZUZyYW1lIiwidGltZW91dERhdGUiLCJsZm8iLCJCYXNlTGZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsZUFBYTtBQUNYQyxVQUFNLE9BREs7QUFFWEMsU0FBSyxDQUZNO0FBR1hDLFNBQUssQ0FBQ0MsUUFISztBQUlYQyxhQUFTO0FBSkUsR0FESTtBQU9qQkMsZ0JBQWM7QUFDWkwsVUFBTSxPQURNO0FBRVpDLFNBQUssQ0FGTztBQUdaQyxTQUFLLENBQUNDLFFBSE07QUFJWkMsYUFBUztBQUpHLEdBUEc7QUFhakJFLFlBQVU7QUFDUk4sVUFBTSxPQURFO0FBRVJDLFNBQUssQ0FGRztBQUdSQyxTQUFLLENBQUNDLFFBSEU7QUFJUkMsYUFBUztBQUpEOztBQVFaOzs7Ozs7Ozs7Ozs7QUFyQm1CLENBQW5CO0lBaUNNRyxnQjs7O0FBQ0osOEJBQTBCO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQUE7O0FBQUEsMEpBQ2xCVixVQURrQixFQUNOVSxPQURNOztBQUd4QixVQUFLQyxRQUFMLEdBQWdCLEtBQWhCO0FBQ0EsVUFBS0MsU0FBTCxHQUFpQixJQUFqQjs7QUFFQSxVQUFLQyxLQUFMLEdBQWEsTUFBS0EsS0FBTCxDQUFXQyxJQUFYLE9BQWI7QUFOd0I7QUFPekI7O0FBRUQ7Ozs7O3dDQUNvQkMsZ0IsRUFBa0I7QUFDcEMsV0FBS0MsbUJBQUwsQ0FBeUJELGdCQUF6Qjs7QUFFQSxXQUFLRSxZQUFMLENBQWtCQyxTQUFsQixHQUE4QkMsU0FBOUI7QUFDQSxXQUFLRixZQUFMLENBQWtCRyxTQUFsQixHQUE4QixDQUE5Qjs7QUFFQSxXQUFLQyxxQkFBTDtBQUNEOztBQUVEOzs7O2lDQUNhQyxLLEVBQU87QUFDbEIsV0FBS0MsWUFBTDtBQUNBLFdBQUtDLGVBQUwsQ0FBcUJGLEtBQXJCO0FBQ0Q7O0FBRUQ7Ozs7a0NBQ2NBLEssRUFBTztBQUNuQixVQUFNRyxRQUFRSCxNQUFNSSxJQUFOLENBQVcsQ0FBWCxDQUFkOztBQUVBLFVBQUlELFFBQVEsS0FBS0UsTUFBTCxDQUFZQyxHQUFaLENBQWdCLGFBQWhCLENBQVIsSUFBMEMsQ0FBQyxLQUFLakIsUUFBcEQsRUFBOEQ7QUFDNUQsYUFBS0EsUUFBTCxHQUFnQixJQUFoQjs7QUFFQSxZQUFJLEtBQUtDLFNBQUwsS0FBbUIsSUFBdkIsRUFBNkI7QUFDM0IsZUFBS2lCLE1BQUwsQ0FBWVAsS0FBWjtBQUNEO0FBQ0YsT0FORCxNQU1PLElBQUlHLFFBQVEsS0FBS0UsTUFBTCxDQUFZQyxHQUFaLENBQWdCLGNBQWhCLENBQVIsSUFBMkMsS0FBS2pCLFFBQXBELEVBQThEO0FBQ25FLGFBQUtBLFFBQUwsR0FBZ0IsS0FBaEIsQ0FEbUUsQ0FDNUM7O0FBRXZCLFlBQUksS0FBS0MsU0FBTCxLQUFtQixJQUF2QixFQUE2QjtBQUMzQixlQUFLQSxTQUFMLEdBQWlCa0IsV0FBVyxLQUFLakIsS0FBaEIsRUFBdUIsS0FBS2MsTUFBTCxDQUFZQyxHQUFaLENBQWdCLFVBQWhCLENBQXZCLEVBQW9ETixNQUFNUyxJQUExRCxDQUFqQjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7OzsyQkFDT1QsSyxFQUFPO0FBQ1pVLG1CQUFhLEtBQUtwQixTQUFsQjtBQUNBLFdBQUtBLFNBQUwsR0FBaUIsSUFBakI7O0FBRUEsV0FBS1UsS0FBTCxDQUFXUyxJQUFYLEdBQWtCVCxNQUFNUyxJQUF4QjtBQUNBLFdBQUtULEtBQUwsQ0FBV0ksSUFBWCxDQUFnQixDQUFoQixJQUFxQixDQUFyQjtBQUNBLFdBQUtPLGNBQUw7QUFDRDs7QUFFRDs7OzswQkFDTUMsVyxFQUFhO0FBQ2pCLFdBQUtaLEtBQUwsQ0FBV1MsSUFBWCxHQUFrQkcsY0FBYyxLQUFLUCxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsVUFBaEIsSUFBOEIsS0FBOUQ7QUFDQSxXQUFLTixLQUFMLENBQVdJLElBQVgsQ0FBZ0IsQ0FBaEIsSUFBcUIsQ0FBckI7QUFDQSxXQUFLTyxjQUFMO0FBQ0Q7OztFQTVENEJFLElBQUlDLE87O2tCQStEcEIzQixnQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgb25UaHJlc2hvbGQ6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjAwNSxcbiAgfSxcbiAgb2ZmVGhyZXNob2xkOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4wMDAxLFxuICB9LFxuICBvZmZEZWxheToge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDIwMCxcbiAgfSxcbn1cblxuLyoqXG4gKiBTaW1wbGUgc3dpdGNoIGNvbnRyb2wgdXNpbmcgaW50ZW5zaXR5IGlucHV0IHRvIG91dHB1dCBzcGFyc2UgZnJhbWVzXG4gKiBvZiBsZW5ndGggMSwgY29udGFpbmluZyBlaXRoZXIgMSAoc3RhcnQgbW92aW5nKSBvciAwIChzdG9wIG1vdmluZykuXG4gKiBUaGUgZGV0ZWN0aW9uIGlzIGJhc2VkIG9uIGEgc2NobWl0dCB0cmlnZ2VyIHN5c3RlbSwgYW5kIGFsc28gZmVhdHVyZXNcbiAqIGEgdGltZW91dCBkdXJhdGlvbiBhbGxvd2luZyB0byBnbyBiZWxvdyB0aGUgbG93IHRocmVzaG9sZCBmb3IgYSBjZXJ0YWluXG4gKiBhbW91bnQgb2YgdGltZSB3aXRob3V0IHNlbmRpbmcgdGhlIDAgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gb25UaHJlc2hvbGQgLSBUaGUgdGhyZXNob2xkIGFib3ZlIHdoaWNoIG1vdmluZyBzdGFydHMuXG4gKiBAcGFyYW0ge051bWJlcn0gb2ZmVGhyZXNob2xkIC0gVGhlIHRocmVzaG9sZCBiZWxvdyB3aGljaCBtb3Zpbmcgc3RvcHMuXG4gKiBAcGFyYW0ge051bWJlcn0gb2ZmRGVsYXkgLSBUaGUgYWxsb3dlZCBkdXJhdGlvbiB0byBnbyBiZWxvdyB0aGUgbG93IHRocmVzaG9sZCB3aXRob3V0IHNlbmRpbmcgLlxuICovXG5jbGFzcyBTdGlsbEF1dG9UcmlnZ2VyIGV4dGVuZHMgbGZvLkJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcblxuICAgIHRoaXMuaXNNb3ZpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG5cbiAgICB0aGlzLl9zdG9wID0gdGhpcy5fc3RvcC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAxO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgICB0aGlzLnByZXBhcmVGcmFtZSgpO1xuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgdmFsdWUgPSBmcmFtZS5kYXRhWzBdO1xuXG4gICAgaWYgKHZhbHVlID4gdGhpcy5wYXJhbXMuZ2V0KCdvblRocmVzaG9sZCcpICYmICF0aGlzLmlzTW92aW5nKSB7XG4gICAgICB0aGlzLmlzTW92aW5nID0gdHJ1ZTtcblxuICAgICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0KGZyYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHZhbHVlIDwgdGhpcy5wYXJhbXMuZ2V0KCdvZmZUaHJlc2hvbGQnKSAmJiB0aGlzLmlzTW92aW5nKSB7XG4gICAgICB0aGlzLmlzTW92aW5nID0gZmFsc2U7IC8vIGtlZXAgdGhpcyBvdXQgb2YgdGhlIHRpbWVvdXRcblxuICAgICAgaWYgKHRoaXMudGltZW91dElkID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dCh0aGlzLl9zdG9wLCB0aGlzLnBhcmFtcy5nZXQoJ29mZkRlbGF5JyksIGZyYW1lLnRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RhcnQoZnJhbWUpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcblxuICAgIHRoaXMuZnJhbWUudGltZSA9IGZyYW1lLnRpbWU7XG4gICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMTtcbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3N0b3AodGltZW91dERhdGUpIHtcbiAgICB0aGlzLmZyYW1lLnRpbWUgPSB0aW1lb3V0RGF0ZSArIHRoaXMucGFyYW1zLmdldCgnb2ZmRGVsYXknKSAqIDAuMDAxO1xuICAgIHRoaXMuZnJhbWUuZGF0YVswXSA9IDA7XG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0aWxsQXV0b1RyaWdnZXI7XG4iXX0=