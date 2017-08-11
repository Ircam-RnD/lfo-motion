import 'source-map-support/register';
import http from 'http';
import uws from 'uws';
import connect from 'connect';
import connectRoute from 'connect-route';
import path from 'path';
import portfinder from 'portfinder';
import serveStatic from 'serve-static';
import serveFavicon from 'serve-favicon';
import template from 'ejs-template';
// not very clean but...
import { getTranspiler } from '../../bin/runner';
import * as lfo from 'waves-lfo/node';


const cwd = process.cwd();
portfinder.basePort = 3000;

portfinder.getPortPromise()
  .then(port => {
    const app = connect();

    app.use(serveFavicon('./public/favicon.ico'));
    app.use(serveStatic('./public'));
    app.use(template.middleware({
      basedir: path.join(cwd, 'src', 'client'),
      autoreload: true,
    }));

    app.use(connectRoute(router => {
      const serve = (name, req, res) => {
        const transpiler = getTranspiler();
        // bundle the js file that correspond to the client
        const entryPoint = path.join(cwd, 'dist', 'client', `${name}.js`);
        const outFile = path.join(cwd, 'public', `${name}-bundle.js`);

        transpiler.bundle(entryPoint, outFile, () => {
          res.endTemplate('template.ejs', { name });
        });
      };

      router.get('/', (req, res, next) => serve('index', req, res));
      router.get('/:name', (req, res, next) => serve(req.params.name, req, res));
    }));

    console.log('-----------------------------------------------');

    const server = http.createServer(app);
    server.listen(port, () => console.log(`server started: http://127.0.0.1:${port}`));

    // lfo routing
    const logger = new lfo.sink.Logger({
      data: true,
      time: false,
    });

    console.log('socket receive on ports: 500x');
    console.log('socket send on ports:    501x');

    // pipe phone to desktop client
    const phoneSocketReceive = new lfo.source.SocketReceive({ port: 5000 });
    const phoneSocketSend = new lfo.sink.SocketSend({ port: 5010 });

    phoneSocketReceive.connect(phoneSocketSend);
    // phoneSocketReceive.connect(logger);
  })
  .catch(err => console.error(err.stack));
