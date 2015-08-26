import express from 'express';
import zlib from 'zlib';
import compression from 'compression';
import {EventEmitter} from 'events';
import readFormBody from './readFormBody';
import indexTemplate from './templates/index';
import settingsTemplate from './templates/settings';

const compressor = compression({
  flush: zlib.Z_PARTIAL_FLUSH
});

const connectionTypes = ['perfect', 'slow', 'lie-fi', 'offline'];

export default class Server extends EventEmitter {
  constructor() {
    super();
    this._app = express();

    const staticOptions = {
      maxAge: 0
    };

    this._app.use('/js', express.static('../public/js', staticOptions));
    this._app.use('/css', express.static('../public/css', staticOptions));
    this._app.use('/imgs', express.static('../public/imgs', staticOptions));

    this._app.get('/', compressor, (req, res) => {
      res.send(indexTemplate({
        scripts: '<script src="/js/settings.js" defer></script>',
        extraCss: '<link rel="stylesheet" href="/css/settings.css" />',
        content: settingsTemplate()
      }));
    });

    this._app.post('/set', compressor, readFormBody(), (req, res) => {
      if (!req.body
      || !req.body.connectionType
      || connectionTypes.indexOf(req.body.connectionType) == -1) {
        return res.sendStatus(400);
      }

      res.send({
        ok: true
      });

      this.emit('connectionChange', {type: req.body.connectionType});
    });
  }

  listen(port) {
    this._app.listen(port, _ => {
      console.log("Config server listening at localhost:" + port);
    });
  }
}