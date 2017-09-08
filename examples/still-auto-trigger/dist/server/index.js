'use strict';

require('source-map-support/register');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _uws = require('uws');

var _uws2 = _interopRequireDefault(_uws);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _connect = require('connect');

var _connect2 = _interopRequireDefault(_connect);

var _connectRoute = require('connect-route');

var _connectRoute2 = _interopRequireDefault(_connectRoute);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _portfinder = require('portfinder');

var _portfinder2 = _interopRequireDefault(_portfinder);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _ejsTemplate = require('ejs-template');

var _ejsTemplate2 = _interopRequireDefault(_ejsTemplate);

var _runner = require('../../bin/runner');

var _node = require('waves-lfo/node');

var lfo = _interopRequireWildcard(_node);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// not very clean but...
var cwd = process.cwd();
_portfinder2.default.basePort = 3000;

_portfinder2.default.getPortPromise().then(function (port) {
  var app = (0, _connect2.default)();

  app.use((0, _serveFavicon2.default)('./public/favicon.ico'));
  app.use((0, _serveStatic2.default)('./public'));
  app.use(_ejsTemplate2.default.middleware({
    basedir: _path2.default.join(cwd, 'src', 'client'),
    autoreload: true
  }));

  app.use((0, _connectRoute2.default)(function (router) {
    var serve = function serve(name, req, res) {
      var transpiler = (0, _runner.getTranspiler)();
      // bundle the js file that correspond to the client
      var entryPoint = _path2.default.join(cwd, 'dist', 'client', name + '.js');
      var outFile = _path2.default.join(cwd, 'public', name + '-bundle.js');

      transpiler.bundle(entryPoint, outFile, function () {
        res.endTemplate('template.ejs', { name: name });
      });
    };

    router.get('/', function (req, res, next) {
      return serve('index', req, res);
    });
    router.get('/:name', function (req, res, next) {
      return serve(req.params.name, req, res);
    });
  }));

  console.log('PHONE -----------------------------------------------');

  var server = _http2.default.createServer(app);
  server.listen(port, function () {
    return console.log(_chalk2.default.cyan('server started: http://127.0.0.1:' + port));
  });

  // lfo routing
  console.log(_chalk2.default.grey('socket receive on port: 5000'));
  console.log(_chalk2.default.grey('socket send on port:    5010'));

  // pipe phone to desktop client
  var socketReceive = new lfo.source.SocketReceive({ port: 5000 });
  var socketSend = new lfo.sink.SocketSend({ port: 5010 });
  // const logger = new lfo.sink.Logger({ data: false, time: true });

  socketReceive.connect(socketSend);

  console.log('-----------------------------------------------------');
}).catch(function (err) {
  return console.error(err.stack);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbImxmbyIsImN3ZCIsInByb2Nlc3MiLCJiYXNlUG9ydCIsImdldFBvcnRQcm9taXNlIiwidGhlbiIsImFwcCIsInVzZSIsIm1pZGRsZXdhcmUiLCJiYXNlZGlyIiwiam9pbiIsImF1dG9yZWxvYWQiLCJzZXJ2ZSIsIm5hbWUiLCJyZXEiLCJyZXMiLCJ0cmFuc3BpbGVyIiwiZW50cnlQb2ludCIsIm91dEZpbGUiLCJidW5kbGUiLCJlbmRUZW1wbGF0ZSIsInJvdXRlciIsImdldCIsIm5leHQiLCJwYXJhbXMiLCJjb25zb2xlIiwibG9nIiwic2VydmVyIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwicG9ydCIsImN5YW4iLCJncmV5Iiwic29ja2V0UmVjZWl2ZSIsInNvdXJjZSIsIlNvY2tldFJlY2VpdmUiLCJzb2NrZXRTZW5kIiwic2luayIsIlNvY2tldFNlbmQiLCJjb25uZWN0IiwiY2F0Y2giLCJlcnJvciIsImVyciIsInN0YWNrIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0lBQVlBLEc7Ozs7OztBQUZaO0FBS0EsSUFBTUMsTUFBTUMsUUFBUUQsR0FBUixFQUFaO0FBQ0EscUJBQVdFLFFBQVgsR0FBc0IsSUFBdEI7O0FBRUEscUJBQVdDLGNBQVgsR0FDR0MsSUFESCxDQUNRLGdCQUFRO0FBQ1osTUFBTUMsTUFBTSx3QkFBWjs7QUFFQUEsTUFBSUMsR0FBSixDQUFRLDRCQUFhLHNCQUFiLENBQVI7QUFDQUQsTUFBSUMsR0FBSixDQUFRLDJCQUFZLFVBQVosQ0FBUjtBQUNBRCxNQUFJQyxHQUFKLENBQVEsc0JBQVNDLFVBQVQsQ0FBb0I7QUFDMUJDLGFBQVMsZUFBS0MsSUFBTCxDQUFVVCxHQUFWLEVBQWUsS0FBZixFQUFzQixRQUF0QixDQURpQjtBQUUxQlUsZ0JBQVk7QUFGYyxHQUFwQixDQUFSOztBQUtBTCxNQUFJQyxHQUFKLENBQVEsNEJBQWEsa0JBQVU7QUFDN0IsUUFBTUssUUFBUSxTQUFSQSxLQUFRLENBQUNDLElBQUQsRUFBT0MsR0FBUCxFQUFZQyxHQUFaLEVBQW9CO0FBQ2hDLFVBQU1DLGFBQWEsNEJBQW5CO0FBQ0E7QUFDQSxVQUFNQyxhQUFhLGVBQUtQLElBQUwsQ0FBVVQsR0FBVixFQUFlLE1BQWYsRUFBdUIsUUFBdkIsRUFBb0NZLElBQXBDLFNBQW5CO0FBQ0EsVUFBTUssVUFBVSxlQUFLUixJQUFMLENBQVVULEdBQVYsRUFBZSxRQUFmLEVBQTRCWSxJQUE1QixnQkFBaEI7O0FBRUFHLGlCQUFXRyxNQUFYLENBQWtCRixVQUFsQixFQUE4QkMsT0FBOUIsRUFBdUMsWUFBTTtBQUMzQ0gsWUFBSUssV0FBSixDQUFnQixjQUFoQixFQUFnQyxFQUFFUCxVQUFGLEVBQWhDO0FBQ0QsT0FGRDtBQUdELEtBVEQ7O0FBV0FRLFdBQU9DLEdBQVAsQ0FBVyxHQUFYLEVBQWdCLFVBQUNSLEdBQUQsRUFBTUMsR0FBTixFQUFXUSxJQUFYO0FBQUEsYUFBb0JYLE1BQU0sT0FBTixFQUFlRSxHQUFmLEVBQW9CQyxHQUFwQixDQUFwQjtBQUFBLEtBQWhCO0FBQ0FNLFdBQU9DLEdBQVAsQ0FBVyxRQUFYLEVBQXFCLFVBQUNSLEdBQUQsRUFBTUMsR0FBTixFQUFXUSxJQUFYO0FBQUEsYUFBb0JYLE1BQU1FLElBQUlVLE1BQUosQ0FBV1gsSUFBakIsRUFBdUJDLEdBQXZCLEVBQTRCQyxHQUE1QixDQUFwQjtBQUFBLEtBQXJCO0FBQ0QsR0FkTyxDQUFSOztBQWdCQVUsVUFBUUMsR0FBUixDQUFZLHVEQUFaOztBQUVBLE1BQU1DLFNBQVMsZUFBS0MsWUFBTCxDQUFrQnRCLEdBQWxCLENBQWY7QUFDQXFCLFNBQU9FLE1BQVAsQ0FBY0MsSUFBZCxFQUFvQjtBQUFBLFdBQU1MLFFBQVFDLEdBQVIsQ0FBWSxnQkFBTUssSUFBTix1Q0FBK0NELElBQS9DLENBQVosQ0FBTjtBQUFBLEdBQXBCOztBQUVBO0FBQ0FMLFVBQVFDLEdBQVIsQ0FBWSxnQkFBTU0sSUFBTixDQUFXLDhCQUFYLENBQVo7QUFDQVAsVUFBUUMsR0FBUixDQUFZLGdCQUFNTSxJQUFOLENBQVcsOEJBQVgsQ0FBWjs7QUFFQTtBQUNBLE1BQU1DLGdCQUFnQixJQUFJakMsSUFBSWtDLE1BQUosQ0FBV0MsYUFBZixDQUE2QixFQUFFTCxNQUFNLElBQVIsRUFBN0IsQ0FBdEI7QUFDQSxNQUFNTSxhQUFhLElBQUlwQyxJQUFJcUMsSUFBSixDQUFTQyxVQUFiLENBQXdCLEVBQUVSLE1BQU0sSUFBUixFQUF4QixDQUFuQjtBQUNBOztBQUVBRyxnQkFBY00sT0FBZCxDQUFzQkgsVUFBdEI7O0FBRUFYLFVBQVFDLEdBQVIsQ0FBWSx1REFBWjtBQUNELENBNUNILEVBNkNHYyxLQTdDSCxDQTZDUztBQUFBLFNBQU9mLFFBQVFnQixLQUFSLENBQWNDLElBQUlDLEtBQWxCLENBQVA7QUFBQSxDQTdDVCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IHV3cyBmcm9tICd1d3MnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBjb25uZWN0IGZyb20gJ2Nvbm5lY3QnO1xuaW1wb3J0IGNvbm5lY3RSb3V0ZSBmcm9tICdjb25uZWN0LXJvdXRlJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHBvcnRmaW5kZXIgZnJvbSAncG9ydGZpbmRlcic7XG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJztcbmltcG9ydCBzZXJ2ZUZhdmljb24gZnJvbSAnc2VydmUtZmF2aWNvbic7XG5pbXBvcnQgdGVtcGxhdGUgZnJvbSAnZWpzLXRlbXBsYXRlJztcbi8vIG5vdCB2ZXJ5IGNsZWFuIGJ1dC4uLlxuaW1wb3J0IHsgZ2V0VHJhbnNwaWxlciB9IGZyb20gJy4uLy4uL2Jpbi9ydW5uZXInO1xuaW1wb3J0ICogYXMgbGZvIGZyb20gJ3dhdmVzLWxmby9ub2RlJztcblxuXG5jb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpO1xucG9ydGZpbmRlci5iYXNlUG9ydCA9IDMwMDA7XG5cbnBvcnRmaW5kZXIuZ2V0UG9ydFByb21pc2UoKVxuICAudGhlbihwb3J0ID0+IHtcbiAgICBjb25zdCBhcHAgPSBjb25uZWN0KCk7XG5cbiAgICBhcHAudXNlKHNlcnZlRmF2aWNvbignLi9wdWJsaWMvZmF2aWNvbi5pY28nKSk7XG4gICAgYXBwLnVzZShzZXJ2ZVN0YXRpYygnLi9wdWJsaWMnKSk7XG4gICAgYXBwLnVzZSh0ZW1wbGF0ZS5taWRkbGV3YXJlKHtcbiAgICAgIGJhc2VkaXI6IHBhdGguam9pbihjd2QsICdzcmMnLCAnY2xpZW50JyksXG4gICAgICBhdXRvcmVsb2FkOiB0cnVlLFxuICAgIH0pKTtcblxuICAgIGFwcC51c2UoY29ubmVjdFJvdXRlKHJvdXRlciA9PiB7XG4gICAgICBjb25zdCBzZXJ2ZSA9IChuYW1lLCByZXEsIHJlcykgPT4ge1xuICAgICAgICBjb25zdCB0cmFuc3BpbGVyID0gZ2V0VHJhbnNwaWxlcigpO1xuICAgICAgICAvLyBidW5kbGUgdGhlIGpzIGZpbGUgdGhhdCBjb3JyZXNwb25kIHRvIHRoZSBjbGllbnRcbiAgICAgICAgY29uc3QgZW50cnlQb2ludCA9IHBhdGguam9pbihjd2QsICdkaXN0JywgJ2NsaWVudCcsIGAke25hbWV9LmpzYCk7XG4gICAgICAgIGNvbnN0IG91dEZpbGUgPSBwYXRoLmpvaW4oY3dkLCAncHVibGljJywgYCR7bmFtZX0tYnVuZGxlLmpzYCk7XG5cbiAgICAgICAgdHJhbnNwaWxlci5idW5kbGUoZW50cnlQb2ludCwgb3V0RmlsZSwgKCkgPT4ge1xuICAgICAgICAgIHJlcy5lbmRUZW1wbGF0ZSgndGVtcGxhdGUuZWpzJywgeyBuYW1lIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHJvdXRlci5nZXQoJy8nLCAocmVxLCByZXMsIG5leHQpID0+IHNlcnZlKCdpbmRleCcsIHJlcSwgcmVzKSk7XG4gICAgICByb3V0ZXIuZ2V0KCcvOm5hbWUnLCAocmVxLCByZXMsIG5leHQpID0+IHNlcnZlKHJlcS5wYXJhbXMubmFtZSwgcmVxLCByZXMpKTtcbiAgICB9KSk7XG5cbiAgICBjb25zb2xlLmxvZygnUEhPTkUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcblxuICAgIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKGFwcCk7XG4gICAgc2VydmVyLmxpc3Rlbihwb3J0LCAoKSA9PiBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGBzZXJ2ZXIgc3RhcnRlZDogaHR0cDovLzEyNy4wLjAuMToke3BvcnR9YCkpKTtcblxuICAgIC8vIGxmbyByb3V0aW5nXG4gICAgY29uc29sZS5sb2coY2hhbGsuZ3JleSgnc29ja2V0IHJlY2VpdmUgb24gcG9ydDogNTAwMCcpKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ncmV5KCdzb2NrZXQgc2VuZCBvbiBwb3J0OiAgICA1MDEwJykpO1xuXG4gICAgLy8gcGlwZSBwaG9uZSB0byBkZXNrdG9wIGNsaWVudFxuICAgIGNvbnN0IHNvY2tldFJlY2VpdmUgPSBuZXcgbGZvLnNvdXJjZS5Tb2NrZXRSZWNlaXZlKHsgcG9ydDogNTAwMCB9KTtcbiAgICBjb25zdCBzb2NrZXRTZW5kID0gbmV3IGxmby5zaW5rLlNvY2tldFNlbmQoeyBwb3J0OiA1MDEwIH0pO1xuICAgIC8vIGNvbnN0IGxvZ2dlciA9IG5ldyBsZm8uc2luay5Mb2dnZXIoeyBkYXRhOiBmYWxzZSwgdGltZTogdHJ1ZSB9KTtcblxuICAgIHNvY2tldFJlY2VpdmUuY29ubmVjdChzb2NrZXRTZW5kKTtcblxuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICB9KVxuICAuY2F0Y2goZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKSk7XG4iXX0=