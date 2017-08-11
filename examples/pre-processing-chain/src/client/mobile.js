import * as lfo from 'waves-lfo/client';
import motionInput from 'motion-input';

motionInput
  .init(['accelerationIncludingGravity', 'rotationRate'])
  .then(([accelerationIncludingGravity, rotationRate]) => {

    // @todo - replace with lfo.source.MotionInput

    const eventIn = new lfo.source.EventIn({
      frameType: 'vector',
      frameSize: 6,
      frameRate: 1 / accelerationIncludingGravity.period,
    });

    const socketSend = new lfo.sink.SocketSend({ port: 5000 });

    eventIn.connect(socketSend);
    eventIn.init().then(() => {
      eventIn.start();
      let data = [];

      /**
       * send:
       *
       * 0 - acc x
       * 1 - acc y
       * 2 - acc z
       * 5 - yaw
       * 4 - pitch
       * 3 - roll
       */
      if (accelerationIncludingGravity.isValid && rotationRate.isValid) {
        accelerationIncludingGravity.addListener(([x, y, z]) => {
          data[0] = x;
          data[1] = y;
          data[2] = z;
        });

        rotationRate.addListener(([alpha, beta, gamma]) => {
          data[3] = alpha;
          data[4] = beta;
          data[5] = gamma;

          eventIn.process(null, data);
        });
      } else if (accelerationIncludingGravity.isValid) {
        accelerationIncludingGravity.addListener(([x, y, z]) => {
          data[0] = x;
          data[1] = y;
          data[2] = z;
          data[3] = 0;
          data[4] = 0;
          data[5] = 0;

          eventIn.process(null, data);
        });
      }
    });
  });
