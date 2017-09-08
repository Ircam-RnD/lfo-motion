'use strict';

var _client = require('../../../../node_modules/waves-lfo/client');

var lfo = _interopRequireWildcard(_client);

var _basicControllers = require('basic-controllers');

var controllers = _interopRequireWildcard(_basicControllers);

var _dist = require('../../../../dist');

var lfoMotion = _interopRequireWildcard(_dist);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * from Phone (motion-input):
 *
 * 0 - acc x
 * 1 - acc y
 * 2 - acc z
 * 3 - yaw      => deg / s
 * 4 - pitch
 * 6 - roll
 */
var socketReceive = new lfo.source.SocketReceive({ port: 5010 });
socketReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 6,
  frameRate: 0
});

var intensity = new lfoMotion.operator.Intensity({
  feedback: 0.7,
  gain: 0.07
});

var select = new lfo.operator.Select({ index: 0 });
var multiplier = new lfo.operator.Multiplier({ factor: 100 });

var logger = new lfo.sink.Logger({ time: false, data: true });

var stillAutoTrigger = new lfoMotion.operator.StillAutoTrigger({
  onThreshold: 0.5,
  offThreshold: 0.01,
  offDelay: 500
});

var triggerBridge = new lfo.sink.Bridge({
  processFrame: function processFrame(frame) {
    return displayTriggerOutput(frame);
  }
});

socketReceive.connect(intensity);
intensity.connect(select);
select.connect(multiplier);
// multiplier.connect(logger);
multiplier.connect(stillAutoTrigger);
stillAutoTrigger.connect(triggerBridge);

var body = document.querySelector('body');
var info = document.querySelector('#info');

var displayTriggerOutput = function displayTriggerOutput(frame) {
  if (frame.data[0] === 1) {
    body.classList.add('active');
    info.innerHTML = '1 (date : ' + frame.time + ')';
  } else {
    body.classList.remove('active');
    info.innerHTML = '0 (date : ' + frame.time + ')';
  }
};

// ---------------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------------

var onThresholdSlider = new controllers.NumberBox({
  label: 'on threshold',
  active: true,
  min: 0,
  max: 1,
  step: 0.01,
  default: 0.5,
  container: '#controls',
  callback: function callback(value) {
    return stillAutoTrigger.params.set('onThreshold', value);
  }
});

var offThresholdSlider = new controllers.NumberBox({
  label: 'off threshold',
  active: true,
  min: 0,
  max: 1,
  step: 0.01,
  default: 0.01,
  container: '#controls',
  callback: function callback(value) {
    return stillAutoTrigger.params.set('offThreshold', value);
  }
});

var offDelaySlider = new controllers.NumberBox({
  label: 'off delay',
  active: true,
  min: 0,
  max: 5000,
  step: 0.01,
  default: 500,
  container: '#controls',
  callback: function callback(value) {
    return stillAutoTrigger.params.set('offDelay', value);
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImxmbyIsImNvbnRyb2xsZXJzIiwibGZvTW90aW9uIiwic29ja2V0UmVjZWl2ZSIsInNvdXJjZSIsIlNvY2tldFJlY2VpdmUiLCJwb3J0IiwicHJvY2Vzc1N0cmVhbVBhcmFtcyIsImZyYW1lVHlwZSIsImZyYW1lU2l6ZSIsImZyYW1lUmF0ZSIsImludGVuc2l0eSIsIm9wZXJhdG9yIiwiSW50ZW5zaXR5IiwiZmVlZGJhY2siLCJnYWluIiwic2VsZWN0IiwiU2VsZWN0IiwiaW5kZXgiLCJtdWx0aXBsaWVyIiwiTXVsdGlwbGllciIsImZhY3RvciIsImxvZ2dlciIsInNpbmsiLCJMb2dnZXIiLCJ0aW1lIiwiZGF0YSIsInN0aWxsQXV0b1RyaWdnZXIiLCJTdGlsbEF1dG9UcmlnZ2VyIiwib25UaHJlc2hvbGQiLCJvZmZUaHJlc2hvbGQiLCJvZmZEZWxheSIsInRyaWdnZXJCcmlkZ2UiLCJCcmlkZ2UiLCJwcm9jZXNzRnJhbWUiLCJkaXNwbGF5VHJpZ2dlck91dHB1dCIsImZyYW1lIiwiY29ubmVjdCIsImJvZHkiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJpbmZvIiwiY2xhc3NMaXN0IiwiYWRkIiwiaW5uZXJIVE1MIiwicmVtb3ZlIiwib25UaHJlc2hvbGRTbGlkZXIiLCJOdW1iZXJCb3giLCJsYWJlbCIsImFjdGl2ZSIsIm1pbiIsIm1heCIsInN0ZXAiLCJkZWZhdWx0IiwiY29udGFpbmVyIiwiY2FsbGJhY2siLCJwYXJhbXMiLCJzZXQiLCJ2YWx1ZSIsIm9mZlRocmVzaG9sZFNsaWRlciIsIm9mZkRlbGF5U2xpZGVyIl0sIm1hcHBpbmdzIjoiOztBQUFBOztJQUFZQSxHOztBQUNaOztJQUFZQyxXOztBQUNaOztJQUFZQyxTOzs7O0FBRVo7Ozs7Ozs7Ozs7QUFVQSxJQUFNQyxnQkFBZ0IsSUFBSUgsSUFBSUksTUFBSixDQUFXQyxhQUFmLENBQTZCLEVBQUVDLE1BQU0sSUFBUixFQUE3QixDQUF0QjtBQUNBSCxj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SUFBSTNELFlBQVk4QyxTQUFoQixDQUEwQjtBQUMvQ0MsU0FBTyxXQUR3QztBQUUvQ0MsVUFBUSxJQUZ1QztBQUcvQ0MsT0FBSyxDQUgwQztBQUkvQ0MsT0FBSyxJQUowQztBQUsvQ0MsUUFBTSxJQUx5QztBQU0vQ0MsV0FBUyxHQU5zQztBQU8vQ0MsYUFBVyxXQVBvQztBQVEvQ0MsWUFBVTtBQUFBLFdBQVM1QixpQkFBaUI2QixNQUFqQixDQUF3QkMsR0FBeEIsQ0FBNEIsVUFBNUIsRUFBd0NDLEtBQXhDLENBQVQ7QUFBQTtBQVJxQyxDQUExQixDQUF2QiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxmbyBmcm9tICcuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd2F2ZXMtbGZvL2NsaWVudCc7XG5pbXBvcnQgKiBhcyBjb250cm9sbGVycyBmcm9tICdiYXNpYy1jb250cm9sbGVycyc7XG5pbXBvcnQgKiBhcyBsZm9Nb3Rpb24gZnJvbSAnLi4vLi4vLi4vLi4vZGlzdCc7XG5cbi8qKlxuICogZnJvbSBQaG9uZSAobW90aW9uLWlucHV0KTpcbiAqXG4gKiAwIC0gYWNjIHhcbiAqIDEgLSBhY2MgeVxuICogMiAtIGFjYyB6XG4gKiAzIC0geWF3ICAgICAgPT4gZGVnIC8gc1xuICogNCAtIHBpdGNoXG4gKiA2IC0gcm9sbFxuICovXG5jb25zdCBzb2NrZXRSZWNlaXZlID0gbmV3IGxmby5zb3VyY2UuU29ja2V0UmVjZWl2ZSh7IHBvcnQ6IDUwMTAgfSk7XG5zb2NrZXRSZWNlaXZlLnByb2Nlc3NTdHJlYW1QYXJhbXMoe1xuICBmcmFtZVR5cGU6ICd2ZWN0b3InLFxuICBmcmFtZVNpemU6IDYsXG4gIGZyYW1lUmF0ZTogMCxcbn0pO1xuXG5jb25zdCBpbnRlbnNpdHkgPSBuZXcgbGZvTW90aW9uLm9wZXJhdG9yLkludGVuc2l0eSh7XG4gIGZlZWRiYWNrOiAwLjcsXG4gIGdhaW46IDAuMDcsXG59KTtcblxuY29uc3Qgc2VsZWN0ID0gbmV3IGxmby5vcGVyYXRvci5TZWxlY3QoeyBpbmRleDogMCB9KTtcbmNvbnN0IG11bHRpcGxpZXIgPSBuZXcgbGZvLm9wZXJhdG9yLk11bHRpcGxpZXIoeyBmYWN0b3I6IDEwMCB9KTtcblxuY29uc3QgbG9nZ2VyID0gbmV3IGxmby5zaW5rLkxvZ2dlcih7IHRpbWU6IGZhbHNlLCBkYXRhOiB0cnVlIH0pO1xuXG5jb25zdCBzdGlsbEF1dG9UcmlnZ2VyID0gbmV3IGxmb01vdGlvbi5vcGVyYXRvci5TdGlsbEF1dG9UcmlnZ2VyKHtcbiAgb25UaHJlc2hvbGQ6IDAuNSxcbiAgb2ZmVGhyZXNob2xkOiAwLjAxLFxuICBvZmZEZWxheTogNTAwLFxufSk7XG5cbmNvbnN0IHRyaWdnZXJCcmlkZ2UgPSBuZXcgbGZvLnNpbmsuQnJpZGdlKHtcbiAgcHJvY2Vzc0ZyYW1lOiBmcmFtZSA9PiBkaXNwbGF5VHJpZ2dlck91dHB1dChmcmFtZSksXG59KTtcblxuc29ja2V0UmVjZWl2ZS5jb25uZWN0KGludGVuc2l0eSk7XG5pbnRlbnNpdHkuY29ubmVjdChzZWxlY3QpO1xuc2VsZWN0LmNvbm5lY3QobXVsdGlwbGllcik7XG4vLyBtdWx0aXBsaWVyLmNvbm5lY3QobG9nZ2VyKTtcbm11bHRpcGxpZXIuY29ubmVjdChzdGlsbEF1dG9UcmlnZ2VyKTtcbnN0aWxsQXV0b1RyaWdnZXIuY29ubmVjdCh0cmlnZ2VyQnJpZGdlKTtcblxuY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbmNvbnN0IGluZm8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5mbycpO1xuXG5jb25zdCBkaXNwbGF5VHJpZ2dlck91dHB1dCA9IGZyYW1lID0+IHtcbiAgaWYgKGZyYW1lLmRhdGFbMF0gPT09IDEpIHtcbiAgICBib2R5LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIGluZm8uaW5uZXJIVE1MID0gYDEgKGRhdGUgOiAke2ZyYW1lLnRpbWV9KWA7XG4gIH0gZWxzZSB7XG4gICAgYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICBpbmZvLmlubmVySFRNTCA9IGAwIChkYXRlIDogJHtmcmFtZS50aW1lfSlgO1xuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENPTlRST0xTXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3Qgb25UaHJlc2hvbGRTbGlkZXIgPSBuZXcgY29udHJvbGxlcnMuTnVtYmVyQm94KHtcbiAgbGFiZWw6ICdvbiB0aHJlc2hvbGQnLFxuICBhY3RpdmU6IHRydWUsXG4gIG1pbjogMCxcbiAgbWF4OiAxLFxuICBzdGVwOiAwLjAxLFxuICBkZWZhdWx0OiAwLjUsXG4gIGNvbnRhaW5lcjogJyNjb250cm9scycsXG4gIGNhbGxiYWNrOiB2YWx1ZSA9PiBzdGlsbEF1dG9UcmlnZ2VyLnBhcmFtcy5zZXQoJ29uVGhyZXNob2xkJywgdmFsdWUpLFxufSk7XG5cbmNvbnN0IG9mZlRocmVzaG9sZFNsaWRlciA9IG5ldyBjb250cm9sbGVycy5OdW1iZXJCb3goe1xuICBsYWJlbDogJ29mZiB0aHJlc2hvbGQnLFxuICBhY3RpdmU6IHRydWUsXG4gIG1pbjogMCxcbiAgbWF4OiAxLFxuICBzdGVwOiAwLjAxLFxuICBkZWZhdWx0OiAwLjAxLFxuICBjb250YWluZXI6ICcjY29udHJvbHMnLFxuICBjYWxsYmFjazogdmFsdWUgPT4gc3RpbGxBdXRvVHJpZ2dlci5wYXJhbXMuc2V0KCdvZmZUaHJlc2hvbGQnLCB2YWx1ZSksXG59KTtcblxuY29uc3Qgb2ZmRGVsYXlTbGlkZXIgPSBuZXcgY29udHJvbGxlcnMuTnVtYmVyQm94KHtcbiAgbGFiZWw6ICdvZmYgZGVsYXknLFxuICBhY3RpdmU6IHRydWUsXG4gIG1pbjogMCxcbiAgbWF4OiA1MDAwLFxuICBzdGVwOiAwLjAxLFxuICBkZWZhdWx0OiA1MDAsXG4gIGNvbnRhaW5lcjogJyNjb250cm9scycsXG4gIGNhbGxiYWNrOiB2YWx1ZSA9PiBzdGlsbEF1dG9UcmlnZ2VyLnBhcmFtcy5zZXQoJ29mZkRlbGF5JywgdmFsdWUpLFxufSk7XG4iXX0=