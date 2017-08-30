import * as lfo from 'waves-lfo/client';
import * as controllers from 'basic-controllers';
import Intensity from '../../../../dist/operator/Intensity';

const logger = new lfo.sink.Logger({ time: false, data: true });

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
const socketReceive = new lfo.source.SocketReceive({ port: 5010 });
const select = new lfo.operator.Select({ indexes: [0, 1, 2] });
// const delta = new lfo.operator.Delta({ size: 3 });
const intensity = new Intensity();

socketReceive.connect(select);
select.connect(intensity);

for (let i = 0; i < 4; i++) {
  const select = new lfo.operator.Select({ index: i });
  const display = new lfo.sink.BpfDisplay({
    canvas: `#phone-${i}`,
    width: 400,
    height: 200,
    min: -1,
    max: 1,
    duration: 5,
  });

  intensity.connect(select);
  select.connect(display);
}

// init graph
socketReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 6,
  frameRate: 1 / 0.016666,
});

/**
 * from R-ioT:
 *
 * 0 - acc x
 * 1 - acc y
 * 2 - acc z
 * 3 - roll
 * 4 - pitch
 * 5 - yaw
 */

const riotSocketReceive = new lfo.source.SocketReceive({ port: 5011 });

for (let i = 0; i < 4; i++) {
  const select = new lfo.operator.Select({ index: i });
  const display = new lfo.sink.BpfDisplay({
    canvas: `#riot-${i}`,
    width: 400,
    height: 200,
    min: -1,
    max: 1,
    duration: 5,
  });

  riotSocketReceive.connect(select);
  select.connect(display);
}

// init graph
riotSocketReceive.processStreamParams({
  frameType: 'vector',
  frameSize: 4,
  frameRate: 0,
});
