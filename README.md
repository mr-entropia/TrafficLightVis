# TrafficLightVis
Traffic light bar visualizer in HTML 5 Canvas, programmed in vanilla JavaScript.

Reads in a configuration JSON for signal groups as well as detectors, with their names. When running it periodically reads in a state JSON which contains start and end times for bars, as well as some metadata. These bars are then displayed dynamically on lines. When mouse is hovered over a bar, metadata for that bar is displayed.

## Configuring
In the beginning of the `traffiglightvis.js` file, configure addresses for setup and state. Setup will be requested using GET method once at the beginning to populate swimlanes. Once ready, state will be requested using GET method periodically to update the state table.

## Inner workings
### Setup
Setup is a JSON object which contains data about the signal groups and detectors (their name). Without this object, TrafficLightVis is unable to work.

### State
State is a JSON object which contains `starttime`, `endtime`, `swimlane` and `type` information for all bars present in the graph. If `starttime` is equal to or larger than current time (`Date.now()`), then the bar will be ignored. If `endtime` is equal to or larger than current time, bar will be drawn up to the right border. `swimlane` defines on which swimlane this bar will be drawn on. `type` tells the SPaT state (see references) of the signal group. If it is a detector, we don't care about type.

## References
SPaT: [Signal Phase and Timing](https://www.crow.nl/downloads/pdf/verkeer-en-vervoer/verkeersmanagement/landelijke-ivri-standaarden/d3046-2_spat-profile.aspx), Level 3.1

## Acknowledgements
This project has been supported by my employer [Solita Oy](https://github.com/solita).