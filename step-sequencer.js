/**
 * step-sequencer.js - simple step sequencer that uses native nodes in the Web Audio API.
 *
 * @constructor
 * @param {AudioContext} [audioContext] - Web Audio API context
 * @param {Number} [stepLength] - duration of note in seconds
 * @param {Array} [steps] - array of frequencies
 *
*/

function StepSequencer (audioContext, stepLength, steps) {

  this.AC = audioContext;
  this.stepLength = isNaN(stepLength) ? this.stepLength : stepLength;
  this.steps = steps || [440, 660, 440, 400];

  this._init();
}


StepSequencer.prototype = {

  AC: null,
  stepLength: 1,
  steps: null,
  previousNoteStartTime: 0,
  currentStepIndex: 0,
  intervalID: 0,   
  
  masterVolume: null,
  noteOutputNode: null,

  // offsets measured in seconds
  sequencerStartTimeOffset: 0.1,
  sequencerCurrentTimeOffset: 0.1,


  _init: function() {

    // offset sequencer start time property
    this.sequencerStartTime = this.AC.currentTime + this.sequencerStartTimeOffset;

    // master volume gain node to connect to speakers
    this.masterVolume = this.AC.createGainNode();
    this.masterVolume.connect(this.AC.destination);
    this.masterVolume.gain.value = .5;

    // default note output to master volume gain node
    this.noteOutputNode = this.masterVolume;

  },


  setupAudio: function() {

    // add any additional audio nodes here and connect them to master volume
    var compressor = this.AC.createDynamicsCompressor();
    compressor.connect(this.masterVolume);

    // set output audio node for scheduleStep() to use
    this.noteOutputNode = compressor;
  },


  scheduleStep: function(freq, stepLength, startTime) {

    var oscillator = this.AC.createOscillator();
    oscillator.frequency.value = freq;

    // used as ADSR Envelope
    var envelope = this.AC.createGainNode();
    envelope.connect(this.noteOutputNode);
    envelope.gain.value = 0;

    // calculate attack, decay, and release times
    var attackTime = stepLength * 0.15;
    var decayTime = stepLength * 0.1;
    var sustainTime = stepLength * 0.5;
    var releaseTime = stepLength * 0.25;

    // start at 0
    envelope.gain.setValueAtTime(0.0, startTime);

    // attack
    envelope.gain.linearRampToValueAtTime(1.0, startTime + attackTime);

    // decay
    envelope.gain.linearRampToValueAtTime(0.8, startTime + (attackTime + decayTime) );

    // sustain
    envelope.gain.linearRampToValueAtTime(0.75, startTime + (attackTime + decayTime 
        + sustainTime) );

    // release
    envelope.gain.linearRampToValueAtTime(0.0, startTime + (attackTime + decayTime 
        + sustainTime + releaseTime) );


    oscillator.connect(envelope);

    oscillator.noteOn(startTime);
    oscillator.noteOff(startTime + stepLength);

  },


  _startSchedulerLoop: function(outputNode) {

    var self = this;

    schedulerLoop();

    var intervalID = setInterval(schedulerLoop, 100);


    function schedulerLoop() {

      var sequencerCurrentTime = self.AC.currentTime - self.sequencerStartTime;

      if(sequencerCurrentTime > self.previousNoteStartTime) {
        
        // delay 200ms after current time
        var nextNoteStartTime = self.AC.currentTime + self.sequencerCurrentTimeOffset;


        // loop if at end of sequence
        if (self.currentStepIndex >= self.steps.length) {
          self.currentStepIndex = 0;                
        }

        self.scheduleStep(self.steps[self.currentStepIndex], self.stepLength, nextNoteStartTime);

        self.previousNoteStartTime = nextNoteStartTime + self.stepLength;
        self.currentStepIndex++;

      }

    }

    return intervalID;
  },


  play: function() {
    this.intervalID = this._startSchedulerLoop();
  },


  stop: function() {
    clearInterval(this.intervalID);
  }

};
