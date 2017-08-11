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

      var frame = this.frame;
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
      frame.time = (performance.now() - this._startTime) / 1000;

      frame.data[0] = data[0];
      frame.data[1] = data[1];
      frame.data[2] = data[2];
    }

    /** @private */

  }, {
    key: '_gyroListener',
    value: function _gyroListener(data) {
      frame.data[3] = data[0];
      frame.data[4] = data[1];
      frame.data[5] = data[2];

      this.propagateFrame();
    }

    /** @private */

  }, {
    key: '_accOnlyListener',
    value: function _accOnlyListener(data) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJNb3Rpb25JbnB1dCIsIm9wdGlvbnMiLCJfYWNjTGlzdGVuZXIiLCJiaW5kIiwiX2d5cm9MaXN0ZW5lciIsIl9hY2NPbmx5TGlzdGVuZXIiLCJuZXh0UHJvbWlzZXMiLCJwcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImluaXQiLCJ0aGVuIiwiYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSIsInJvdGF0aW9uUmF0ZSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwiZXJyIiwic3RhY2siLCJhbGwiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVR5cGUiLCJmcmFtZVNpemUiLCJmcmFtZVJhdGUiLCJwZXJpb2QiLCJzb3VyY2VTYW1wbGVSYXRlIiwic291cmNlU2FtcGxlQ291bnQiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsIl9zdGFydFRpbWUiLCJwZXJmb3JtYW5jZSIsIm5vdyIsImluaXRpYWxpemVkIiwiaW5pdFByb21pc2UiLCJzdGFydCIsImZyYW1lIiwiYWNjIiwicm90IiwiaXNWYWxpZCIsImFkZExpc3RlbmVyIiwiRXJyb3IiLCJzdGFydGVkIiwicmVtb3ZlTGlzdGVuZXIiLCJkYXRhIiwidGltZSIsInByb3BhZ2F0ZUZyYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBMkJNQyxXOzs7QUFDSix5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTs7QUFBQSxnSkFDbEJGLFdBRGtCLEVBQ0xFLE9BREs7O0FBR3hCLFVBQUtDLFlBQUwsR0FBb0IsTUFBS0EsWUFBTCxDQUFrQkMsSUFBbEIsT0FBcEI7QUFDQSxVQUFLQyxhQUFMLEdBQXFCLE1BQUtB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QVgsSUFBZ0IsQ0FBaEI7QUFDQVIsWUFBTVEsSUFBTixDQUFXLENBQVgsSUFBZ0IsQ0FBaEI7O0FBRUEsV0FBS0UsY0FBTDtBQUNEOzs7RUE3SHVCLHFDOztrQkFnSVg3QyxXIiwiZmlsZSI6Il9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW90aW9uSW5wdXQgZnJvbSAnbW90aW9uLWlucHV0JztcbmltcG9ydCB7IEJhc2VMZm8sIFNvdXJjZU1peGluIH0gZnJvbSAnd2F2ZXMtbGZvL2NvcmUnO1xuXG5jb25zdCBkZWZpbml0aW9ucyA9IHt9O1xuXG4vKipcbiAqIE1vZHVsZSB0aGF0IHdyYXBzIHRoZSBbbW90aW9uLWlucHV0XShodHRwczovL2dpdGh1Yi5jb20vY29sbGVjdGl2ZS1zb3VuZHdvcmtzL21vdGlvbi1pbnB1dClcbiAqIGxpYnJhcnkgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gb2YgdmVjdG9ycyBmcm9tIHRoZSBhY2NlbGVyb21ldGVycyBhbmQgZ3lyb3Njb3BlLlxuICpcbiAqIE91dHB1dCBpcyBkZWZpbmVkIGluIHRoZSBzYW1lIG9yZGVyLCB1bml0IGFuZCBkaXJlY3Rpb25zIGFzIGluIHRoZVxuICogW0RldmljZU1vdGlvbiBzcGVjaWZpY2F0aW9uXShodHRwczovL3czYy5naXRodWIuaW8vZGV2aWNlb3JpZW50YXRpb24vc3BlYy1zb3VyY2Utb3JpZW50YXRpb24uaHRtbCk6XG4gKlxuICogKiAwIC0gYWNjZWxlcm9tZXRlciBYXG4gKiAqIDEgLSBhY2NlbGVyb21ldGVyIFlcbiAqICogMiAtIGFjY2VsZXJvbWV0ZXIgWlxuICogKiAzIC0gZ3lybyBhcm91bmQgWiAoYWxwaGEgLSB5YXcpXG4gKiAqIDQgLSBneXJvIGFyb3VuZCBYIChiZXRhIC0gcGl0Y2gpXG4gKiAqIDUgLSBneXJvIGFyb3VuZCBZIChnYW1tYSAtIHJvbGwpXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCAqIGFzIGxmbyBmcm9tICd3YXZlcy1sZm8nO1xuICogaW1wb3J0ICogYXMgbGZvTW90aW9uIGZyb20gJ2xmby1tb3Rpb24nO1xuICpcbiAqIGNvbnN0IG1vdGlvbklucHV0ID0gbmV3IGxmb01vdGlvbi5zb3VyY2UuTW90aW9uSW5wdXQoKTtcbiAqIGNvbnN0IGxvZ2dlciA9IG5ldyBsZm8uc2luay5Mb2dnZXIoeyB0aW1lOiBmYWxzZSwgZGF0YTogdHJ1ZSB9KTtcbiAqXG4gKiBtb3Rpb25JbnB1dC5jb25uZWN0KGxvZ2dlcik7XG4gKlxuICogbW90aW9uSW5wdXQuaW5pdCgpXG4gKiAgIC50aGVuKCgpID0+IG1vdGlvbklucHV0LnN0YXJ0KCkpXG4gKiAgIC5jYXRjaChlcnIgPT4gY29uc29sZS5sb2coZXJyLnN0YWNrKSk7XG4gKi9cbmNsYXNzIE1vdGlvbklucHV0IGV4dGVuZHMgU291cmNlTWl4aW4oQmFzZUxmbykge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihkZWZpbml0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9hY2NMaXN0ZW5lciA9IHRoaXMuX2FjY0xpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fZ3lyb0xpc3RlbmVyID0gdGhpcy5fZ3lyb0xpc3RlbmVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fYWNjT25seUxpc3RlbmVyID0gdGhpcy5fYWNjT25seUxpc3RlbmVyLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgaW5pdE1vZHVsZSgpIHtcbiAgICBjb25zdCBuZXh0UHJvbWlzZXMgPSBzdXBlci5pbml0TW9kdWxlKCk7XG5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbW90aW9uSW5wdXRcbiAgICAgICAgLmluaXQoWydhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5JywgJ3JvdGF0aW9uUmF0ZSddKVxuICAgICAgICAudGhlbigoW2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHksIHJvdGF0aW9uUmF0ZV0pID0+IHtcbiAgICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgPSBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICAgICAgICAgIHRoaXMucm90YXRpb25SYXRlID0gcm90YXRpb25SYXRlO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKGVyci5zdGFjaykpO1xuICAgIH0pO1xuXG4gICAgLy8gbmV4dFByb21pc2VzLnB1c2gocHJvbWlzZSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW25leHRQcm9taXNlcywgcHJvbWlzZV0pO1xuICB9XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMoKSB7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID0gJ3ZlY3Rvcic7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gNjtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAxIC8gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LnBlcmlvZDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZUNvdW50ID0gMTtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbiA9IFtcbiAgICAgICdhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5IHgnLFxuICAgICAgJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgeScsXG4gICAgICAnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSB6JyxcbiAgICAgICdyb3RhdGlvblJhdGUgYWxwaGEnLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBiZXRhJyxcbiAgICAgICdyb3RhdGlvblJhdGUgZ2FtbWEnLFxuICAgIF07XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBzdHJlYW0uXG4gICAqL1xuICBzdGFydCgpIHtcbiAgICB0aGlzLl9zdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIGlmICh0aGlzLmluaXRpYWxpemVkID09PSBmYWxzZSkge1xuICAgICAgaWYgKHRoaXMuaW5pdFByb21pc2UgPT09IG51bGwpIC8vIGluaXQgaGFzIG5vdCB5ZXQgYmVlbiBjYWxsZWRcbiAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IHRoaXMuaW5pdCgpO1xuXG4gICAgICByZXR1cm4gdGhpcy5pbml0UHJvbWlzZS50aGVuKCgpID0+IHRoaXMuc3RhcnQodGhpcy5fc3RhcnRUaW1lKSk7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWUgPSB0aGlzLmZyYW1lO1xuICAgIGNvbnN0IGFjYyA9IHRoaXMuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgICBjb25zdCByb3QgPSB0aGlzLnJvdGF0aW9uUmF0ZTtcblxuICAgIGlmIChhY2MuaXNWYWxpZCAmJiByb3QuaXNWYWxpZCkge1xuICAgICAgYWNjLmFkZExpc3RlbmVyKHRoaXMuX2FjY0xpc3RlbmVyKTtcbiAgICAgIHJvdC5hZGRMaXN0ZW5lcih0aGlzLl9neXJvTGlzdGVuZXIpO1xuICAgIH0gZWxzZSBpZiAoYWNjLmlzVmFsaWQpIHtcbiAgICAgIGFjYy5hZGRMaXN0ZW5lcih0aGlzLl9hY2NPbmx5TGlzdGVuZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBkZXZpY2UgZG9lc24ndCBzdXBwb3J0IHRoZSBkZXZpY2Vtb3Rpb24gQVBJYCk7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBzdHJlYW0uXG4gICAqL1xuICBzdG9wKCkge1xuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IG51bGw7XG5cbiAgICBjb25zdCBhY2MgPSB0aGlzLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk7XG4gICAgY29uc3Qgcm90ID0gdGhpcy5yb3RhdGlvblJhdGU7XG5cbiAgICBpZiAoYWNjLmlzVmFsaWQgJiYgcm90LmlzVmFsaWQpIHtcbiAgICAgIGFjYy5yZW1vdmVMaXN0ZW5lcih0aGlzLl9hY2NMaXN0ZW5lcik7XG4gICAgICByb3QucmVtb3ZlTGlzdGVuZXIodGhpcy5fZ3lyb0xpc3RlbmVyKTtcbiAgICB9IGVsc2UgaWYgKGFjYy5pc1ZhbGlkKSB7XG4gICAgICBhY2MucmVtb3ZlTGlzdGVuZXIodGhpcy5fYWNjT25seUxpc3RlbmVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHByaXZhdGUgKi9cbiAgX2FjY0xpc3RlbmVyKGRhdGEpIHtcbiAgICBmcmFtZS50aW1lID0gKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lKSAvIDEwMDA7XG5cbiAgICBmcmFtZS5kYXRhWzBdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzFdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzJdID0gZGF0YVsyXTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfZ3lyb0xpc3RlbmVyKGRhdGEpIHtcbiAgICBmcmFtZS5kYXRhWzNdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzRdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzVdID0gZGF0YVsyXTtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxuXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBfYWNjT25seUxpc3RlbmVyKGRhdGEpIHtcbiAgICBmcmFtZS50aW1lID0gKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lKSAvIDEwMDA7XG5cbiAgICBmcmFtZS5kYXRhWzBdID0gZGF0YVswXTtcbiAgICBmcmFtZS5kYXRhWzFdID0gZGF0YVsxXTtcbiAgICBmcmFtZS5kYXRhWzJdID0gZGF0YVsyXTtcbiAgICBmcmFtZS5kYXRhWzNdID0gMDtcbiAgICBmcmFtZS5kYXRhWzRdID0gMDtcbiAgICBmcmFtZS5kYXRhWzVdID0gMDtcblxuICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb3Rpb25JbnB1dDtcbiJdfQ==