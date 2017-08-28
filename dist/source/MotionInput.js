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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJNb3Rpb25JbnB1dCIsIm9wdGlvbnMiLCJfYWNjTGlzdGVuZXIiLCJiaW5kIiwiX2d5cm9MaXN0ZW5lciIsIl9hY2NPbmx5TGlzdGVuZXIiLCJuZXh0UHJvbWlzZXMiLCJwcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImluaXQiLCJ0aGVuIiwiYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSIsInJvdGF0aW9uUmF0ZSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwiZXJyIiwic3RhY2siLCJhbGwiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVR5cGUiLCJmcmFtZVNpemUiLCJmcmFtZVJhdGUiLCJwZXJpb2QiLCJzb3VyY2VTYW1wbGVSYXRlIiwic291cmNlU2FtcGxlQ291bnQiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsIl9zdGFydFRpbWUiLCJwZXJmb3JtYW5jZSIsIm5vdyIsImluaXRpYWxpemVkIiwiaW5pdFByb21pc2UiLCJzdGFydCIsImFjYyIsInJvdCIsImlzVmFsaWQiLCJhZGRMaXN0ZW5lciIsIkVycm9yIiwic3RhcnRlZCIsInJlbW92ZUxpc3RlbmVyIiwiZGF0YSIsImZyYW1lIiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBMkJNQyxXOzs7QUFDSix5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSxnSkFDbEJGLFdBRGtCLEVBQ0xFLE9BREs7O0FBR3hCLFVBQUtDLFlBQUwsR0FBb0IsTUFBS0EsWUFBTCxDQUFrQkMsSUFBbEIsT0FBcEI7QUFDQSxVQUFLQyxhQUFMLEdBQXFCLE1BQUtB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QUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjtBQUNBQyxZQUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjtBQUNBQyxZQUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjs7QUFFQSxXQUFLRyxjQUFMO0FBQ0Q7OztFQS9IdUIscUM7O2tCQWtJWDdDLFciLCJmaWxlIjoiX25hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb3Rpb25JbnB1dCBmcm9tICdtb3Rpb24taW5wdXQnO1xuaW1wb3J0IHsgQmFzZUxmbywgU291cmNlTWl4aW4gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5cbmNvbnN0IGRlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogTW9kdWxlIHRoYXQgd3JhcHMgdGhlIFttb3Rpb24taW5wdXRdKGh0dHBzOi8vZ2l0aHViLmNvbS9jb2xsZWN0aXZlLXNvdW5kd29ya3MvbW90aW9uLWlucHV0KVxuICogbGlicmFyeSBhbmQgY3JlYXRlcyBhIHN0cmVhbSBvZiB2ZWN0b3JzIGZyb20gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKlxuICogT3V0cHV0IGlzIGRlZmluZWQgaW4gdGhlIHNhbWUgb3JkZXIsIHVuaXQgYW5kIGRpcmVjdGlvbnMgYXMgaW4gdGhlXG4gKiBbRGV2aWNlTW90aW9uIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9kZXZpY2VvcmllbnRhdGlvbi9zcGVjLXNvdXJjZS1vcmllbnRhdGlvbi5odG1sKTpcbiAqXG4gKiAqIDAgLSBhY2NlbGVyb21ldGVyIFhcbiAqICogMSAtIGFjY2VsZXJvbWV0ZXIgWVxuICogKiAyIC0gYWNjZWxlcm9tZXRlciBaXG4gKiAqIDMgLSBneXJvIGFyb3VuZCBaIChhbHBoYSAtIHlhdylcbiAqICogNCAtIGd5cm8gYXJvdW5kIFggKGJldGEgLSBwaXRjaClcbiAqICogNSAtIGd5cm8gYXJvdW5kIFkgKGdhbW1hIC0gcm9sbClcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmbyc7XG4gKiBpbXBvcnQgKiBhcyBsZm9Nb3Rpb24gZnJvbSAnbGZvLW1vdGlvbic7XG4gKlxuICogY29uc3QgbW90aW9uSW5wdXQgPSBuZXcgbGZvTW90aW9uLnNvdXJjZS5Nb3Rpb25JbnB1dCgpO1xuICogY29uc3QgbG9nZ2VyID0gbmV3IGxmby5zaW5rLkxvZ2dlcih7IHRpbWU6IGZhbHNlLCBkYXRhOiB0cnVlIH0pO1xuICpcbiAqIG1vdGlvbklucHV0LmNvbm5lY3QobG9nZ2VyKTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5pbml0KClcbiAqICAgLnRoZW4oKCkgPT4gbW90aW9uSW5wdXQuc3RhcnQoKSlcbiAqICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIuc3RhY2spKTtcbiAqL1xuY2xhc3MgTW90aW9uSW5wdXQgZXh0ZW5kcyBTb3VyY2VNaXhpbihCYXNlTGZvKSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2FjY0xpc3RlbmVyID0gdGhpcy5fYWNjTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9neXJvTGlzdGVuZXIgPSB0aGlzLl9neXJvTGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9hY2NPbmx5TGlzdGVuZXIgPSB0aGlzLl9hY2NPbmx5TGlzdGVuZXIuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBpbml0TW9kdWxlKCkge1xuICAgIGNvbnN0IG5leHRQcm9taXNlcyA9IHN1cGVyLmluaXRNb2R1bGUoKTtcblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBtb3Rpb25JbnB1dFxuICAgICAgICAuaW5pdChbJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHknLCAncm90YXRpb25SYXRlJ10pXG4gICAgICAgIC50aGVuKChbYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSwgcm90YXRpb25SYXRlXSkgPT4ge1xuICAgICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSA9IGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gICAgICAgICAgdGhpcy5yb3RhdGlvblJhdGUgPSByb3RhdGlvblJhdGU7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKSk7XG4gICAgfSk7XG5cbiAgICAvLyBuZXh0UHJvbWlzZXMucHVzaChwcm9taXNlKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChbbmV4dFByb21pc2VzLCBwcm9taXNlXSk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgcHJvY2Vzc1N0cmVhbVBhcmFtcygpIHtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVR5cGUgPSAndmVjdG9yJztcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVNpemUgPSA2O1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmZyYW1lUmF0ZSA9IDEgLyB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkucGVyaW9kO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZVJhdGUgPSB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGU7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuc291cmNlU2FtcGxlQ291bnQgPSAxO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLmRlc2NyaXB0aW9uID0gW1xuICAgICAgJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgeCcsXG4gICAgICAnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSB5JyxcbiAgICAgICdhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5IHonLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBhbHBoYScsXG4gICAgICAncm90YXRpb25SYXRlIGJldGEnLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBnYW1tYScsXG4gICAgXTtcblxuICAgIHRoaXMucHJvcGFnYXRlU3RyZWFtUGFyYW1zKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdGhlIHN0cmVhbS5cbiAgICovXG4gIHN0YXJ0KCkge1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQgPT09IGZhbHNlKSB7XG4gICAgICBpZiAodGhpcy5pbml0UHJvbWlzZSA9PT0gbnVsbCkgLy8gaW5pdCBoYXMgbm90IHlldCBiZWVuIGNhbGxlZFxuICAgICAgICB0aGlzLmluaXRQcm9taXNlID0gdGhpcy5pbml0KCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmluaXRQcm9taXNlLnRoZW4oKCkgPT4gdGhpcy5zdGFydCh0aGlzLl9zdGFydFRpbWUpKTtcbiAgICB9XG5cbiAgICBjb25zdCBhY2MgPSB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gICAgY29uc3Qgcm90ID0gdGhpcy5yb3RhdGlvblJhdGU7XG5cbiAgICBpZiAoYWNjLmlzVmFsaWQgJiYgcm90LmlzVmFsaWQpIHtcbiAgICAgIGFjYy5hZGRMaXN0ZW5lcih0aGlzLl9hY2NMaXN0ZW5lcik7XG4gICAgICByb3QuYWRkTGlzdGVuZXIodGhpcy5fZ3lyb0xpc3RlbmVyKTtcbiAgICB9IGVsc2UgaWYgKGFjYy5pc1ZhbGlkKSB7XG4gICAgICBhY2MuYWRkTGlzdGVuZXIodGhpcy5fYWNjT25seUxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZGV2aWNlIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgZGV2aWNlbW90aW9uIEFQSWApO1xuICAgIH1cblxuICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU3RvcCB0aGUgc3RyZWFtLlxuICAgKi9cbiAgc3RvcCgpIHtcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zdGFydFRpbWUgPSBudWxsO1xuXG4gICAgY29uc3QgYWNjID0gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICAgIGNvbnN0IHJvdCA9IHRoaXMucm90YXRpb25SYXRlO1xuXG4gICAgaWYgKGFjYy5pc1ZhbGlkICYmIHJvdC5pc1ZhbGlkKSB7XG4gICAgICBhY2MucmVtb3ZlTGlzdGVuZXIodGhpcy5fYWNjTGlzdGVuZXIpO1xuICAgICAgcm90LnJlbW92ZUxpc3RlbmVyKHRoaXMuX2d5cm9MaXN0ZW5lcik7XG4gICAgfSBlbHNlIGlmIChhY2MuaXNWYWxpZCkge1xuICAgICAgYWNjLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2FjY09ubHlMaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9hY2NMaXN0ZW5lcihkYXRhKSB7XG4gICAgY29uc3QgZnJhbWUgPSB0aGlzLmZyYW1lO1xuICAgIGZyYW1lLnRpbWUgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWUpIC8gMTAwMDtcblxuICAgIGZyYW1lLmRhdGFbMF0gPSBkYXRhWzBdO1xuICAgIGZyYW1lLmRhdGFbMV0gPSBkYXRhWzFdO1xuICAgIGZyYW1lLmRhdGFbMl0gPSBkYXRhWzJdO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIF9neXJvTGlzdGVuZXIoZGF0YSkge1xuICAgIGNvbnN0IGZyYW1lID0gdGhpcy5mcmFtZTtcbiAgICBmcmFtZS5kYXRhWzNdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzRdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzVdID0gZGF0YVsyXTtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfYWNjT25seUxpc3RlbmVyKGRhdGEpIHtcbiAgICBjb25zdCBmcmFtZSA9IHRoaXMuZnJhbWU7XG4gICAgZnJhbWUudGltZSA9IChwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZSkgLyAxMDAwO1xuXG4gICAgZnJhbWUuZGF0YVswXSA9IGRhdGFbMF07XG4gICAgZnJhbWUuZGF0YVsxXSA9IGRhdGFbMV07XG4gICAgZnJhbWUuZGF0YVsyXSA9IGRhdGFbMl07XG4gICAgZnJhbWUuZGF0YVszXSA9IDA7XG4gICAgZnJhbWUuZGF0YVs0XSA9IDA7XG4gICAgZnJhbWUuZGF0YVs1XSA9IDA7XG5cbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW90aW9uSW5wdXQ7XG4iXX0=