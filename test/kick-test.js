const motionInput = new source.MotionInput();
const kick = new operator.MotionFeatures({
  features: 'kick',
});
const bridge = new sink.Bridge({
  callback: (value) => {
    if (value === 1)
      // do stuff
  }
});

motionInput.connect(kick);
kick.connect(bridge);
