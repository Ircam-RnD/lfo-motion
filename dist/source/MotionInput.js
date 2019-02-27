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

var _motionInput = require('@ircam/motion-input');

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJNb3Rpb25JbnB1dCIsIm9wdGlvbnMiLCJfYWNjTGlzdGVuZXIiLCJiaW5kIiwiX2d5cm9MaXN0ZW5lciIsIl9hY2NPbmx5TGlzdGVuZXIiLCJuZXh0UHJvbWlzZXMiLCJwcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm1vdGlvbklucHV0IiwiaW5pdCIsInRoZW4iLCJhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5Iiwicm90YXRpb25SYXRlIiwiY2F0Y2giLCJjb25zb2xlIiwiZXJyb3IiLCJlcnIiLCJzdGFjayIsImFsbCIsInN0cmVhbVBhcmFtcyIsImZyYW1lVHlwZSIsImZyYW1lU2l6ZSIsImZyYW1lUmF0ZSIsInBlcmlvZCIsInNvdXJjZVNhbXBsZVJhdGUiLCJzb3VyY2VTYW1wbGVDb3VudCIsImRlc2NyaXB0aW9uIiwicHJvcGFnYXRlU3RyZWFtUGFyYW1zIiwiX3N0YXJ0VGltZSIsInBlcmZvcm1hbmNlIiwibm93IiwiaW5pdGlhbGl6ZWQiLCJpbml0UHJvbWlzZSIsInN0YXJ0IiwiYWNjIiwicm90IiwiaXNWYWxpZCIsImFkZExpc3RlbmVyIiwiRXJyb3IiLCJzdGFydGVkIiwicmVtb3ZlTGlzdGVuZXIiLCJkYXRhIiwiZnJhbWUiLCJ0aW1lIiwicHJvcGFnYXRlRnJhbWUiLCJCYXNlTGZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE2Qk1DLFc7OztBQUNKLHlCQUEwQjtBQUFBLFFBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUFBOztBQUFBLGdKQUNsQkYsV0FEa0IsRUFDTEUsT0FESzs7QUFHeEIsVUFBS0MsWUFBTCxHQUFvQixNQUFLQSxZQUFMLENBQWtCQyxJQUFsQixPQUFwQjtB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Z0JBLEtBQUssQ0FBTCxDQUFoQjtBQUNBQyxZQUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjtBQUNBQyxZQUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjtBQUNBQyxZQUFNRCxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjs7QUFFQSxXQUFLRyxjQUFMO0FBQ0Q7OztFQS9IdUIsdUJBQVlDLGFBQVosQzs7a0JBa0lYL0MsVyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vdGlvbklucHV0IGZyb20gJ0BpcmNhbS9tb3Rpb24taW5wdXQnO1xuaW1wb3J0IHsgQmFzZUxmbywgU291cmNlTWl4aW4gfSBmcm9tICd3YXZlcy1sZm8vY29yZSc7XG5cbmNvbnN0IGRlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogTW9kdWxlIHRoYXQgd3JhcHMgdGhlIFttb3Rpb24taW5wdXRdKGh0dHBzOi8vZ2l0aHViLmNvbS9jb2xsZWN0aXZlLXNvdW5kd29ya3MvbW90aW9uLWlucHV0KVxuICogbGlicmFyeSBhbmQgY3JlYXRlcyBhIHN0cmVhbSBvZiB2ZWN0b3JzIGZyb20gdGhlIGFjY2VsZXJvbWV0ZXJzIGFuZCBneXJvc2NvcGUuXG4gKlxuICogT3V0cHV0IGlzIGRlZmluZWQgaW4gdGhlIHNhbWUgb3JkZXIsIHVuaXQgYW5kIGRpcmVjdGlvbnMgYXMgaW4gdGhlXG4gKiBbRGV2aWNlTW90aW9uIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9kZXZpY2VvcmllbnRhdGlvbi9zcGVjLXNvdXJjZS1vcmllbnRhdGlvbi5odG1sKTpcbiAqXG4gKiAqIDAgLSBhY2NlbGVyb21ldGVyIFhcbiAqICogMSAtIGFjY2VsZXJvbWV0ZXIgWVxuICogKiAyIC0gYWNjZWxlcm9tZXRlciBaXG4gKiAqIDMgLSBneXJvIGFyb3VuZCBaIChhbHBoYSAtIHlhdylcbiAqICogNCAtIGd5cm8gYXJvdW5kIFggKGJldGEgLSBwaXRjaClcbiAqICogNSAtIGd5cm8gYXJvdW5kIFkgKGdhbW1hIC0gcm9sbClcbiAqXG4gKiBAbWVtYmVyb2Ygc291cmNlXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8nO1xuICogaW1wb3J0ICogYXMgbGZvTW90aW9uIGZyb20gJ2xmby1tb3Rpb24nO1xuICpcbiAqIGNvbnN0IG1vdGlvbklucHV0ID0gbmV3IGxmb01vdGlvbi5zb3VyY2UuTW90aW9uSW5wdXQoKTtcbiAqIGNvbnN0IGxvZ2dlciA9IG5ldyBsZm8uc2luay5Mb2dnZXIoeyB0aW1lOiBmYWxzZSwgZGF0YTogdHJ1ZSB9KTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5jb25uZWN0KGxvZ2dlcik7XG4gKlxuICogbW90aW9uSW5wdXQuaW5pdCgpXG4gKiAgIC50aGVuKCgpID0+IG1vdGlvbklucHV0LnN0YXJ0KCkpXG4gKiAgIC5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyLnN0YWNrKSk7XG4gKi9cbmNsYXNzIE1vdGlvbklucHV0IGV4dGVuZHMgU291cmNlTWl4aW4oQmFzZUxmbykge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihkZWZpbml0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9hY2NMaXN0ZW5lciA9IHRoaXMuX2FjY0xpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fZ3lyb0xpc3RlbmVyID0gdGhpcy5fZ3lyb0xpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fYWNjT25seUxpc3RlbmVyID0gdGhpcy5fYWNjT25seUxpc3RlbmVyLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgaW5pdE1vZHVsZSgpIHtcbiAgICBjb25zdCBuZXh0UHJvbWlzZXMgPSBzdXBlci5pbml0TW9kdWxlKCk7XG5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbW90aW9uSW5wdXRcbiAgICAgICAgLmluaXQoWydhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5JywgJ3JvdGF0aW9uUmF0ZSddKVxuICAgICAgICAudGhlbigoW2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHksIHJvdGF0aW9uUmF0ZV0pID0+IHtcbiAgICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgPSBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICAgICAgICAgIHRoaXMucm90YXRpb25SYXRlID0gcm90YXRpb25SYXRlO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKGVyci5zdGFjaykpO1xuICAgIH0pO1xuXG4gICAgLy8gbmV4dFByb21pc2VzLnB1c2gocHJvbWlzZSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW25leHRQcm9taXNlcywgcHJvbWlzZV0pO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMoKSB7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID0gJ3ZlY3Rvcic7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gNjtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAxIC8gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LnBlcmlvZDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZUNvdW50ID0gMTtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbiA9IFtcbiAgICAgICdhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5IHgnLFxuICAgICAgJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgeScsXG4gICAgICAnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSB6JyxcbiAgICAgICdyb3RhdGlvblJhdGUgYWxwaGEnLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBiZXRhJyxcbiAgICAgICdyb3RhdGlvblJhdGUgZ2FtbWEnLFxuICAgIF07XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBzdHJlYW0uXG4gICAqL1xuICBzdGFydCgpIHtcbiAgICB0aGlzLl9zdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIGlmICh0aGlzLmluaXRpYWxpemVkID09PSBmYWxzZSkge1xuICAgICAgaWYgKHRoaXMuaW5pdFByb21pc2UgPT09IG51bGwpIC8vIGluaXQgaGFzIG5vdCB5ZXQgYmVlbiBjYWxsZWRcbiAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IHRoaXMuaW5pdCgpO1xuXG4gICAgICByZXR1cm4gdGhpcy5pbml0UHJvbWlzZS50aGVuKCgpID0+IHRoaXMuc3RhcnQodGhpcy5fc3RhcnRUaW1lKSk7XG4gICAgfVxuXG4gICAgY29uc3QgYWNjID0gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICAgIGNvbnN0IHJvdCA9IHRoaXMucm90YXRpb25SYXRlO1xuXG4gICAgaWYgKGFjYy5pc1ZhbGlkICYmIHJvdC5pc1ZhbGlkKSB7XG4gICAgICBhY2MuYWRkTGlzdGVuZXIodGhpcy5fYWNjTGlzdGVuZXIpO1xuICAgICAgcm90LmFkZExpc3RlbmVyKHRoaXMuX2d5cm9MaXN0ZW5lcik7XG4gICAgfSBlbHNlIGlmIChhY2MuaXNWYWxpZCkge1xuICAgICAgYWNjLmFkZExpc3RlbmVyKHRoaXMuX2FjY09ubHlMaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIGRldmljZSBkb2Vzbid0IHN1cHBvcnQgdGhlIGRldmljZW1vdGlvbiBBUElgKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgdGhlIHN0cmVhbS5cbiAgICovXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5fc3RhcnRUaW1lID0gbnVsbDtcblxuICAgIGNvbnN0IGFjYyA9IHRoaXMuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgICBjb25zdCByb3QgPSB0aGlzLnJvdGF0aW9uUmF0ZTtcblxuICAgIGlmIChhY2MuaXNWYWxpZCAmJiByb3QuaXNWYWxpZCkge1xuICAgICAgYWNjLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2FjY0xpc3RlbmVyKTtcbiAgICAgIHJvdC5yZW1vdmVMaXN0ZW5lcih0aGlzLl9neXJvTGlzdGVuZXIpO1xuICAgIH0gZWxzZSBpZiAoYWNjLmlzVmFsaWQpIHtcbiAgICAgIGFjYy5yZW1vdmVMaXN0ZW5lcih0aGlzLl9hY2NPbmx5TGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfYWNjTGlzdGVuZXIoZGF0YSkge1xuICAgIGNvbnN0IGZyYW1lID0gdGhpcy5mcmFtZTtcbiAgICBmcmFtZS50aW1lID0gKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lKSAvIDEwMDA7XG5cbiAgICBmcmFtZS5kYXRhWzBdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzFdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzJdID0gZGF0YVsyXTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfZ3lyb0xpc3RlbmVyKGRhdGEpIHtcbiAgICBjb25zdCBmcmFtZSA9IHRoaXMuZnJhbWU7XG4gICAgZnJhbWUuZGF0YVszXSA9IGRhdGFbMF07XG4gICAgZnJhbWUuZGF0YVs0XSA9IGRhdGFbMV07XG4gICAgZnJhbWUuZGF0YVs1XSA9IGRhdGFbMl07XG5cbiAgICB0aGlzLnByb3BhZ2F0ZUZyYW1lKCk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2FjY09ubHlMaXN0ZW5lcihkYXRhKSB7XG4gICAgY29uc3QgZnJhbWUgPSB0aGlzLmZyYW1lO1xuICAgIGZyYW1lLnRpbWUgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWUpIC8gMTAwMDtcblxuICAgIGZyYW1lLmRhdGFbMF0gPSBkYXRhWzBdO1xuICAgIGZyYW1lLmRhdGFbMV0gPSBkYXRhWzFdO1xuICAgIGZyYW1lLmRhdGFbMl0gPSBkYXRhWzJdO1xuICAgIGZyYW1lLmRhdGFbM10gPSAwO1xuICAgIGZyYW1lLmRhdGFbNF0gPSAwO1xuICAgIGZyYW1lLmRhdGFbNV0gPSAwO1xuXG4gICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vdGlvbklucHV0O1xuIl19