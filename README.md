# lfo-motion

> Set of client-side `lfo` modules dedicated to sensors capture, filtering and 
> movement analysis.
> 
> _see [waves-lfo](https://github.com/wavesjs/waves-lfo)_

## Install

The final application must import the `lfo-motion` modules (aka the plugin) _and_ the `waves-lfo` library

```sh
npm install [--save --save-exact] waves-lfo
npm install [--save --save-exact] ircam-rnd/lfo-motion
```

```js
import * as lfo from 'waves-lfo'
import * as lfoMotion from 'lfo-motion'
```

## Example Use

```
import * as lfo from 'waves-lfo';
import * as lfoMotion from 'lfo-motion';

const motionInput = new lfoMotion.source.MotionInput();
const sampler = new lfoMotion.operator.Sampler({ frameRate: 50 });
const orientation = new lfoMotion.operator.Orientation();
const logger = new lfo.sink.Logger({ data: true });

motionInput.connect(sampler);
sampler.connect(orientation);
orientation.connect(logger);

motionInput.init().then(() => motionInput.start())
```

## Credits

This library is developed by the ISMM team at IRCAM, within the context of the RAPID-MIX project, funded by the European Union’s Horizon 2020 research and innovation programme.
