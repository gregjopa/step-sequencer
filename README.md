# step-sequencer.js
## Overview

step-sequencer.js is a simple step sequencer designed to use native nodes in the Web Audio API.


## Example usage

```javascript
    var context = new webkitAudioContext();
    
    // create a new step sequencer with parameters:
    // (audio context, step length, sequence of frequences)
    var song1 = new StepSequencer(context, 1, [440, 660, 440, 400]);

    // method to inject other audio nodes at the end of the graph
    song1.setupAudio();

    // start playing sequence
    song1.play();

```