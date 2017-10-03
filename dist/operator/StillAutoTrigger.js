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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsicGFyYW1ldGVycyIsIm9uVGhyZXNob2xkIiwidHlwZSIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwiZGVmYXVsdCIsIm9mZlRocmVzaG9sZCIsIm9mZkRlbGF5IiwiU3RpbGxBdXRvVHJpZ2dlciIsIm9wdGlvbnMiLCJpc01vdmluZyIsInRpbWVvdXRJZCIsIl9zdG9wIiwiYmluZCIsInByZXZTdHJlYW1QYXJhbXMiLCJwcmVwYXJlU3RyZWFtUGFyYW1zIiwic3RyZWFtUGFyYW1zIiwiZnJhbWVSYXRlIiwidW5kZWZpbmVkIiwiZnJhbWVTaXplIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiZnJhbWUiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iLCJ2YWx1ZSIsImRhdGEiLCJwYXJhbXMiLCJnZXQiLCJfc3RhcnQiLCJzZXRUaW1lb3V0IiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIiwiY2xlYXJUaW1lb3V0IiwidGltZW91dERhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFFQSxJQUFNQSxhQUFhO0FBQ2pCQyxlQUFhO0FBQ1hDLFVBQU0sT0FESztBQUVYQyxTQUFLLENBRk07QUFHWEMsU0FBSyxDQUFDQyxRQUhLO0FBSVhDLGFBQVM7QUFKRSxHQURJO0FBT2pCQyxnQkFBYztBQUNaTCxVQUFNLE9BRE07QUFFWkMsU0FBSyxDQUZPO0FBR1pDLFNBQUssQ0FBQ0MsUUFITTtBQUlaQyxhQUFTO0FBSkcsR0FQRztBQWFqQkUsWUFBVTtBQUNSTixVQUFNLE9BREU7QUFFUkMsU0FBSyxDQUZHO0FBR1JDLFNBQUssQ0FBQ0MsUUFIRTtBQUlSQyxhQUFTO0FBSkQ7O0FBUVo7Ozs7Ozs7Ozs7Ozs7OztBQXJCbUIsQ0FBbkI7SUFvQ01HLGdCOzs7QUFDSiw4QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSwwSkFDbEJWLFVBRGtCLEVBQ05VLE9BRE07O0FBR3hCLFVBQUtDLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSxVQUFLQyxTQUFMLEdBQWlCLElBQWpCOztBQUVBLFVBQUtDLEtBQUwsR0FBYSxNQUFLQSxLQUFMLENBQVdDLElBQVgsT0FBYjtBQU53QjtBQU96Qjs7QUFFRDs7Ozs7d0NBQ29CQyxnQixFQUFrQjtBQUNwQyxXQUFLQyxtQkFBTCxDQUF5QkQsZ0JBQXpCOztBQUVBLFdBQUtFLFlBQUwsQ0FBa0JDLFNBQWxCLEdBQThCQyxTQUE5QjtBQUNBLFdBQUtGLFlBQUwsQ0FBa0JHLFNBQWxCLEdBQThCLENBQTlCOztBQUVBLFdBQUtDLHFCQUFMO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ2FDLEssRUFBTztBQUNsQixXQUFLQyxZQUFMO0FBQ0EsV0FBS0MsZUFBTCxDQUFxQkYsS0FBckI7QUFDRDs7QUFFRDs7OztrQ0FDY0EsSyxFQUFPO0FBQ25CLFVBQU1HLFFBQVFILE1BQU1JLElBQU4sQ0FBVyxDQUFYLENBQWQ7O0FBRUEsVUFBSUQsUUFBUSxLQUFLRSxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsYUFBaEIsQ0FBUixJQUEwQyxDQUFDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUM1RCxhQUFLQSxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsYUFBS2tCLE1BQUwsQ0FBWVAsS0FBWjtBQUNELE9BSEQsTUFHTyxJQUFJRyxRQUFRLEtBQUtFLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixjQUFoQixDQUFSLElBQTJDLEtBQUtqQixRQUFwRCxFQUE4RDtBQUNuRSxhQUFLQSxRQUFMLEdBQWdCLEtBQWhCLENBRG1FLENBQzVDOztBQUV2QixZQUFJLEtBQUtDLFNBQUwsS0FBbUIsSUFBdkIsRUFBNkI7QUFDM0IsZUFBS0EsU0FBTCxHQUFpQmtCLFdBQVcsS0FBS2pCLEtBQWhCLEVBQXVCLEtBQUtjLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixVQUFoQixJQUE4QixJQUFyRCxFQUEyRE4sTUFBTVMsSUFBakUsQ0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQ7Ozs7MkJBQ09ULEssRUFBTztBQUNaLFVBQUksS0FBS1YsU0FBTCxLQUFtQixJQUF2QixFQUE2QjtBQUMzQixhQUFLVSxLQUFMLENBQVdTLElBQVgsR0FBa0JULE1BQU1TLElBQXhCO0FBQ0EsYUFBS1QsS0FBTCxDQUFXSSxJQUFYLENBQWdCLENBQWhCLElBQXFCLENBQXJCO0FBQ0EsYUFBS00sY0FBTDtBQUNEOztBQUVEQyxtQkFBYSxLQUFLckIsU0FBbEI7QUFDQSxXQUFLQSxTQUFMLEdBQWlCLElBQWpCO0FBQ0Q7O0FBRUQ7Ozs7MEJBQ01zQixXLEVBQWE7QUFDakIsV0FBS1osS0FBTCxDQUFXUyxJQUFYLEdBQWtCRyxjQUFjLEtBQUtQLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixVQUFoQixJQUE4QixLQUE5RDtBQUNBLFdBQUtOLEtBQUwsQ0FBV0ksSUFBWCxDQUFnQixDQUFoQixJQUFxQixDQUFyQjtBQUNBLFdBQUtNLGNBQUw7QUFDRDs7Ozs7a0JBR1l2QixnQiIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZUxmbyB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgcGFyYW1ldGVycyA9IHtcbiAgb25UaHJlc2hvbGQ6IHtcbiAgICB0eXBlOiAnZmxvYXQnLFxuICAgIG1pbjogMCxcbiAgICBtYXg6ICtJbmZpbml0eSxcbiAgICBkZWZhdWx0OiAwLjUsXG4gIH0sXG4gIG9mZlRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgbWluOiAwLFxuICAgIG1heDogK0luZmluaXR5LFxuICAgIGRlZmF1bHQ6IDAuMDEsXG4gIH0sXG4gIG9mZkRlbGF5OiB7XG4gICAgdHlwZTogJ2Zsb2F0JyxcbiAgICBtaW46IDAsXG4gICAgbWF4OiArSW5maW5pdHksXG4gICAgZGVmYXVsdDogMC4yLFxuICB9LFxufVxuXG4vKipcbiAqIFNpbXBsZSBzd2l0Y2ggY29udHJvbCB1c2luZyBpbnRlbnNpdHkgaW5wdXQgdG8gb3V0cHV0IHNwYXJzZSBmcmFtZXNcbiAqIG9mIGxlbmd0aCAxIChzY2FsYXJzKSwgYWx0ZXJuYXRpbmcgYmV0d2VlbiAxIChzdGFydCBtb3ZpbmcpIG9yIDAgKHN0b3AgbW92aW5nKS5cbiAqIFRoZSBkZXRlY3Rpb24gaXMgYmFzZWQgb24gYSBzY2htaXR0IHRyaWdnZXIgc3lzdGVtLCBhbmQgYWxzbyBmZWF0dXJlc1xuICogYSB0aW1lb3V0IHBhcmFtZXRlciBhbGxvd2luZyB0byBzdGF5IGJlbG93IHRoZSBsb3cgdGhyZXNob2xkIHVwIHRvIGEgbWF4aW11bVxuICogZHVyYXRpb24gd2l0aG91dCBzZW5kaW5nIHRoZSAwIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPdmVycmlkZSBkZWZhdWx0IG9wdGlvbnMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMub25UaHJlc2hvbGQ9MC41XSAtIFRoZSB0aHJlc2hvbGQgYWJvdmUgd2hpY2hcbiAqIG1vdmluZyBzdGFydHMuXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMub2ZmVGhyZXNob2xkPTAuMDFdIC0gVGhlIHRocmVzaG9sZCBiZWxvdyB3aGljaFxuICogbW92aW5nIHN0b3BzLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLm9mZkRlbGF5PTAuMl0gLSBUaGUgbWF4aW11bSBkdXJhdGlvbiAodGltZW91dClcbiAqIGFsbG93ZWQgaW4gc2Vjb25kcyB0byBzdGF5IGJlbG93IHRoZSBsb3cgdGhyZXNob2xkIHdpdGhvdXQgcHJvcGFnYXRpbmcgYSAwLlxuICovXG5jbGFzcyBTdGlsbEF1dG9UcmlnZ2VyIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5pc01vdmluZyA9IGZhbHNlO1xuICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcblxuICAgIHRoaXMuX3N0b3AgPSB0aGlzLl9zdG9wLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDE7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZUZyYW1lKCk7XG4gICAgdGhpcy5wcm9jZXNzRnVuY3Rpb24oZnJhbWUpO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NWZWN0b3IoZnJhbWUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGZyYW1lLmRhdGFbMF07XG5cbiAgICBpZiAodmFsdWUgPiB0aGlzLnBhcmFtcy5nZXQoJ29uVGhyZXNob2xkJykgJiYgIXRoaXMuaXNNb3ZpbmcpIHtcbiAgICAgIHRoaXMuaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5fc3RhcnQoZnJhbWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPCB0aGlzLnBhcmFtcy5nZXQoJ29mZlRocmVzaG9sZCcpICYmIHRoaXMuaXNNb3ZpbmcpIHtcbiAgICAgIHRoaXMuaXNNb3ZpbmcgPSBmYWxzZTsgLy8ga2VlcCB0aGlzIG91dCBvZiB0aGUgdGltZW91dFxuXG4gICAgICBpZiAodGhpcy50aW1lb3V0SWQgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KHRoaXMuX3N0b3AsIHRoaXMucGFyYW1zLmdldCgnb2ZmRGVsYXknKSAqIDEwMDAsIGZyYW1lLnRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfc3RhcnQoZnJhbWUpIHtcbiAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZnJhbWUudGltZSA9IGZyYW1lLnRpbWU7XG4gICAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAxO1xuICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9zdG9wKHRpbWVvdXREYXRlKSB7XG4gICAgdGhpcy5mcmFtZS50aW1lID0gdGltZW91dERhdGUgKyB0aGlzLnBhcmFtcy5nZXQoJ29mZkRlbGF5JykgKiAwLjAwMTtcbiAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAwO1xuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdGlsbEF1dG9UcmlnZ2VyO1xuIl19