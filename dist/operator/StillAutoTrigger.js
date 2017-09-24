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
      if (this.timeoutId !== null) {
        this.frame.time = frame.time;
        this.frame.data[0] = 1;
        this.propagateFrame();
      }

      clearTimeout(this.timeoutId);
      this.timeoutId = null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm9uVGhyZXNob2xkIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsIm9mZlRocmVzaG9sZCIsIm9mZkRlbGF5IiwiU3RpbGxBdXRvVHJpZ2dlciIsIm9wdGlvbnMiLCJpc01vdmluZyIsInRpbWVvdXRJZCIsIl9zdG9wIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwidW5kZWZpbmVkIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJ2YWx1ZSIsImRhdGEiLCJwYXJhbXMiLCJnZXQiLCJfc3RhcnQiLCJzZXRUaW1lb3V0IiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIiwiY2xlYXJUaW1lb3V0IiwidGltZW91dERhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFFQSxJQUFNQSxhQUFhO0FBQ2pCQyxlQUFhO0FBQ1hDLFVBQU0sT0FESztBQUVYQyxTQUFLLENBRk07QUFHWEMsU0FBSyxDQUFDQyxRQUhLO0FBSVhDLGFBQVM7QUFKRSxHQURJO0FBT2pCQyxnQkFBYztBQUNaTCxVQUFNLE9BRE07QUFFWkMsU0FBSyxDQUZPO0FBR1pDLFNBQUssQ0FBQ0MsUUFITTtBQUlaQyxhQUFTO0FBSkcsR0FQRztBQWFqQkUsWUFBVTtBQUNSTixVQUFNLE9BREU7QUFFUkMsU0FBSyxDQUZHO0FBR1JDLFNBQUssQ0FBQ0MsUUFIRTtBQUlSQyxhQUFTO0FBSkQ7O0FBUVo7Ozs7Ozs7Ozs7OztBQXJCbUIsQ0FBbkI7SUFpQ01HLGdCOzs7QUFDSiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSwwSkFDbEJWLFVBRGtCLEVBQ05VLE9BRE07O0FBR3hCLFVBQUtDLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLElBQWpCOztBQUVBLFVBQUtDLEtBQUwsR0FBYSxNQUFLQSxLQUFMLENBQVdDLElBQVgsT0FBYjtBQU53QjtBQU96Qjs7QUFFRDs7Ozs7d0NBQ29CQyxnQixFQUFrQjtBQUNwQyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBLFdBQUtFLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCQyxTQUE5QjtBQUNBLFdBQUtGLFlBQUwsQ0FBa0JHLFNBQWxCLEdBQThCLENBQTlCOztBQUVBLFdBQUtDLHFCQUFMO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ2FDLEssRUFBTztBQUNsQixXQUFLQyxZQUFMO0FBQ0EsV0FBS0MsZUFBTCxDQUFxQkYsS0FBckI7QUFDRDs7QUFFRDs7OztrQ0FDY0EsSyxFQUFPO0FBQ25CLFVBQU1HLFFBQVFILE1BQU1JLElBQU4sQ0FBVyxDQUFYLENBQWQ7O0FBRUEsVUFBSUQsUUFBUSxLQUFLRSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsYUFBaEIsQ0FBUixJQUEwQyxDQUFDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUM1RCxhQUFLQSxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsYUFBS2tCLE1BQUwsQ0FBWVAsS0FBWjtBQUNELE9BSEQsTUFHTyxJQUFJRyxRQUFRLEtBQUtFLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixjQUFoQixDQUFSLElBQTJDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUNuRSxhQUFLQSxRQUFMLEdBQWdCLEtBQWhCLENBRG1FLENBQzVDOztBQUV2QixZQUFJLEtBQUtDLFNBQUwsS0FBbUIsSUFBdkIsRUFBNkI7QUFDM0IsZUFBS0EsU0FBTCxHQUFpQmtCLFdBQVcsS0FBS2pCLEtBQWhCLEVBQXVCLEtBQUtjLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixVQUFoQixDQUF2QixFQUFvRE4sTUFBTVMsSUFBMUQsQ0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7MkJBQ09ULEssRUFBTztBQUNaLFVBQUksS0FBS1YsU0FBTCxLQUFtQixJQUF2QixFQUE2QjtBQUMzQixhQUFLVSxLQUFMLENBQVdTLElBQVgsR0FBa0JULE1BQU1TLElBQXhCO0FBQ0EsYUFBS1QsS0FBTCxDQUFXSSxJQUFYLENBQWdCLENBQWhCLElBQXFCLENBQXJCO0FBQ0EsYUFBS00sY0FBTDtBQUNEOztBQUVEQyxtQkFBYSxLQUFLckIsU0FBbEI7QUFDQSxXQUFLQSxTQUFMLEdBQWlCLElBQWpCO0FBQ0Q7O0FBRUQ7Ozs7MEJBQ01zQixXLEVBQWE7QUFDakIsV0FBS1osS0FBTCxDQUFXUyxJQUFYLEdBQWtCRyxjQUFjLEtBQUtQLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixVQUFoQixJQUE4QixLQUE5RDtBQUNBLFdBQUtOLEtBQUwsQ0FBV0ksSUFBWCxDQUFnQixDQUFoQixJQUFxQixDQUFyQjtBQUNBLFdBQUtNLGNBQUw7QUFDRDs7Ozs7a0JBR1l2QixnQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgb25UaHJlc2hvbGQ6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjUsXG4gIH0sXG4gIG9mZlRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDAuMDEsXG4gIH0sXG4gIG9mZkRlbGF5OiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMjAwLFxuICB9LFxufVxuXG4vKipcbiAqIFNpbXBsZSBzd2l0Y2ggY29udHJvbCB1c2luZyBpbnRlbnNpdHkgaW5wdXQgdG8gb3V0cHV0IHNwYXJzZSBmcmFtZXNcbiAqIG9mIGxlbmd0aCAxLCBjb250YWluaW5nIGVpdGhlciAxIChzdGFydCBtb3ZpbmcpIG9yIDAgKHN0b3AgbW92aW5nKS5cbiAqIFRoZSBkZXRlY3Rpb24gaXMgYmFzZWQgb24gYSBzY2htaXR0IHRyaWdnZXIgc3lzdGVtLCBhbmQgYWxzbyBmZWF0dXJlc1xuICogYSB0aW1lb3V0IGR1cmF0aW9uIGFsbG93aW5nIHRvIGdvIGJlbG93IHRoZSBsb3cgdGhyZXNob2xkIGZvciBhIGNlcnRhaW5cbiAqIGFtb3VudCBvZiB0aW1lIHdpdGhvdXQgc2VuZGluZyB0aGUgMCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlIGRlZmF1bHQgb3B0aW9ucy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBvblRocmVzaG9sZCAtIFRoZSB0aHJlc2hvbGQgYWJvdmUgd2hpY2ggbW92aW5nIHN0YXJ0cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZUaHJlc2hvbGQgLSBUaGUgdGhyZXNob2xkIGJlbG93IHdoaWNoIG1vdmluZyBzdG9wcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZEZWxheSAtIFRoZSBhbGxvd2VkIGR1cmF0aW9uIHRvIGdvIGJlbG93IHRoZSBsb3cgdGhyZXNob2xkIHdpdGhvdXQgc2VuZGluZyAuXG4gKi9cbmNsYXNzIFN0aWxsQXV0b1RyaWdnZXIgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLmlzTW92aW5nID0gZmFsc2U7XG4gICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuXG4gICAgdGhpcy5fc3RvcCA9IHRoaXMuX3N0b3AuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc0ZyYW1lKGZyYW1lKSB7XG4gICAgdGhpcy5wcmVwYXJlRnJhbWUoKTtcbiAgICB0aGlzLnByb2Nlc3NGdW5jdGlvbihmcmFtZSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZnJhbWUuZGF0YVswXTtcblxuICAgIGlmICh2YWx1ZSA+IHRoaXMucGFyYW1zLmdldCgnb25UaHJlc2hvbGQnKSAmJiAhdGhpcy5pc01vdmluZykge1xuICAgICAgdGhpcy5pc01vdmluZyA9IHRydWU7XG4gICAgICB0aGlzLl9zdGFydChmcmFtZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA8IHRoaXMucGFyYW1zLmdldCgnb2ZmVGhyZXNob2xkJykgJiYgdGhpcy5pc01vdmluZykge1xuICAgICAgdGhpcy5pc01vdmluZyA9IGZhbHNlOyAvLyBrZWVwIHRoaXMgb3V0IG9mIHRoZSB0aW1lb3V0XG5cbiAgICAgIGlmICh0aGlzLnRpbWVvdXRJZCA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLnRpbWVvdXRJZCA9IHNldFRpbWVvdXQodGhpcy5fc3RvcCwgdGhpcy5wYXJhbXMuZ2V0KCdvZmZEZWxheScpLCBmcmFtZS50aW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX3N0YXJ0KGZyYW1lKSB7XG4gICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmZyYW1lLnRpbWUgPSBmcmFtZS50aW1lO1xuICAgICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMTtcbiAgICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RvcCh0aW1lb3V0RGF0ZSkge1xuICAgIHRoaXMuZnJhbWUudGltZSA9IHRpbWVvdXREYXRlICsgdGhpcy5wYXJhbXMuZ2V0KCdvZmZEZWxheScpICogMC4wMDE7XG4gICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMDtcbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3RpbGxBdXRvVHJpZ2dlcjtcbiJdfQ==