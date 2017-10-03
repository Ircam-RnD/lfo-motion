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

/**
 * Find a kick from the sensors values. The module must be connected to the
 * output of the `Intensity` operator. The module outputs when a kick is found.
 *
 * @param {Object} [options] - Override default options.
 * @param {Number} [options.filterOrder=5] - Buffer size of the internal median filter.
 * @param {Number} [options.threshold=0.01] - Delta intensity threshold above which to trig a kick.
 * @param {Number} [options.minInter=0.2] - Minimum interval between successive trigs in seconds.
 *
 * @example
 * import * as lfo from 'waves-lfo';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const sensors = new lfoMotion.source.MotionInput();
 * const intensity = new lfoMotion.operator.Intensity();
 * const kick = new lfoMotion.operator.Kick();
 * const kickBridge = new lfo.sink.Bridge({
 *   processFrame: frame => {
 *     if (frame[0] === 1)
 *       // do some cool stuff
 *       console.log('kick');
 *   }
 * });
 *
 * sensors.connect(intensity);
 * intensity.connect(kick);
 * kick.connect(kickBridge);
 *
 * sensors.init()
 *   .then(() => {
 *     sensors.start();
 *   });
 */

var Kick = function (_BaseLfo) {
  (0, _inherits3.default)(Kick, _BaseLfo);

  function Kick() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJNb3ZpbmdNZWRpYW4iLCJvcGVyYXRvciIsImRlZmluaXRpb25zIiwiZmlsdGVyT3JkZXIiLCJ0eXBlIiwiZGVmYXVsdCIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwidGhyZXNob2xkIiwibWluSW50ZXIiLCJLaWNrIiwib3B0aW9ucyIsIm1vdmluZ01lZGlhbiIsIm9yZGVyIiwicGFyYW1zIiwiZ2V0IiwiX2tpY2tTdGFydFRpbWUiLCJfbGFzdE1lZGlhbiIsIl9wZWFrIiwibmFtZSIsInZhbHVlIiwibWV0YXMiLCJzZXQiLCJwcm9jZXNzU3RyZWFtUGFyYW1zIiwiZnJhbWVUeXBlIiwiZnJhbWVTaXplIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwidGltZSIsImRhdGEiLCJtZWRpYW4iLCJkZWx0YSIsInByb3BhZ2F0ZUZyYW1lIiwiaW5wdXRTY2FsYXIiLCJwcm9jZXNzRnVuY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztJQUFZQSxHOzs7Ozs7QUFFWixJQUFNQyxVQUFVRCxJQUFJRSxJQUFKLENBQVNELE9BQXpCO0FBQ0EsSUFBTUUsZUFBZUgsSUFBSUksUUFBSixDQUFhRCxZQUFsQzs7QUFFQSxJQUFNRSxjQUFjO0FBQ2xCQyxlQUFhO0FBQ1hDLFVBQU0sU0FESztBQUVYQyxhQUFTLENBRkU7QUFHWEMsU0FBSyxDQUhNO0FBSVhDLFNBQUssQ0FBQ0M7QUFKSyxHQURLO0FBT2xCQyxhQUFXO0FBQ1RMLFVBQU0sT0FERztBQUVUQyxhQUFTLElBRkE7QUFHVEMsU0FBSyxDQUhJO0FBSVRDLFNBQUs7QUFKSSxHQVBPO0FBYWxCRyxZQUFVO0FBQ1JOLFVB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ckI7QUFDQSxlQUFLRyxjQUFMO0FBQ0Q7QUFDRjs7QUFFRCxXQUFLcEIsV0FBTCxHQUFtQixLQUFLTCxZQUFMLENBQWtCMEIsV0FBbEIsQ0FBOEJsQixLQUE5QixDQUFuQjtBQUNEOzs7aUNBRVlZLEssRUFBTztBQUNsQixXQUFLTCxtQkFBTDtBQUNBLFdBQUtZLGVBQUwsQ0FBcUJQLEtBQXJCO0FBQ0Q7OztFQWhGZ0JuQyxPOztrQkFtRkphLEkiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29tbW9uJztcblxuY29uc3QgQmFzZUxmbyA9IGxmby5jb3JlLkJhc2VMZm87XG5jb25zdCBNb3ZpbmdNZWRpYW4gPSBsZm8ub3BlcmF0b3IuTW92aW5nTWVkaWFuO1xuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmlsdGVyT3JkZXI6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNSxcbiAgICBtaW46IDEsXG4gICAgbWF4OiArSW5maW5pdHksXG4gIH0sXG4gIHRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4wMSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9LFxuICBtaW5JbnRlcjoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4yLFxuICAgIG1pbjogMCxcbiAgfSxcbn07XG5cbi8qKlxuICogRmluZCBhIGtpY2sgZnJvbSB0aGUgc2Vuc29ycyB2YWx1ZXMuIFRoZSBtb2R1bGUgbXVzdCBiZSBjb25uZWN0ZWQgdG8gdGhlXG4gKiBvdXRwdXQgb2YgdGhlIGBJbnRlbnNpdHlgIG9wZXJhdG9yLiBUaGUgbW9kdWxlIG91dHB1dHMgd2hlbiBhIGtpY2sgaXMgZm91bmQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIE92ZXJyaWRlIGRlZmF1bHQgb3B0aW9ucy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5maWx0ZXJPcmRlcj01XSAtIEJ1ZmZlciBzaXplIG9mIHRoZSBpbnRlcm5hbCBtZWRpYW4gZmlsdGVyLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnRocmVzaG9sZD0wLjAxXSAtIERlbHRhIGludGVuc2l0eSB0aHJlc2hvbGQgYWJvdmUgd2hpY2ggdG8gdHJpZyBhIGtpY2suXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubWluSW50ZXI9MC4yXSAtIE1pbmltdW0gaW50ZXJ2YWwgYmV0d2VlbiBzdWNjZXNzaXZlIHRyaWdzIGluIHNlY29uZHMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8nO1xuICogaW1wb3J0ICogYXMgbGZvTW90aW9uIGZyb20gJ2xmby1tb3Rpb24nO1xuICpcbiAqIGNvbnN0IHNlbnNvcnMgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3QgaW50ZW5zaXR5ID0gbmV3IGxmb01vdGlvbi5vcGVyYXRvci5JbnRlbnNpdHkoKTtcbiAqIGNvbnN0IGtpY2sgPSBuZXcgbGZvTW90aW9uLm9wZXJhdG9yLktpY2soKTtcbiAqIGNvbnN0IGtpY2tCcmlkZ2UgPSBuZXcgbGZvLnNpbmsuQnJpZGdlKHtcbiAqICAgcHJvY2Vzc0ZyYW1lOiBmcmFtZSA9PiB7XG4gKiAgICAgaWYgKGZyYW1lWzBdID09PSAxKVxuICogICAgICAgLy8gZG8gc29tZSBjb29sIHN0dWZmXG4gKiAgICAgICBjb25zb2xlLmxvZygna2ljaycpO1xuICogICB9XG4gKiB9KTtcbiAqXG4gKiBzZW5zb3JzLmNvbm5lY3QoaW50ZW5zaXR5KTtcbiAqIGludGVuc2l0eS5jb25uZWN0KGtpY2spO1xuICoga2ljay5jb25uZWN0KGtpY2tCcmlkZ2UpO1xuICpcbiAqIHNlbnNvcnMuaW5pdCgpXG4gKiAgIC50aGVuKCgpID0+IHtcbiAqICAgICBzZW5zb3JzLnN0YXJ0KCk7XG4gKiAgIH0pO1xuICovXG5jbGFzcyBLaWNrIGV4dGVuZHMgQmFzZUxmbyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMubW92aW5nTWVkaWFuID0gbmV3IE1vdmluZ01lZGlhbih7XG4gICAgICBvcmRlcjogdGhpcy5wYXJhbXMuZ2V0KCdmaWx0ZXJPcmRlcicpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fa2lja1N0YXJ0VGltZSA9IG51bGw7XG4gICAgdGhpcy5fbGFzdE1lZGlhbiA9IDA7XG4gICAgdGhpcy5fcGVhayA9IDA7XG4gIH1cblxuICBvblBhcmFtVXBkYXRlKG5hbWUsIHZhbHVlLCBtZXRhcykge1xuICAgIGlmIChuYW1lID09PSAnZmlsdGVyT3JkZXInKSB7XG4gICAgICB0aGlzLm1vdmluZ01lZGlhbi5wYXJhbXMuc2V0KCdvcmRlcicsIHZhbHVlKTtcbiAgICAgIHRoaXMubW92aW5nTWVkaWFuLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgICBmcmFtZVR5cGU6ICdzY2FsYXInLFxuICAgICAgICBmcmFtZVNpemU6IDEsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXNldFN0cmVhbSgpIHtcbiAgICBzdXBlci5yZXNldFN0cmVhbSgpO1xuICB9XG5cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKSB7XG4gICAgdGhpcy5wcmVwYXJlU3RyZWFtUGFyYW1zKHByZXZTdHJlYW1QYXJhbXMpO1xuXG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gMjtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAwO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gWydraWNrJywgJ3BlYWtJbnRlbnNpdHknXTtcblxuICAgIHRoaXMubW92aW5nTWVkaWFuLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICAgICAgZnJhbWVUeXBlOiAnc2NhbGFyJyxcbiAgICAgIGZyYW1lU2l6ZTogMSxcbiAgICB9KTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICBwcm9jZXNzVmVjdG9yKGZyYW1lKSB7XG4gICAgY29uc3QgdGltZSA9IGZyYW1lLnRpbWU7XG4gICAgY29uc3QgdmFsdWUgPSBmcmFtZS5kYXRhWzBdO1xuICAgIGNvbnN0IG1lZGlhbiA9IHRoaXMuX2xhc3RNZWRpYW47XG4gICAgY29uc3QgZGVsdGEgPSB2YWx1ZSAtIG1lZGlhbjtcbiAgICBjb25zdCB0aHJlc2hvbGQgPSB0aGlzLnBhcmFtcy5nZXQoJ3RocmVzaG9sZCcpO1xuICAgIGNvbnN0IG1pbkludGVyID0gdGhpcy5wYXJhbXMuZ2V0KCdtaW5JbnRlcicpO1xuXG4gICAgaWYgKGRlbHRhID4gdGhyZXNob2xkKSB7XG4gICAgICBpZiAodGhpcy5fa2lja1N0YXJ0VGltZSA9PT0gbnVsbClcbiAgICAgICAgdGhpcy5fa2lja1N0YXJ0VGltZSA9IHRpbWU7XG5cbiAgICAgIGlmICh2YWx1ZSA+IHRoaXMuX3BlYWspIHtcbiAgICAgICAgdGhpcy5fcGVhayA9IHZhbHVlO1xuICAgICAgICAvLyBvdXRwdXQgZnJhbWVcbiAgICAgICAgdGhpcy5mcmFtZS50aW1lID0gdGltZTtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMTtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzFdID0gdGhpcy5fcGVhaztcbiAgICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZcKge1xuICAgICAgaWYgKHRpbWUgLSB0aGlzLl9raWNrU3RhcnRUaW1lID4gbWluSW50ZXIgJiYgdGhpcy5fa2lja1N0YXJ0VGltZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9raWNrU3RhcnRUaW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGVhayA9IDA7XG4gICAgICAgIC8vIG91dHB1dCBmcmFtZVxuICAgICAgICB0aGlzLmZyYW1lLnRpbWUgPSB0aW1lO1xuICAgICAgICB0aGlzLmZyYW1lLmRhdGFbMF0gPSAwO1xuICAgICAgICB0aGlzLmZyYW1lLmRhdGFbMV0gPSAwO1xuICAgICAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdE1lZGlhbiA9IHRoaXMubW92aW5nTWVkaWFuLmlucHV0U2NhbGFyKHZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NGcmFtZShmcmFtZSkge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcygpO1xuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBLaWNrO1xuIl19