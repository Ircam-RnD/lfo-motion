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

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _common = require('waves-lfo/common');

var lfo = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BaseLfo = lfo.core.BaseLfo;
var MovingMedian = lfo.operator.MovingMedian;

/**
 * Find a kick from the sensors values. The module must be connected to the
 * output of the `Intensity` operator. The module outputs when a kick is found.
 *
 * @param {}
 *
 * @example
 * import * as lfoMotion from 'lfo-motion';
 *
 * const sensors = new lfo.source.MotionInput();
 * const intensity = new lfo.operator.Intensity();
 *
 */
var definitions = {
  filterOrder: {
    type: 'integer',
    default: 5,
    min: 1,
    max: +Infinity
  },
  threshold: {
    type: 'float',
    default: 0.01,
    min: 0,
    max: 1
  },
  minInter: {
    type: 'float',
    default: 0.2,
    min: 0
  }
};

var Kick = function (_BaseLfo) {
  (0, _inherits3.default)(Kick, _BaseLfo);

  function Kick(options) {
    (0, _classCallCheck3.default)(this, Kick);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Kick.__proto__ || (0, _getPrototypeOf2.default)(Kick)).call(this, definitions, options));

    _this.movingMedian = new MovingMedian({
      order: _this.params.get('filterOrder')
    });

    _this._kickStartTime = null;
    _this._lastMedian = 0;
    _this._peak = 0;
    return _this;
  }

  (0, _createClass3.default)(Kick, [{
    key: 'onParamUpdate',
    value: function onParamUpdate(name, value, metas) {
      if (name === 'filterOrder') {
        this.movingMedian.params.set('order', value);
        this.movingMedian.processStreamParams({
          frameType: 'scalar',
          frameSize: 1
        });
      }
    }
  }, {
    key: 'resetStream',
    value: function resetStream() {
      (0, _get3.default)(Kick.prototype.__proto__ || (0, _getPrototypeOf2.default)(Kick.prototype), 'resetStream', this).call(this);
    }
  }, {
    key: 'processStreamParams',
    value: function processStreamParams(prevStreamParams) {
      this.prepareStreamParams(prevStreamParams);

      this.streamParams.frameSize = 2;
      this.streamParams.frameRate = 0;
      this.streamParams.description = ['kick', 'peakIntensity'];

      this.movingMedian.processStreamParams({
        frameType: 'scalar',
        frameSize: 1
      });

      this.propagateStreamParams();
    }
  }, {
    key: 'processVector',
    value: function processVector(frame) {
      var time = frame.time;
      var value = frame.data[0];
      var median = this._lastMedian;
      var delta = value - median;
      var threshold = this.params.get('threshold');
      var minInter = this.params.get('minInter');

      if (delta > threshold) {
        if (this._kickStartTime === null) this._kickStartTime = time;

        if (value > this._peak) {
          this._peak = value;
          // output frame
          this.frame.time = time;
          this.frame.data[0] = 1;
          this.frame.data[1] = this._peak;
          this.propagateFrame();
        }
      } else {
        if (time - this._kickStartTime > minInter && this._kickStartTime !== null) {
          this._kickStartTime = null;
          this._peak = 0;
          // output frame
          this.frame.time = time;
          this.frame.data[0] = 0;
          this.frame.data[1] = 0;
          this.propagateFrame();
        }
      }

      this._lastMedian = this.movingMedian.inputScalar(value);
    }
  }, {
    key: 'processFrame',
    value: function processFrame(frame) {
      this.prepareStreamParams();
      this.processFunction(frame);
    }
  }]);
  return Kick;
}(BaseLfo);

exports.default = Kick;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJNb3ZpbmdNZWRpYW4iLCJvcGVyYXRvciIsImRlZmluaXRpb25zIiwiZmlsdGVyT3JkZXIiLCJ0eXBlIiwiZGVmYXVsdCIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwidGhyZXNob2xkIiwibWluSW50ZXIiLCJLaWNrIiwib3B0aW9ucyIsIm1vdmluZ01lZGlhbiIsIm9yZGVyIiwicGFyYW1zIiwiZ2V0IiwiX2tpY2tTdGFydFRpbWUiLCJfbGFzdE1lZGlhbiIsIl9wZWFrIiwibmFtZSIsInZhbHVlIiwibWV0YXMiLCJzZXQiLCJwcm9jZXNzU3RyZWFtUGFyYW1zIiwiZnJhbWVUeXBlIiwiZnJhbWVTaXplIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwidGltZSIsImRhdGEiLCJtZWRpYW4iLCJkZWx0YSIsInByb3BhZ2F0ZUZyYW1lIiwiaW5wdXRTY2FsYXIiLCJwcm9jZXNzRnVuY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOzs7Ozs7QUFFWixJQUFNQyxVQUFVRCxJQUFJRSxJQUFKLENBQVNELE9BQXpCO0FBQ0EsSUFBTUUsZUFBZUgsSUFBSUksUUFBSixDQUFhRCxZQUFsQzs7QUFFQTs7Ozs7Ozs7Ozs7OztBQWFBLElBQU1FLGNBQWM7QUFDbEJDLGVBQWE7QUFDWEMsVUFBTSxTQURLO0FBRVhDLGFBQVMsQ0FGRTtBQUdYQyxTQUFLLENBSE07QUFJWEMsU0FBSyxDQUFDQztBQUpLLEdBREs7QUFPbEJDLGFBQVc7QUFDVEwsVUFBTSxPQURHO0FBRVRDLGFBQVMsSUFGQTtBQUdUQyxTQUFLLENBSEk7QUFJVEMsU0FBSztBQUpJLEdBUE87QUFh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QixXQUFMLEdBQW1CLEtBQUtMLFlBQUwsQ0FBa0IwQixXQUFsQixDQUE4QmxCLEtBQTlCLENBQW5CO0FBQ0Q7OztpQ0FFWVksSyxFQUFPO0FBQ2xCLFdBQUtMLG1CQUFMO0FBQ0EsV0FBS1ksZUFBTCxDQUFxQlAsS0FBckI7QUFDRDs7O0VBaEZnQm5DLE87O2tCQW1GSmEsSSIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9jb21tb24nO1xuXG5jb25zdCBCYXNlTGZvID0gbGZvLmNvcmUuQmFzZUxmbztcbmNvbnN0IE1vdmluZ01lZGlhbiA9IGxmby5vcGVyYXRvci5Nb3ZpbmdNZWRpYW47XG5cbi8qKlxuICogRmluZCBhIGtpY2sgZnJvbSB0aGUgc2Vuc29ycyB2YWx1ZXMuIFRoZSBtb2R1bGUgbXVzdCBiZSBjb25uZWN0ZWQgdG8gdGhlXG4gKiBvdXRwdXQgb2YgdGhlIGBJbnRlbnNpdHlgIG9wZXJhdG9yLiBUaGUgbW9kdWxlIG91dHB1dHMgd2hlbiBhIGtpY2sgaXMgZm91bmQuXG4gKlxuICogQHBhcmFtIHt9XG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCAqIGFzIGxmb01vdGlvbiBmcm9tICdsZm8tbW90aW9uJztcbiAqXG4gKiBjb25zdCBzZW5zb3JzID0gbmV3IGxmby5zb3VyY2UuTW90aW9uSW5wdXQoKTtcbiAqIGNvbnN0IGludGVuc2l0eSA9IG5ldyBsZm8ub3BlcmF0b3IuSW50ZW5zaXR5KCk7XG4gKlxuICovXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmlsdGVyT3JkZXI6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNSxcbiAgICBtaW46IDEsXG4gICAgbWF4OiArSW5maW5pdHksXG4gIH0sXG4gIHRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4wMSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9LFxuICBtaW5JbnRlcjoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4yLFxuICAgIG1pbjogMCxcbiAgfSxcbn07XG5cbmNsYXNzIEtpY2sgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMubW92aW5nTWVkaWFuID0gbmV3IE1vdmluZ01lZGlhbih7XG4gICAgICBvcmRlcjogdGhpcy5wYXJhbXMuZ2V0KCdmaWx0ZXJPcmRlcicpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fa2lja1N0YXJ0VGltZSA9IG51bGw7XG4gICAgdGhpcy5fbGFzdE1lZGlhbiA9IDA7XG4gICAgdGhpcy5fcGVhayA9IDA7XG4gIH1cblxuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIGlmIChuYW1lID09PSAnZmlsdGVyT3JkZXInKSB7XG4gICAgICB0aGlzLm1vdmluZ01lZGlhbi5wYXJhbXMuc2V0KCdvcmRlcicsIHZhbHVlKTtcbiAgICAgIHRoaXMubW92aW5nTWVkaWFuLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgICBmcmFtZVR5cGU6ICdzY2FsYXInLFxuICAgICAgICBmcmFtZVNpemU6IDEsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXNldFN0cmVhbSgpIHtcbiAgICBzdXBlci5yZXNldFN0cmVhbSgpO1xuICB9XG5cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMjtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAwO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gWydraWNrJywgJ3BlYWtJbnRlbnNpdHknXTtcblxuICAgIHRoaXMubW92aW5nTWVkaWFuLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgZnJhbWVUeXBlOiAnc2NhbGFyJyxcbiAgICAgIGZyYW1lU2l6ZTogMSxcbiAgICB9KTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgdGltZSA9IGZyYW1lLnRpbWU7XG4gICAgY29uc3QgdmFsdWUgPSBmcmFtZS5kYXRhWzBdO1xuICAgIGNvbnN0IG1lZGlhbiA9IHRoaXMuX2xhc3RNZWRpYW47XG4gICAgY29uc3QgZGVsdGEgPSB2YWx1ZSAtIG1lZGlhbjtcbiAgICBjb25zdCB0aHJlc2hvbGQgPSB0aGlzLnBhcmFtcy5nZXQoJ3RocmVzaG9sZCcpO1xuICAgIGNvbnN0IG1pbkludGVyID0gdGhpcy5wYXJhbXMuZ2V0KCdtaW5JbnRlcicpO1xuXG4gICAgaWYgKGRlbHRhID4gdGhyZXNob2xkKSB7XG4gICAgICBpZiAodGhpcy5fa2lja1N0YXJ0VGltZSA9PT0gbnVsbClcbiAgICAgICAgdGhpcy5fa2lja1N0YXJ0VGltZSA9IHRpbWU7XG5cbiAgICAgIGlmICh2YWx1ZSA+IHRoaXMuX3BlYWspIHtcbiAgICAgICAgdGhpcy5fcGVhayA9IHZhbHVlO1xuICAgICAgICAvLyBvdXRwdXQgZnJhbWVcbiAgICAgICAgdGhpcy5mcmFtZS50aW1lID0gdGltZTtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMTtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzFdID0gdGhpcy5fcGVhaztcbiAgICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZcKge1xuICAgICAgaWYgKHRpbWUgLSB0aGlzLl9raWNrU3RhcnRUaW1lID4gbWluSW50ZXIgJiYgdGhpcy5fa2lja1N0YXJ0VGltZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9raWNrU3RhcnRUaW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGVhayA9IDA7XG4gICAgICAgIC8vIG91dHB1dCBmcmFtZVxuICAgICAgICB0aGlzLmZyYW1lLnRpbWUgPSB0aW1lO1xuICAgICAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAwO1xuICAgICAgICB0aGlzLmZyYW1lLmRhdGFbMV0gPSAwO1xuICAgICAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdE1lZGlhbiA9IHRoaXMubW92aW5nTWVkaWFuLmlucHV0U2NhbGFyKHZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcygpO1xuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBLaWNrO1xuIl19