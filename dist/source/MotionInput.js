'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var _motionInput = require('motion-input');

var _motionInput2 = _interopRequireDefault(_motionInput);

var _core = require('waves-lfo/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var definitions = {};

/**
 * Module that wraps the [motion-input](https://github.com/collective-soundworks/motion-input)
 * library and creates a stream of vectors from the accelerometers and gyroscope.
 *
 * Output is defined in the same order, unit and directions as in the
 * [DeviceMotion specification](https://w3c.github.io/deviceorientation/spec-source-orientation.html):
 *
 * * 0 - accelerometer X
 * * 1 - accelerometer Y
 * * 2 - accelerometer Z
 * * 3 - gyro around Z (alpha - yaw)
 * * 4 - gyro around X (beta - pitch)
 * * 5 - gyro around Y (gamma - roll)
 *
 * @memberof source
 *
 * @example
 * import * as lfo from 'waves-lfo';
 * import * as lfoMotion from 'lfo-motion';
 *
 * const motionInput = new lfoMotion.source.MotionInput();
 * const logger = new lfo.sink.Logger({ time: false, data: true });
 *
 * motionInput.connect(logger);
 *
 * motionInput.init()
 *   .then(() => motionInput.start())
 *   .catch(err => console.log(err.stack));
 */

var MotionInput = function (_SourceMixin) {
  (0, _inherits3.default)(MotionInput, _SourceMixin);

  function MotionInput() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MotionInput);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MotionInput.__proto__ || (0, _getPrototypeOf2.default)(MotionInput)).call(this, definitions, options));

    _this._accListener = _this._accListener.bind(_this);
    _this._gyroListener = _this._gyroListener.bind(_this);
    _this._accOnlyListener = _this._accOnlyListener.bind(_this);
    return _this;
  }

  /** @private */


  (0, _createClass3.default)(MotionInput, [{
    key: 'initModule',
    value: function initModule() {
      var _this2 = this;

      var nextPromises = (0, _get3.default)(MotionInput.prototype.__proto__ || (0, _getPrototypeOf2.default)(MotionInput.prototype), 'initModule', this).call(this);

      var promise = new _promise2.default(function (resolve, reject) {
        _motionInput2.default.init(['accelerationIncludingGravity', 'rotationRate']).then(function (_ref) {
          var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
              accelerationIncludingGravity = _ref2[0],
              rotationRate = _ref2[1];

          _this2.accelerationIncludingGravity = accelerationIncludingGravity;
          _this2.rotationRate = rotationRate;
          resolve();
        }).catch(function (err) {
          return console.error(err.stack);
        });
      });

      // nextPromises.push(promise);

      return _promise2.default.all([nextPromises, promise]);
    }

    /** @private */

  }, {
    key: 'processStreamParams',
    value: function processStreamParams() {
      this.streamParams.frameType = 'vector';
      this.streamParams.frameSize = 6;
      this.streamParams.frameRate = 1 / this.accelerationIncludingGravity.period;
      this.streamParams.sourceSampleRate = this.streamParams.frameRate;
      this.streamParams.sourceSampleCount = 1;
      this.streamParams.description = ['accelerationIncludingGravity x', 'accelerationIncludingGravity y', 'accelerationIncludingGravity z', 'rotationRate alpha', 'rotationRate beta', 'rotationRate gamma'];

      this.propagateStreamParams();
    }

    /**
     * Start the stream.
     */

  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      this._startTime = performance.now();

      if (this.initialized === false) {
        if (this.initPromise === null) // init has not yet been called
          this.initPromise = this.init();

        return this.initPromise.then(function () {
          return _this3.start(_this3._startTime);
        });
      }

      var acc = this.accelerationIncludingGravity;
      var rot = this.rotationRate;

      if (acc.isValid && rot.isValid) {
        acc.addListener(this._accListener);
        rot.addListener(this._gyroListener);
      } else if (acc.isValid) {
        acc.addListener(this._accOnlyListener);
      } else {
        throw new Error('The device doesn\'t support the devicemotion API');
      }

      this.started = true;
    }

    /**
     * Stop the stream.
     */

  }, {
    key: 'stop',
    value: function stop() {
      this.started = false;
      this._startTime = null;

      var acc = this.accelerationIncludingGravity;
      var rot = this.rotationRate;

      if (acc.isValid && rot.isValid) {
        acc.removeListener(this._accListener);
        rot.removeListener(this._gyroListener);
      } else if (acc.isValid) {
        acc.removeListener(this._accOnlyListener);
      }
    }

    /** @private */

  }, {
    key: '_accListener',
    value: function _accListener(data) {
      var frame = this.frame;
      frame.time = (performance.now() - this._startTime) / 1000;

      frame.data[0] = data[0];
      frame.data[1] = data[1];
      frame.data[2] = data[2];
    }

    /** @private */

  }, {
    key: '_gyroListener',
    value: function _gyroListener(data) {
      var frame = this.frame;
      frame.data[3] = data[0];
      frame.data[4] = data[1];
      frame.data[5] = data[2];

      this.propagateFrame();
    }

    /** @private */

  }, {
    key: '_accOnlyListener',
    value: function _accOnlyListener(data) {
      var frame = this.frame;
      frame.time = (performance.now() - this._startTime) / 1000;

      frame.data[0] = data[0];
      frame.data[1] = data[1];
      frame.data[2] = data[2];
      frame.data[3] = 0;
      frame.data[4] = 0;
      frame.data[5] = 0;

      this.propagateFrame();
    }
  }]);
  return MotionInput;
}((0, _core.SourceMixin)(_core.BaseLfo));

exports.default = MotionInput;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJNb3Rpb25JbnB1dCIsIm9wdGlvbnMiLCJfYWNjTGlzdGVuZXIiLCJiaW5kIiwiX2d5cm9MaXN0ZW5lciIsIl9hY2NPbmx5TGlzdGVuZXIiLCJuZXh0UHJvbWlzZXMiLCJwcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImluaXQiLCJ0aGVuIiwiYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSIsInJvdGF0aW9uUmF0ZSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwiZXJyIiwic3RhY2siLCJhbGwiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVR5cGUiLCJmcmFtZVNpemUiLCJmcmFtZVJhdGUiLCJwZXJpb2QiLCJzb3VyY2VTYW1wbGVSYXRlIiwic291cmNlU2FtcGxlQ291bnQiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsIl9zdGFydFRpbWUiLCJwZXJmb3JtYW5jZSIsIm5vdyIsImluaXRpYWxpemVkIiwiaW5pdFByb21pc2UiLCJzdGFydCIsImFjYyIsInJvdCIsImlzVmFsaWQiLCJhZGRMaXN0ZW5lciIsIkVycm9yIiwic3RhcnRlZCIsInJlbW92ZUxpc3RlbmVyIiwiZGF0YSIsImZyYW1lIiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE2Qk1DLFc7OztBQUNKLHlCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUFBLGdKQUNsQkYsV0FEa0IsRUFDTEUsT0FESzs7QUFHeEIsVUFBS0MsWUFBTCxHQUFvQixNQUFLQSxZQUFMLENBQWtCQyxJQUFsQixPQUFwQjtBQUNBLFVBQUtDLGFBQUwsR0FBcUIsTUFB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LFlBQU1ELElBQU4sQ0FBVyxDQUFYLElBQWdCLENBQWhCO0FBQ0FDLFlBQU1ELElBQU4sQ0FBVyxDQUFYLElBQWdCLENBQWhCO0FBQ0FDLFlBQU1ELElBQU4sQ0FBVyxDQUFYLElBQWdCLENBQWhCOztBQUVBLFdBQUtHLGNBQUw7QUFDRDs7O0VBL0h1QixxQzs7a0JBa0lYN0MsVyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vdGlvbklucHV0IGZyb20gJ21vdGlvbi1pbnB1dCc7XG5pbXBvcnQgeyBCYXNlTGZvLCBTb3VyY2VNaXhpbiB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7fTtcblxuLyoqXG4gKiBNb2R1bGUgdGhhdCB3cmFwcyB0aGUgW21vdGlvbi1pbnB1dF0oaHR0cHM6Ly9naXRodWIuY29tL2NvbGxlY3RpdmUtc291bmR3b3Jrcy9tb3Rpb24taW5wdXQpXG4gKiBsaWJyYXJ5IGFuZCBjcmVhdGVzIGEgc3RyZWFtIG9mIHZlY3RvcnMgZnJvbSB0aGUgYWNjZWxlcm9tZXRlcnMgYW5kIGd5cm9zY29wZS5cbiAqXG4gKiBPdXRwdXQgaXMgZGVmaW5lZCBpbiB0aGUgc2FtZSBvcmRlciwgdW5pdCBhbmQgZGlyZWN0aW9ucyBhcyBpbiB0aGVcbiAqIFtEZXZpY2VNb3Rpb24gc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly93M2MuZ2l0aHViLmlvL2RldmljZW9yaWVudGF0aW9uL3NwZWMtc291cmNlLW9yaWVudGF0aW9uLmh0bWwpOlxuICpcbiAqICogMCAtIGFjY2VsZXJvbWV0ZXIgWFxuICogKiAxIC0gYWNjZWxlcm9tZXRlciBZXG4gKiAqIDIgLSBhY2NlbGVyb21ldGVyIFpcbiAqICogMyAtIGd5cm8gYXJvdW5kIFogKGFscGhhIC0geWF3KVxuICogKiA0IC0gZ3lybyBhcm91bmQgWCAoYmV0YSAtIHBpdGNoKVxuICogKiA1IC0gZ3lybyBhcm91bmQgWSAoZ2FtbWEgLSByb2xsKVxuICpcbiAqIEBtZW1iZXJvZiBzb3VyY2VcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmbyc7XG4gKiBpbXBvcnQgKiBhcyBsZm9Nb3Rpb24gZnJvbSAnbGZvLW1vdGlvbic7XG4gKlxuICogY29uc3QgbW90aW9uSW5wdXQgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3QgbG9nZ2VyID0gbmV3IGxmby5zaW5rLkxvZ2dlcih7IHRpbWU6IGZhbHNlLCBkYXRhOiB0cnVlIH0pO1xuICpcbiAqIG1vdGlvbklucHV0LmNvbm5lY3QobG9nZ2VyKTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5pbml0KClcbiAqICAgLnRoZW4oKCkgPT4gbW90aW9uSW5wdXQuc3RhcnQoKSlcbiAqICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIuc3RhY2spKTtcbiAqL1xuY2xhc3MgTW90aW9uSW5wdXQgZXh0ZW5kcyBTb3VyY2VNaXhpbihCYXNlTGZvKSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2FjY0xpc3RlbmVyID0gdGhpcy5fYWNjTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9neXJvTGlzdGVuZXIgPSB0aGlzLl9neXJvTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9hY2NPbmx5TGlzdGVuZXIgPSB0aGlzLl9hY2NPbmx5TGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBpbml0TW9kdWxlKCkge1xuICAgIGNvbnN0IG5leHRQcm9taXNlcyA9IHN1cGVyLmluaXRNb2R1bGUoKTtcblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBtb3Rpb25JbnB1dFxuICAgICAgICAuaW5pdChbJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHknLCAncm90YXRpb25SYXRlJ10pXG4gICAgICAgIC50aGVuKChbYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSwgcm90YXRpb25SYXRlXSkgPT4ge1xuICAgICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSA9IGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gICAgICAgICAgdGhpcy5yb3RhdGlvblJhdGUgPSByb3RhdGlvblJhdGU7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKSk7XG4gICAgfSk7XG5cbiAgICAvLyBuZXh0UHJvbWlzZXMucHVzaChwcm9taXNlKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChbbmV4dFByb21pc2VzLCBwcm9taXNlXSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcygpIHtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVR5cGUgPSAndmVjdG9yJztcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSA2O1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IDEgLyB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkucGVyaW9kO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGU7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlQ291bnQgPSAxO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gW1xuICAgICAgJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgeCcsXG4gICAgICAnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSB5JyxcbiAgICAgICdhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5IHonLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBhbHBoYScsXG4gICAgICAncm90YXRpb25SYXRlIGJldGEnLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBnYW1tYScsXG4gICAgXTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdGhlIHN0cmVhbS5cbiAgICovXG4gIHN0YXJ0KCkge1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQgPT09IGZhbHNlKSB7XG4gICAgICBpZiAodGhpcy5pbml0UHJvbWlzZSA9PT0gbnVsbCkgLy8gaW5pdCBoYXMgbm90IHlldCBiZWVuIGNhbGxlZFxuICAgICAgICB0aGlzLmluaXRQcm9taXNlID0gdGhpcy5pbml0KCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmluaXRQcm9taXNlLnRoZW4oKCkgPT4gdGhpcy5zdGFydCh0aGlzLl9zdGFydFRpbWUpKTtcbiAgICB9XG5cbiAgICBjb25zdCBhY2MgPSB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gICAgY29uc3Qgcm90ID0gdGhpcy5yb3RhdGlvblJhdGU7XG5cbiAgICBpZiAoYWNjLmlzVmFsaWQgJiYgcm90LmlzVmFsaWQpIHtcbiAgICAgIGFjYy5hZGRMaXN0ZW5lcih0aGlzLl9hY2NMaXN0ZW5lcik7XG4gICAgICByb3QuYWRkTGlzdGVuZXIodGhpcy5fZ3lyb0xpc3RlbmVyKTtcbiAgICB9IGVsc2UgaWYgKGFjYy5pc1ZhbGlkKSB7XG4gICAgICBhY2MuYWRkTGlzdGVuZXIodGhpcy5fYWNjT25seUxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZGV2aWNlIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgZGV2aWNlbW90aW9uIEFQSWApO1xuICAgIH1cblxuICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU3RvcCB0aGUgc3RyZWFtLlxuICAgKi9cbiAgc3RvcCgpIHtcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zdGFydFRpbWUgPSBudWxsO1xuXG4gICAgY29uc3QgYWNjID0gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICAgIGNvbnN0IHJvdCA9IHRoaXMucm90YXRpb25SYXRlO1xuXG4gICAgaWYgKGFjYy5pc1ZhbGlkICYmIHJvdC5pc1ZhbGlkKSB7XG4gICAgICBhY2MucmVtb3ZlTGlzdGVuZXIodGhpcy5fYWNjTGlzdGVuZXIpO1xuICAgICAgcm90LnJlbW92ZUxpc3RlbmVyKHRoaXMuX2d5cm9MaXN0ZW5lcik7XG4gICAgfSBlbHNlIGlmIChhY2MuaXNWYWxpZCkge1xuICAgICAgYWNjLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2FjY09ubHlMaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9hY2NMaXN0ZW5lcihkYXRhKSB7XG4gICAgY29uc3QgZnJhbWUgPSB0aGlzLmZyYW1lO1xuICAgIGZyYW1lLnRpbWUgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWUpIC8gMTAwMDtcblxuICAgIGZyYW1lLmRhdGFbMF0gPSBkYXRhWzBdO1xuICAgIGZyYW1lLmRhdGFbMV0gPSBkYXRhWzFdO1xuICAgIGZyYW1lLmRhdGFbMl0gPSBkYXRhWzJdO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9neXJvTGlzdGVuZXIoZGF0YSkge1xuICAgIGNvbnN0IGZyYW1lID0gdGhpcy5mcmFtZTtcbiAgICBmcmFtZS5kYXRhWzNdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzRdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzVdID0gZGF0YVsyXTtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfYWNjT25seUxpc3RlbmVyKGRhdGEpIHtcbiAgICBjb25zdCBmcmFtZSA9IHRoaXMuZnJhbWU7XG4gICAgZnJhbWUudGltZSA9IChwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZSkgLyAxMDAwO1xuXG4gICAgZnJhbWUuZGF0YVswXSA9IGRhdGFbMF07XG4gICAgZnJhbWUuZGF0YVsxXSA9IGRhdGFbMV07XG4gICAgZnJhbWUuZGF0YVsyXSA9IGRhdGFbMl07XG4gICAgZnJhbWUuZGF0YVszXSA9IDA7XG4gICAgZnJhbWUuZGF0YVs0XSA9IDA7XG4gICAgZnJhbWUuZGF0YVs1XSA9IDA7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW90aW9uSW5wdXQ7XG4iXX0=