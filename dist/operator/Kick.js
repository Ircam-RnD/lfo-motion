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
 * @memberof operator
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
 * const bridge = new lfo.sink.Bridge({
 *   processFrame: frame => {
 *     if (frame[0] === 1)
 *       // do some cool stuff
 *       console.log('kick');
 *   }
 * });
 *
 * sensors.connect(intensity);
 * intensity.connect(kick);
 * kick.connect(bridge);
 *
 * sensors.init().then(() => sensors.start());
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
      this.prepareFrame();
      this.processFunction(frame);
    }
  }]);
  return Kick;
}(BaseLfo);

exports.default = Kick;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibGZvIiwiQmFzZUxmbyIsImNvcmUiLCJNb3ZpbmdNZWRpYW4iLCJvcGVyYXRvciIsImRlZmluaXRpb25zIiwiZmlsdGVyT3JkZXIiLCJ0eXBlIiwiZGVmYXVsdCIsIm1pbiIsIm1heCIsIkluZmluaXR5IiwidGhyZXNob2xkIiwibWluSW50ZXIiLCJLaWNrIiwib3B0aW9ucyIsIm1vdmluZ01lZGlhbiIsIm9yZGVyIiwicGFyYW1zIiwiZ2V0IiwiX2tpY2tTdGFydFRpbWUiLCJfbGFzdE1lZGlhbiIsIl9wZWFrIiwibmFtZSIsInZhbHVlIiwibWV0YXMiLCJzZXQiLCJwcm9jZXNzU3RyZWFtUGFyYW1zIiwiZnJhbWVUeXBlIiwiZnJhbWVTaXplIiwicHJldlN0cmVhbVBhcmFtcyIsInByZXBhcmVTdHJlYW1QYXJhbXMiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVJhdGUiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsImZyYW1lIiwidGltZSIsImRhdGEiLCJtZWRpYW4iLCJkZWx0YSIsInByb3BhZ2F0ZUZyYW1lIiwiaW5wdXRTY2FsYXIiLCJwcmVwYXJlRnJhbWUiLCJwcm9jZXNzRnVuY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0lBQVlBLEc7Ozs7OztBQUVaLElBQU1DLFVBQVVELElBQUlFLElBQUosQ0FBU0QsT0FBekI7QUFDQSxJQUFNRSxlQUFlSCxJQUFJSSxRQUFKLENBQWFELFlBQWxDOztBQUVBLElBQU1FLGNBQWM7QUFDbEJDLGVBQWE7QUFDWEMsVUFBTSxTQURLO0FBRVhDLGFBQVMsQ0FGRTtBQUdYQyxTQUFLLENBSE07QUFJWEMsU0FBSyxDQUFDQztBQUpLLEdBREs7QUFPbEJDLGFBQVc7QUFDVEwsVUFBTSxPQURHO0FBRVRDLGFBQVMsSUFGQTtBQUdUQyxTQUFLLENBSEk7QUFJVEMsU0FBSztBQUpJLEdBUE87QUFhbEJHLFlB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ZUFBS0csY0FBTDtBQUNEO0FBQ0Y7O0FBRUQsV0FBS3BCLFdBQUwsR0FBbUIsS0FBS0wsWUFBTCxDQUFrQjBCLFdBQWxCLENBQThCbEIsS0FBOUIsQ0FBbkI7QUFDRDs7O2lDQUVZWSxLLEVBQU87QUFDbEIsV0FBS08sWUFBTDtBQUNBLFdBQUtDLGVBQUwsQ0FBcUJSLEtBQXJCO0FBQ0Q7OztFQTVFZ0JuQyxPOztrQkErRUphLEkiLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8vY29tbW9uJztcblxuY29uc3QgQmFzZUxmbyA9IGxmby5jb3JlLkJhc2VMZm87XG5jb25zdCBNb3ZpbmdNZWRpYW4gPSBsZm8ub3BlcmF0b3IuTW92aW5nTWVkaWFuO1xuXG5jb25zdCBkZWZpbml0aW9ucyA9IHtcbiAgZmlsdGVyT3JkZXI6IHtcbiAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgZGVmYXVsdDogNSxcbiAgICBtaW46IDEsXG4gICAgbWF4OiArSW5maW5pdHksXG4gIH0sXG4gIHRocmVzaG9sZDoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4wMSxcbiAgICBtaW46IDAsXG4gICAgbWF4OiAxLFxuICB9LFxuICBtaW5JbnRlcjoge1xuICAgIHR5cGU6ICdmbG9hdCcsXG4gICAgZGVmYXVsdDogMC4yLFxuICAgIG1pbjogMCxcbiAgfSxcbn07XG5cbi8qKlxuICogRmluZCBhIGtpY2sgZnJvbSB0aGUgc2Vuc29ycyB2YWx1ZXMuIFRoZSBtb2R1bGUgbXVzdCBiZSBjb25uZWN0ZWQgdG8gdGhlXG4gKiBvdXRwdXQgb2YgdGhlIGBJbnRlbnNpdHlgIG9wZXJhdG9yLiBUaGUgbW9kdWxlIG91dHB1dHMgd2hlbiBhIGtpY2sgaXMgZm91bmQuXG4gKlxuICogQG1lbWJlcm9mIG9wZXJhdG9yXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIE92ZXJyaWRlIGRlZmF1bHQgb3B0aW9ucy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5maWx0ZXJPcmRlcj01XSAtIEJ1ZmZlciBzaXplIG9mIHRoZSBpbnRlcm5hbCBtZWRpYW4gZmlsdGVyLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnRocmVzaG9sZD0wLjAxXSAtIERlbHRhIGludGVuc2l0eSB0aHJlc2hvbGQgYWJvdmUgd2hpY2ggdG8gdHJpZyBhIGtpY2suXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubWluSW50ZXI9MC4yXSAtIE1pbmltdW0gaW50ZXJ2YWwgYmV0d2VlbiBzdWNjZXNzaXZlIHRyaWdzIGluIHNlY29uZHMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8nO1xuICogaW1wb3J0ICogYXMgbGZvTW90aW9uIGZyb20gJ2xmby1tb3Rpb24nO1xuICpcbiAqIGNvbnN0IHNlbnNvcnMgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3QgaW50ZW5zaXR5ID0gbmV3IGxmb01vdGlvbi5vcGVyYXRvci5JbnRlbnNpdHkoKTtcbiAqIGNvbnN0IGtpY2sgPSBuZXcgbGZvTW90aW9uLm9wZXJhdG9yLktpY2soKTtcbiAqIGNvbnN0IGJyaWRnZSA9IG5ldyBsZm8uc2luay5CcmlkZ2Uoe1xuICogICBwcm9jZXNzRnJhbWU6IGZyYW1lID0+IHtcbiAqICAgICBpZiAoZnJhbWVbMF0gPT09IDEpXG4gKiAgICAgICAvLyBkbyBzb21lIGNvb2wgc3R1ZmZcbiAqICAgICAgIGNvbnNvbGUubG9nKCdraWNrJyk7XG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqIHNlbnNvcnMuY29ubmVjdChpbnRlbnNpdHkpO1xuICogaW50ZW5zaXR5LmNvbm5lY3Qoa2ljayk7XG4gKiBraWNrLmNvbm5lY3QoYnJpZGdlKTtcbiAqXG4gKiBzZW5zb3JzLmluaXQoKS50aGVuKCgpID0+IHNlbnNvcnMuc3RhcnQoKSk7XG4gKi9cbmNsYXNzIEtpY2sgZXh0ZW5kcyBCYXNlTGZvIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoZGVmaW5pdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5tb3ZpbmdNZWRpYW4gPSBuZXcgTW92aW5nTWVkaWFuKHtcbiAgICAgIG9yZGVyOiB0aGlzLnBhcmFtcy5nZXQoJ2ZpbHRlck9yZGVyJyksXG4gICAgfSk7XG5cbiAgICB0aGlzLl9raWNrU3RhcnRUaW1lID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0TWVkaWFuID0gMDtcbiAgICB0aGlzLl9wZWFrID0gMDtcbiAgfVxuXG4gIG9uUGFyYW1VcGRhdGUobmFtZSwgdmFsdWUsIG1ldGFzKSB7XG4gICAgaWYgKG5hbWUgPT09ICdmaWx0ZXJPcmRlcicpIHtcbiAgICAgIHRoaXMubW92aW5nTWVkaWFuLnBhcmFtcy5zZXQoJ29yZGVyJywgdmFsdWUpO1xuICAgICAgdGhpcy5tb3ZpbmdNZWRpYW4ucHJvY2Vzc1N0cmVhbVBhcmFtcyh7XG4gICAgICAgIGZyYW1lVHlwZTogJ3NjYWxhcicsXG4gICAgICAgIGZyYW1lU2l6ZTogMSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMocHJldlN0cmVhbVBhcmFtcykge1xuICAgIHRoaXMucHJlcGFyZVN0cmVhbVBhcmFtcyhwcmV2U3RyZWFtUGFyYW1zKTtcblxuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lU2l6ZSA9IDI7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlID0gMDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbiA9IFsna2ljaycsICdwZWFrSW50ZW5zaXR5J107XG5cbiAgICB0aGlzLm1vdmluZ01lZGlhbi5wcm9jZXNzU3RyZWFtUGFyYW1zKHtcbiAgICAgIGZyYW1lVHlwZTogJ3NjYWxhcicsXG4gICAgICBmcmFtZVNpemU6IDEsXG4gICAgfSk7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgcHJvY2Vzc1ZlY3RvcihmcmFtZSkge1xuICAgIGNvbnN0IHRpbWUgPSBmcmFtZS50aW1lO1xuICAgIGNvbnN0IHZhbHVlID0gZnJhbWUuZGF0YVswXTtcbiAgICBjb25zdCBtZWRpYW4gPSB0aGlzLl9sYXN0TWVkaWFuO1xuICAgIGNvbnN0IGRlbHRhID0gdmFsdWUgLSBtZWRpYW47XG4gICAgY29uc3QgdGhyZXNob2xkID0gdGhpcy5wYXJhbXMuZ2V0KCd0aHJlc2hvbGQnKTtcbiAgICBjb25zdCBtaW5JbnRlciA9IHRoaXMucGFyYW1zLmdldCgnbWluSW50ZXInKTtcblxuICAgIGlmIChkZWx0YSA+IHRocmVzaG9sZCkge1xuICAgICAgaWYgKHRoaXMuX2tpY2tTdGFydFRpbWUgPT09IG51bGwpXG4gICAgICAgIHRoaXMuX2tpY2tTdGFydFRpbWUgPSB0aW1lO1xuXG4gICAgICBpZiAodmFsdWUgPiB0aGlzLl9wZWFrKSB7XG4gICAgICAgIHRoaXMuX3BlYWsgPSB2YWx1ZTtcbiAgICAgICAgLy8gb3V0cHV0IGZyYW1lXG4gICAgICAgIHRoaXMuZnJhbWUudGltZSA9IHRpbWU7XG4gICAgICAgIHRoaXMuZnJhbWUuZGF0YVswXSA9IDE7XG4gICAgICAgIHRoaXMuZnJhbWUuZGF0YVsxXSA9IHRoaXMuX3BlYWs7XG4gICAgICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2XCoHtcbiAgICAgIGlmICh0aW1lIC0gdGhpcy5fa2lja1N0YXJ0VGltZSA+IG1pbkludGVyICYmIHRoaXMuX2tpY2tTdGFydFRpbWUgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fa2lja1N0YXJ0VGltZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3BlYWsgPSAwO1xuICAgICAgICAvLyBvdXRwdXQgZnJhbWVcbiAgICAgICAgdGhpcy5mcmFtZS50aW1lID0gdGltZTtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzBdID0gMDtcbiAgICAgICAgdGhpcy5mcmFtZS5kYXRhWzFdID0gMDtcbiAgICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2xhc3RNZWRpYW4gPSB0aGlzLm1vdmluZ01lZGlhbi5pbnB1dFNjYWxhcih2YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzRnJhbWUoZnJhbWUpIHtcbiAgICB0aGlzLnByZXBhcmVGcmFtZSgpO1xuICAgIHRoaXMucHJvY2Vzc0Z1bmN0aW9uKGZyYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBLaWNrO1xuIl19