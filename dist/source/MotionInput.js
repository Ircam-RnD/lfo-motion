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
 *
 *
 *
 *
 *
 */

var MotionInput = function (_SourceMixin) {
  (0, _inherits3.default)(MotionInput, _SourceMixin);

  function MotionInput() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MotionInput);
    return (0, _possibleConstructorReturn3.default)(this, (MotionInput.__proto__ || (0, _getPrototypeOf2.default)(MotionInput)).call(this, definitions, options));
  }

  (0, _createClass3.default)(MotionInput, [{
    key: 'initModule',
    value: function initModule() {
      var _this2 = this;

      var nextPromises = (0, _get3.default)(MotionInput.prototype.__proto__ || (0, _getPrototypeOf2.default)(MotionInput.prototype), 'initModule', this).call(this);
      // console.log(nextPromises);
      // return;

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
  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      var startTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (this.initialized === false) {
        if (this.initPromise === null) // init has not yet been called
          this.initPromise = this.init();

        return this.initPromise.then(function () {
          return _this3.start(startTime);
        });
      }

      var frame = this.frame;
      var accelerationIncludingGravity = this.accelerationIncludingGravity;
      var rotationRate = this.rotationRate;

      this._startTime = performance.now();

      if (accelerationIncludingGravity.isValid && rotationRate.isValid) {
        accelerationIncludingGravity.addListener(function (_ref3) {
          var _ref4 = (0, _slicedToArray3.default)(_ref3, 3),
              x = _ref4[0],
              y = _ref4[1],
              z = _ref4[2];

          frame.time = (performance.now() - _this3._startTime) / 1000;

          frame.data[0] = x;
          frame.data[1] = y;
          frame.data[2] = z;
        });

        rotationRate.addListener(function (_ref5) {
          var _ref6 = (0, _slicedToArray3.default)(_ref5, 3),
              alpha = _ref6[0],
              beta = _ref6[1],
              gamma = _ref6[2];

          frame.data[3] = alpha;
          frame.data[4] = beta;
          frame.data[5] = gamma;

          _this3.propagateFrame();
        });
      } else if (accelerationIncludingGravity.isValid) {
        accelerationIncludingGravity.addListener(function (_ref7) {
          var _ref8 = (0, _slicedToArray3.default)(_ref7, 3),
              x = _ref8[0],
              y = _ref8[1],
              z = _ref8[2];

          frame.time = (performance.now() - _this3._startTime) / 1000;

          frame.data[0] = x;
          frame.data[1] = y;
          frame.data[2] = z;
          frame.data[3] = 0;
          frame.data[4] = 0;
          frame.data[5] = 0;

          _this3.propagateFrame();
        });
      } else {
        throw new Error('The device doesn\'t support the devicemotion API');
      }

      this.started = true;
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.started = false;
      this._startTime = null;
    }

    // processFrame() {}

  }]);
  return MotionInput;
}((0, _core.SourceMixin)(_core.BaseLfo));

exports.default = MotionInput;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiZGVmaW5pdGlvbnMiLCJNb3Rpb25JbnB1dCIsIm9wdGlvbnMiLCJuZXh0UHJvbWlzZXMiLCJwcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImluaXQiLCJ0aGVuIiwiYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSIsInJvdGF0aW9uUmF0ZSIsImNhdGNoIiwiY29uc29sZSIsImVycm9yIiwiZXJyIiwic3RhY2siLCJhbGwiLCJzdHJlYW1QYXJhbXMiLCJmcmFtZVR5cGUiLCJmcmFtZVNpemUiLCJmcmFtZVJhdGUiLCJwZXJpb2QiLCJzb3VyY2VTYW1wbGVSYXRlIiwic291cmNlU2FtcGxlQ291bnQiLCJkZXNjcmlwdGlvbiIsInByb3BhZ2F0ZVN0cmVhbVBhcmFtcyIsInN0YXJ0VGltZSIsImluaXRpYWxpemVkIiwiaW5pdFByb21pc2UiLCJzdGFydCIsImZyYW1lIiwiX3N0YXJ0VGltZSIsInBlcmZvcm1hbmNlIiwibm93IiwiaXNWYWxpZCIsImFkZExpc3RlbmVyIiwieCIsInkiLCJ6IiwidGltZSIsImRhdGEiLCJhbHBoYSIsImJldGEiLCJnYW1tYSIsInByb3BhZ2F0ZUZyYW1lIiwiRXJyb3IiLCJzdGFydGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNQSxjQUFjLEVBQXBCOztBQUVBOzs7Ozs7OztJQU9NQyxXOzs7QUFDSix5QkFBMEI7QUFBQSxRQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQTtBQUFBLDJJQUNsQkYsV0FEa0IsRUFDTEUsT0FESztBQUV6Qjs7OztpQ0FFWTtBQUFBOztBQUNYLFVBQU1DLHlKQUFOO0FBQ0E7QUFDQTs7QUFFQSxVQUFNQyxVQUFVLHNCQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUMvQyw4QkFDR0MsSUFESCxDQUNRLENBQUMsOEJBQUQsRUFBaUMsY0FB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QyxDQUFhO0FBQUEsY0FBVkMsQ0FBVTtBQUFBLGNBQVBDLENBQU87O0FBQ3REUixnQkFBTVMsSUFBTixHQUFhLENBQUNQLFlBQVlDLEdBQVosS0FBb0IsT0FBS0YsVUFBMUIsSUFBd0MsSUFBckQ7O0FBRUFELGdCQUFNVSxJQUFOLENBQVcsQ0FBWCxJQUFnQkosQ0FBaEI7QUFDQU4sZ0JBQU1VLElBQU4sQ0FBVyxDQUFYLElBQWdCSCxDQUFoQjtBQUNBUCxnQkFBTVUsSUFBTixDQUFXLENBQVgsSUFBZ0JGLENBQWhCO0FBQ0FSLGdCQUFNVSxJQUFOLENBQVcsQ0FBWCxJQUFnQixDQUFoQjtBQUNBVixnQkFBTVUsSUFBTixDQUFXLENBQVgsSUFBZ0IsQ0FBaEI7QUFDQVYsZ0JBQU1VLElBQU4sQ0FBVyxDQUFYLElBQWdCLENBQWhCOztBQUVBLGlCQUFLSSxjQUFMO0FBQ0QsU0FYRDtBQVlELE9BYk0sTUFhQTtBQUNMLGNBQU0sSUFBSUMsS0FBSixvREFBTjtBQUNEOztBQUVELFdBQUtDLE9BQUwsR0FBZSxJQUFmO0FBQ0Q7OzsyQkFFTTtBQUNMLFdBQUtBLE9BQUwsR0FBZSxLQUFmO0FBQ0EsV0FBS2YsVUFBTCxHQUFrQixJQUFsQjtBQUNEOztBQUVEOzs7O0VBcEd3QixxQzs7a0JBdUdYOUIsVyIsImZpbGUiOiJfbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vdGlvbklucHV0IGZyb20gJ21vdGlvbi1pbnB1dCc7XG5pbXBvcnQgeyBCYXNlTGZvLCBTb3VyY2VNaXhpbiB9IGZyb20gJ3dhdmVzLWxmby9jb3JlJztcblxuY29uc3QgZGVmaW5pdGlvbnMgPSB7fTtcblxuLyoqXG4gKlxuICpcbiAqXG4gKlxuICpcbiAqL1xuY2xhc3MgTW90aW9uSW5wdXQgZXh0ZW5kcyBTb3VyY2VNaXhpbihCYXNlTGZvKSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKGRlZmluaXRpb25zLCBvcHRpb25zKTtcbiAgfVxuXG4gIGluaXRNb2R1bGUoKSB7XG4gICAgY29uc3QgbmV4dFByb21pc2VzID0gc3VwZXIuaW5pdE1vZHVsZSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKG5leHRQcm9taXNlcyk7XG4gICAgLy8gcmV0dXJuO1xuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG1vdGlvbklucHV0XG4gICAgICAgIC5pbml0KFsnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eScsICdyb3RhdGlvblJhdGUnXSlcbiAgICAgICAgLnRoZW4oKFthY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LCByb3RhdGlvblJhdGVdKSA9PiB7XG4gICAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5ID0gYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgICAgICAgICB0aGlzLnJvdGF0aW9uUmF0ZSA9IHJvdGF0aW9uUmF0ZTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4gY29uc29sZS5lcnJvcihlcnIuc3RhY2spKTtcbiAgICB9KTtcblxuICAgIC8vIG5leHRQcm9taXNlcy5wdXNoKHByb21pc2UpO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtuZXh0UHJvbWlzZXMsIHByb21pc2VdKTtcbiAgfVxuXG4gIHByb2Nlc3NTdHJlYW1QYXJhbXMoKSB7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVUeXBlID0gJ3ZlY3Rvcic7XG4gICAgdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVTaXplID0gNjtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5mcmFtZVJhdGUgPSAxIC8gdGhpcy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LnBlcmlvZDtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5zb3VyY2VTYW1wbGVSYXRlID0gdGhpcy5zdHJlYW1QYXJhbXMuZnJhbWVSYXRlO1xuICAgIHRoaXMuc3RyZWFtUGFyYW1zLnNvdXJjZVNhbXBsZUNvdW50ID0gMTtcbiAgICB0aGlzLnN0cmVhbVBhcmFtcy5kZXNjcmlwdGlvbiA9IFtcbiAgICAgICdhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5IHgnLFxuICAgICAgJ2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgeScsXG4gICAgICAnYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSB6JyxcbiAgICAgICdyb3RhdGlvblJhdGUgYWxwaGEnLFxuICAgICAgJ3JvdGF0aW9uUmF0ZSBiZXRhJyxcbiAgICAgICdyb3RhdGlvblJhdGUgZ2FtbWEnLFxuICAgIF07XG5cbiAgICB0aGlzLnByb3BhZ2F0ZVN0cmVhbVBhcmFtcygpO1xuICB9XG5cblxuICBzdGFydChzdGFydFRpbWUgPSBudWxsKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQgPT09IGZhbHNlKSB7XG4gICAgICBpZiAodGhpcy5pbml0UHJvbWlzZSA9PT0gbnVsbCkgLy8gaW5pdCBoYXMgbm90IHlldCBiZWVuIGNhbGxlZFxuICAgICAgICB0aGlzLmluaXRQcm9taXNlID0gdGhpcy5pbml0KCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmluaXRQcm9taXNlLnRoZW4oKCkgPT4gdGhpcy5zdGFydChzdGFydFRpbWUpKTtcbiAgICB9XG5cbiAgICBjb25zdCBmcmFtZSA9IHRoaXMuZnJhbWU7XG4gICAgY29uc3QgYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSA9IHRoaXMuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgICBjb25zdCByb3RhdGlvblJhdGUgPSB0aGlzLnJvdGF0aW9uUmF0ZTtcblxuICAgIHRoaXMuX3N0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkuaXNWYWxpZCAmJiByb3RhdGlvblJhdGUuaXNWYWxpZCkge1xuICAgICAgYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS5hZGRMaXN0ZW5lcigoW3gsIHksIHpdKSA9PiB7XG4gICAgICAgIGZyYW1lLnRpbWUgPSAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWUpIC8gMTAwMDtcblxuICAgICAgICBmcmFtZS5kYXRhWzBdID0geDtcbiAgICAgICAgZnJhbWUuZGF0YVsxXSA9IHk7XG4gICAgICAgIGZyYW1lLmRhdGFbMl0gPSB6O1xuICAgICAgfSk7XG5cbiAgICAgIHJvdGF0aW9uUmF0ZS5hZGRMaXN0ZW5lcigoW2FscGhhLCBiZXRhLCBnYW1tYV0pID0+IHtcbiAgICAgICAgZnJhbWUuZGF0YVszXSA9IGFscGhhO1xuICAgICAgICBmcmFtZS5kYXRhWzRdID0gYmV0YTtcbiAgICAgICAgZnJhbWUuZGF0YVs1XSA9IGdhbW1hO1xuXG4gICAgICAgIHRoaXMucHJvcGFnYXRlRnJhbWUoKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS5pc1ZhbGlkKSB7XG4gICAgICBhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LmFkZExpc3RlbmVyKChbeCwgeSwgel0pID0+IHtcbiAgICAgICAgZnJhbWUudGltZSA9IChwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZSkgLyAxMDAwO1xuXG4gICAgICAgIGZyYW1lLmRhdGFbMF0gPSB4O1xuICAgICAgICBmcmFtZS5kYXRhWzFdID0geTtcbiAgICAgICAgZnJhbWUuZGF0YVsyXSA9IHo7XG4gICAgICAgIGZyYW1lLmRhdGFbM10gPSAwO1xuICAgICAgICBmcmFtZS5kYXRhWzRdID0gMDtcbiAgICAgICAgZnJhbWUuZGF0YVs1XSA9IDA7XG5cbiAgICAgICAgdGhpcy5wcm9wYWdhdGVGcmFtZSgpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIGRldmljZSBkb2Vzbid0IHN1cHBvcnQgdGhlIGRldmljZW1vdGlvbiBBUElgKVxuICAgIH1cblxuICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IG51bGw7XG4gIH1cblxuICAvLyBwcm9jZXNzRnJhbWUoKSB7fVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb3Rpb25JbnB1dDtcbiJdfQ==