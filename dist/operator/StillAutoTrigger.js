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
    default: 0.2
  }

  /**
   * Simple switch control using intensity input to output sparse frames
   * of length 1 (scalars), alternating between 1 (start moving) or 0 (stop moving).
   * The detection is based on a schmitt trigger system, and also features
   * a timeout parameter allowing to stay below the low threshold up to a maximum
   * duration without sending the 0 value.
   *
   * note: this module has no defined output frameRate.
   *
   * @memberof operator
   *
   * @param {Object} [options] - Override default options.
   * @param {Number} [options.onThreshold=0.5] - The threshold above which
   * moving starts.
   * @param {Number} [options.offThreshold=0.01] - The threshold below which
   * moving stops.
   * @param {Number} [options.offDelay=0.2] - The maximum duration (timeout)
   * allowed in seconds to stay below the low threshold without propagating a 0.
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

      this.streamParams.frameRate = 0; //
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
          this.timeoutId = setTimeout(this._stop, this.params.get('offDelay') * 1000, frame.time);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm9uVGhyZXNob2xkIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsIm9mZlRocmVzaG9sZCIsIm9mZkRlbGF5IiwiU3RpbGxBdXRvVHJpZ2dlciIsIm9wdGlvbnMiLCJpc01vdmluZyIsInRpbWVvdXRJZCIsIl9zdG9wIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJ2YWx1ZSIsImRhdGEiLCJwYXJhbXMiLCJnZXQiLCJfc3RhcnQiLCJzZXRUaW1lb3V0IiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIiwiY2xlYXJUaW1lb3V0IiwidGltZW91dERhdGUiLCJCYXNlTGZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBRUEsSUFBTUEsYUFBYTtBQUNqQkMsZUFBYTtBQUNYQyxVQUFNLE9BREs7QUFFWEMsU0FBSyxDQUZNO0FBR1hDLFNBQUssQ0FBQ0MsUUFISztBQUlYQyxhQUFTO0FBSkUsR0FESTtBQU9qQkMsZ0JBQWM7QUFDWkwsVUFBTSxPQURNO0FBRVpDLFNBQUssQ0FGTztBQUdaQyxTQUFLLENBQUNDLFFBSE07QUFJWkMsYUFBUztBQUpHLEdBUEc7QUFhakJFLFlBQVU7QUFDUk4sVUFBTSxPQURFO0FBRVJDLFNBQUssQ0FGRztBQUdSQyxTQUFLLENBQUNDLFFBSEU7QUFJUkMsYUFBUztBQUpEOztBQVFaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBckJtQixDQUFuQjtJQXdDTUcsZ0I7OztBQUNKLDhCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUFBLDBKQUNsQlYsVUFEa0IsRUFDTlUsT0FETTs7QUFHeEIsVUFBS0MsUUFBTCxHQUFnQixLQUFoQjtBQUNBLFVBQUtDLFNBQUwsR0FBaUIsSUFBakI7O0FBRUEsVUFBS0MsS0FBTCxHQUFhLE1BQUtBLEtBQUwsQ0FBV0MsSUFBWCxPQUFiO0FBTndCO0FBT3pCOztBQUVEOzs7Ozt3Q0FDb0JDLGdCLEVBQWtCO0FBQ3BDLFdBQUtDLG1CQUFMLENBQXlCRCxnQkFBekI7O0FBRUEsV0FBS0UsWUFBTCxDQUFrQkMsU0FBbEIsR0FBOEIsQ0FBOUIsQ0FIb0MsQ0FHSDtBQUNqQyxXQUFLRCxZQUFMLENBQWtCRSxTQUFsQixHQUE4QixDQUE5Qjs7QUFFQSxXQUFLQyxxQkFBTDtBQUNEOztBQUVEOzs7O2lDQUNhQyxLLEVBQU87QUFDbEIsV0FBS0MsWUFBTDtBQUNBLFdBQUtDLGVBQUwsQ0FBcUJGLEtBQXJCO0FBQ0Q7O0FBRUQ7Ozs7a0NBQ2NBLEssRUFBTztBQUNuQixVQUFNRyxRQUFRSCxNQUFNSSxJQUFOLENBQVcsQ0FBWCxDQUFkOztBQUVBLFVBQUlELFFBQVEsS0FBS0UsTUFBTCxDQUFZQyxHQUFaLENBQWdCLGFBQWhCLENBQVIsSUFBMEMsQ0FBQyxLQUFLaEIsUUFBcEQsRUFBOEQ7QUFDNUQsYUFBS0EsUUFBTCxHQUFnQixJQUFoQjtBQUNBLGFBQUtpQixNQUFMLENBQVlQLEtBQVo7QUFDRCxPQUhELE1BR08sSUFBSUcsUUFBUSxLQUFLRSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsY0FBaEIsQ0FBUixJQUEyQyxLQUFLaEIsUUFBcEQsRUFBOEQ7QUFDbkUsYUFBS0EsUUFBTCxHQUFnQixLQUFoQixDQURtRSxDQUM1Qzs7QUFFdkIsWUFBSSxLQUFLQyxTQUFMLEtBQW1CLElBQXZCLEVBQTZCO0FBQzNCLGVBQUtBLFNBQUwsR0FBaUJpQixXQUFXLEtBQUtoQixLQUFoQixFQUF1QixLQUFLYSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsVUFBaEIsSUFBOEIsSUFBckQsRUFBMkROLE1BQU1TLElBQWpFLENBQWpCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7OzJCQUNPVCxLLEVBQU87QUFDWixVQUFJLEtBQUtULFNBQUwsS0FBbUIsSUFBdkIsRUFBNkI7QUFDM0IsYUFBS1MsS0FBTCxDQUFXUyxJQUFYLEdBQWtCVCxNQUFNUyxJQUF4QjtBQUNBLGFBQUtULEtBQUwsQ0FBV0ksSUFBWCxDQUFnQixDQUFoQixJQUFxQixDQUFyQjtBQUNBLGFBQUtNLGNBQUw7QUFDRDs7QUFFREMsbUJBQWEsS0FBS3BCLFNBQWxCO0FBQ0EsV0FBS0EsU0FBTCxHQUFpQixJQUFqQjtBQUNEOztBQUVEOzs7OzBCQUNNcUIsVyxFQUFhO0FBQ2pCLFdBQUtaLEtBQUwsQ0FBV1MsSUFBWCxHQUFrQkcsY0FBYyxLQUFLUCxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsVUFBaEIsSUFBOEIsS0FBOUQ7QUFDQSxXQUFLTixLQUFMLENBQVdJLElBQVgsQ0FBZ0IsQ0FBaEIsSUFBcUIsQ0FBckI7QUFDQSxXQUFLTSxjQUFMO0FBQ0Q7OztFQTNENEJHLGE7O2tCQThEaEJ6QixnQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgb25UaHJlc2hvbGQ6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjUsXG4gIH0sXG4gIG9mZlRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDAuMDEsXG4gIH0sXG4gIG9mZkRlbGF5OiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4yLFxuICB9LFxufVxuXG4vKipcbiAqIFNpbXBsZSBzd2l0Y2ggY29udHJvbCB1c2luZyBpbnRlbnNpdHkgaW5wdXQgdG8gb3V0cHV0IHNwYXJzZSBmcmFtZXNcbiAqIG9mIGxlbmd0aCAxIChzY2FsYXJzKSwgYWx0ZXJuYXRpbmcgYmV0d2VlbiAxIChzdGFydCBtb3ZpbmcpIG9yIDAgKHN0b3AgbW92aW5nKS5cbiAqIFRoZSBkZXRlY3Rpb24gaXMgYmFzZWQgb24gYSBzY2htaXR0IHRyaWdnZXIgc3lzdGVtLCBhbmQgYWxzbyBmZWF0dXJlc1xuICogYSB0aW1lb3V0IHBhcmFtZXRlciBhbGxvd2luZyB0byBzdGF5IGJlbG93IHRoZSBsb3cgdGhyZXNob2xkIHVwIHRvIGEgbWF4aW11bVxuICogZHVyYXRpb24gd2l0aG91dCBzZW5kaW5nIHRoZSAwIHZhbHVlLlxuICpcbiAqIG5vdGU6IHRoaXMgbW9kdWxlIGhhcyBubyBkZWZpbmVkIG91dHB1dCBmcmFtZVJhdGUuXG4gKlxuICogQG1lbWJlcm9mIG9wZXJhdG9yXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIE92ZXJyaWRlIGRlZmF1bHQgb3B0aW9ucy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5vblRocmVzaG9sZD0wLjVdIC0gVGhlIHRocmVzaG9sZCBhYm92ZSB3aGljaFxuICogbW92aW5nIHN0YXJ0cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5vZmZUaHJlc2hvbGQ9MC4wMV0gLSBUaGUgdGhyZXNob2xkIGJlbG93IHdoaWNoXG4gKiBtb3Zpbmcgc3RvcHMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMub2ZmRGVsYXk9MC4yXSAtIFRoZSBtYXhpbXVtIGR1cmF0aW9uICh0aW1lb3V0KVxuICogYWxsb3dlZCBpbiBzZWNvbmRzIHRvIHN0YXkgYmVsb3cgdGhlIGxvdyB0aHJlc2hvbGQgd2l0aG91dCBwcm9wYWdhdGluZyBhIDAuXG4gKi9cbmNsYXNzIFN0aWxsQXV0b1RyaWdnZXIgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLmlzTW92aW5nID0gZmFsc2U7XG4gICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuXG4gICAgdGhpcy5fc3RvcCA9IHRoaXMuX3N0b3AuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBwcm9jZXNzU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpIHtcbiAgICB0aGlzLnByZXBhcmVTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcyk7XG5cbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAwOyAvL1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDE7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZUZyYW1lKCk7XG4gICAgdGhpcy5wcm9jZXNzRnVuY3Rpb24oZnJhbWUpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGZyYW1lLmRhdGFbMF07XG5cbiAgICBpZiAodmFsdWUgPiB0aGlzLnBhcmFtcy5nZXQoJ29uVGhyZXNob2xkJykgJiYgIXRoaXMuaXNNb3ZpbmcpIHtcbiAgICAgIHRoaXMuaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5fc3RhcnQoZnJhbWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPCB0aGlzLnBhcmFtcy5nZXQoJ29mZlRocmVzaG9sZCcpICYmIHRoaXMuaXNNb3ZpbmcpIHtcbiAgICAgIHRoaXMuaXNNb3ZpbmcgPSBmYWxzZTsgLy8ga2VlcCB0aGlzIG91dCBvZiB0aGUgdGltZW91dFxuXG4gICAgICBpZiAodGhpcy50aW1lb3V0SWQgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KHRoaXMuX3N0b3AsIHRoaXMucGFyYW1zLmdldCgnb2ZmRGVsYXknKSAqIDEwMDAsIGZyYW1lLnRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RhcnQoZnJhbWUpIHtcbiAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZnJhbWUudGltZSA9IGZyYW1lLnRpbWU7XG4gICAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAxO1xuICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zdG9wKHRpbWVvdXREYXRlKSB7XG4gICAgdGhpcy5mcmFtZS50aW1lID0gdGltZW91dERhdGUgKyB0aGlzLnBhcmFtcy5nZXQoJ29mZkRlbGF5JykgKiAwLjAwMTtcbiAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAwO1xuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdGlsbEF1dG9UcmlnZ2VyO1xuIl19