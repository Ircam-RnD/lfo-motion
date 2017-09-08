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
    default: 0.5
  },
  offThreshold: {
    type: 'float',
    min: 0,
    max: +Infinity,
    default: 0.01
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
var StillAutoTrigger = function (_BaseLfo) {
  (0, _inherits3.default)(StillAutoTrigger, _BaseLfo);

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
        this._start(frame);
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
}(_core.BaseLfo);

exports.default = StillAutoTrigger;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm9uVGhyZXNob2xkIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsIm9mZlRocmVzaG9sZCIsIm9mZkRlbGF5IiwiU3RpbGxBdXRvVHJpZ2dlciIsIm9wdGlvbnMiLCJpc01vdmluZyIsInRpbWVvdXRJZCIsIl9zdG9wIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwidW5kZWZpbmVkIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJ2YWx1ZSIsImRhdGEiLCJwYXJhbXMiLCJnZXQiLCJfc3RhcnQiLCJzZXRUaW1lb3V0IiwidGltZSIsImNsZWFyVGltZW91dCIsInByb3BhZ2F0ZUZyYW1lIiwidGltZW91dERhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFFQSxJQUFNQSxhQUFhO0FBQ2pCQyxlQUFhO0FBQ1hDLFVBQU0sT0FESztBQUVYQyxTQUFLLENBRk07QUFHWEMsU0FBSyxDQUFDQyxRQUhLO0FBSVhDLGFBQVM7QUFKRSxHQURJO0FBT2pCQyxnQkFBYztBQUNaTCxVQUFNLE9BRE07QUFFWkMsU0FBSyxDQUZPO0FBR1pDLFNBQUssQ0FBQ0MsUUFITTtBQUlaQyxhQUFTO0FBSkcsR0FQRztBQWFqQkUsWUFBVTtBQUNSTixVQUFNLE9BREU7QUFFUkMsU0FBSyxDQUZHO0FBR1JDLFNBQUssQ0FBQ0MsUUFIRTtBQUlSQyxhQUFTO0FBSkQ7O0FBUVo7Ozs7Ozs7Ozs7OztBQXJCbUIsQ0FBbkI7SUFpQ01HLGdCOzs7QUFDSiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSwwSkFDbEJWLFVBRGtCLEVBQ05VLE9BRE07O0FBR3hCLFVBQUtDLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLElBQWpCOztBQUVBLFVBQUtDLEtBQUwsR0FBYSxNQUFLQSxLQUFMLENBQVdDLElBQVgsT0FBYjtBQU53QjtBQU96Qjs7QUFFRDs7Ozs7d0NBQ29CQyxnQixFQUFrQjtBQUNwQyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBLFdBQUtFLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCQyxTQUE5QjtBQUNBLFdBQUtGLFlBQUwsQ0FBa0JHLFNBQWxCLEdBQThCLENBQTlCOztBQUVBLFdBQUtDLHFCQUFMO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ2FDLEssRUFBTztBQUNsQixXQUFLQyxZQUFMO0FBQ0EsV0FBS0MsZUFBTCxDQUFxQkYsS0FBckI7QUFDRDs7QUFFRDs7OztrQ0FDY0EsSyxFQUFPO0FBQ25CLFVBQU1HLFFBQVFILE1BQU1JLElBQU4sQ0FBVyxDQUFYLENBQWQ7O0FBRUEsVUFBSUQsUUFBUSxLQUFLRSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsYUFBaEIsQ0FBUixJQUEwQyxDQUFDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUM1RCxhQUFLQSxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsYUFBS2tCLE1BQUwsQ0FBWVAsS0FBWjtBQUNELE9BSEQsTUFHTyxJQUFJRyxRQUFRLEtBQUtFLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixjQUFoQixDQUFSLElBQTJDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUNuRSxhQUFLQSxRQUFMLEdBQWdCLEtBQWhCLENBRG1FLENBQzVDOztBQUV2QixZQUFJLEtBQUtDLFNBQUwsS0FBbUIsSUFBdkIsRUFBNkI7QUFDM0IsZUFBS0EsU0FBTCxHQUFpQmtCLFdBQVcsS0FBS2pCLEtBQWhCLEVBQXVCLEtBQUtjLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixVQUFoQixDQUF2QixFQUFvRE4sTUFBTVMsSUFBMUQsQ0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7MkJBQ09ULEssRUFBTztBQUNaVSxtQkFBYSxLQUFLcEIsU0FBbEI7QUFDQSxXQUFLQSxTQUFMLEdBQWlCLElBQWpCOztBQUVBLFdBQUtVLEtBQUwsQ0FBV1MsSUFBWCxHQUFrQlQsTUFBTVMsSUFBeEI7QUFDQSxXQUFLVCxLQUFMLENBQVdJLElBQVgsQ0FBZ0IsQ0FBaEIsSUFBcUIsQ0FBckI7QUFDQSxXQUFLTyxjQUFMO0FBQ0Q7O0FBRUQ7Ozs7MEJBQ01DLFcsRUFBYTtBQUNqQixXQUFLWixLQUFMLENBQVdTLElBQVgsR0FBa0JHLGNBQWMsS0FBS1AsTUFBTCxDQUFZQyxHQUFaLENBQWdCLFVBQWhCLElBQThCLEtBQTlEO0FBQ0EsV0FBS04sS0FBTCxDQUFXSSxJQUFYLENBQWdCLENBQWhCLElBQXFCLENBQXJCO0FBQ0EsV0FBS08sY0FBTDtBQUNEOzs7OztrQkFHWXhCLGdCIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlTGZvIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG5jb25zdCBwYXJhbWV0ZXJzID0ge1xuICBvblRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDAuNSxcbiAgfSxcbiAgb2ZmVGhyZXNob2xkOiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4wMSxcbiAgfSxcbiAgb2ZmRGVsYXk6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAyMDAsXG4gIH0sXG59XG5cbi8qKlxuICogU2ltcGxlIHN3aXRjaCBjb250cm9sIHVzaW5nIGludGVuc2l0eSBpbnB1dCB0byBvdXRwdXQgc3BhcnNlIGZyYW1lc1xuICogb2YgbGVuZ3RoIDEsIGNvbnRhaW5pbmcgZWl0aGVyIDEgKHN0YXJ0IG1vdmluZykgb3IgMCAoc3RvcCBtb3ZpbmcpLlxuICogVGhlIGRldGVjdGlvbiBpcyBiYXNlZCBvbiBhIHNjaG1pdHQgdHJpZ2dlciBzeXN0ZW0sIGFuZCBhbHNvIGZlYXR1cmVzXG4gKiBhIHRpbWVvdXQgZHVyYXRpb24gYWxsb3dpbmcgdG8gZ28gYmVsb3cgdGhlIGxvdyB0aHJlc2hvbGQgZm9yIGEgY2VydGFpblxuICogYW1vdW50IG9mIHRpbWUgd2l0aG91dCBzZW5kaW5nIHRoZSAwIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb25zLlxuICogQHBhcmFtIHtOdW1iZXJ9IG9uVGhyZXNob2xkIC0gVGhlIHRocmVzaG9sZCBhYm92ZSB3aGljaCBtb3Zpbmcgc3RhcnRzLlxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZlRocmVzaG9sZCAtIFRoZSB0aHJlc2hvbGQgYmVsb3cgd2hpY2ggbW92aW5nIHN0b3BzLlxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZkRlbGF5IC0gVGhlIGFsbG93ZWQgZHVyYXRpb24gdG8gZ28gYmVsb3cgdGhlIGxvdyB0aHJlc2hvbGQgd2l0aG91dCBzZW5kaW5nIC5cbiAqL1xuY2xhc3MgU3RpbGxBdXRvVHJpZ2dlciBleHRlbmRzIEJhc2VMZm8ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBvcHRpb25zKTtcblxuICAgIHRoaXMuaXNNb3ZpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG5cbiAgICB0aGlzLl9zdG9wID0gdGhpcy5fc3RvcC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSAxO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVTdHJlYW1QYXJhbXMoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgICB0aGlzLnByZXBhcmVGcmFtZSgpO1xuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgdmFsdWUgPSBmcmFtZS5kYXRhWzBdO1xuXG4gICAgaWYgKHZhbHVlID4gdGhpcy5wYXJhbXMuZ2V0KCdvblRocmVzaG9sZCcpICYmICF0aGlzLmlzTW92aW5nKSB7XG4gICAgICB0aGlzLmlzTW92aW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3N0YXJ0KGZyYW1lKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIDwgdGhpcy5wYXJhbXMuZ2V0KCdvZmZUaHJlc2hvbGQnKSAmJiB0aGlzLmlzTW92aW5nKSB7XG4gICAgICB0aGlzLmlzTW92aW5nID0gZmFsc2U7IC8vIGtlZXAgdGhpcyBvdXQgb2YgdGhlIHRpbWVvdXRcblxuICAgICAgaWYgKHRoaXMudGltZW91dElkID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dCh0aGlzLl9zdG9wLCB0aGlzLnBhcmFtcy5nZXQoJ29mZkRlbGF5JyksIGZyYW1lLnRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RhcnQoZnJhbWUpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcblxuICAgIHRoaXMuZnJhbWUudGltZSA9IGZyYW1lLnRpbWU7XG4gICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMTtcbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3N0b3AodGltZW91dERhdGUpIHtcbiAgICB0aGlzLmZyYW1lLnRpbWUgPSB0aW1lb3V0RGF0ZSArIHRoaXMucGFyYW1zLmdldCgnb2ZmRGVsYXknKSAqIDAuMDAxO1xuICAgIHRoaXMuZnJhbWUuZGF0YVswXSA9IDA7XG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0aWxsQXV0b1RyaWdnZXI7XG4iXX0=