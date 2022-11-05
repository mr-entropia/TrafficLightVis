var setupURL = "http://127.0.0.1:11580/vis/setup/TESTINT1"
var stateURL = "http://127.0.0.1:11580/vis/state/TESTINT1"


var config = "";
var state = "";
var cnvs = 0;               // global canvas
var errorCounter = 0;       // XHR load errors
const cw = 1000;            // canvas width
const ch = 600;             // canvas height
const cwMin = 70;           // canvas width minimum (counting labels)
const cwMax = cw;           // canvas width max
const slSpacing = 30;       // swim lane spacing
const abHeight = 20;        // active bar height
const req = new XMLHttpRequest();

const barColorRed = "#bb0000";              // Stop and Remain / Stop then Proceed
const barColorGreen = "#00cc00";            // Permissive/Protected Movement Allowed
const barColorAmber = "#edad18";            // Permissive/Protected Clearance
const barColorGray = "#f0f0f0";             // Unknown state
const cursorLineColor = "#c0c0c0";

var timeScale = 20;        // pixels per second
var startTime = 0;
var endTime = 0;
var maxTimeInWindow = 0;

var programPhase = 0;

const cursor =
{
    x: 0,
    y: 0
};

function clearCanvas(ctx)
{
    ctx.save();
    ctx.clearRect(0, 0, cw, ch);
    ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2, col)
{
    ctx.save();
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawActiveBar(ctx, swimLane, x1, x2, col)
{
    y = (swimLane * slSpacing);
    ctx.save();
    ctx.fillStyle = col;
    ctx.fillRect(x1, y - (abHeight / 2), x2 - x1, abHeight);
    ctx.restore();
}

function drawText(ctx, x, y, text, font)
{
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y)
    ctx.restore();
}

function drawBase(ctx, config)
{
    clearCanvas(ctx);

    // Draw swim lanes for signal groups
    for(let i = 0; i < config.signal_groups.length; i++)
    {
        drawLine(ctx, 70, (slSpacing * (i + 1)), cw, (slSpacing * (i + 1)), barColorRed);
        drawText(ctx, 60, (slSpacing * (i + 1)), config.signal_groups[i].name, "20px sans-serif");
    }

    // Draw swim lanes for detectors
    //start_y = (config.signal_groups.length + 1) * slSpacing;
    start_y = 0;
    j = 0;
    for(let i = config.signal_groups.length; i < config.signal_groups.length + config.detectors.length; i++)
    {
        drawLine(ctx, 70, start_y + (slSpacing * (i + 1)), cw, start_y + (slSpacing * (i + 1)), "#BBBBBB");
        drawText(ctx, 60, start_y + (slSpacing * (i + 1)), config.detectors[j].name, "16px sans-serif");
        j++;
    }
}

function drawTooltip(ctx, x, y, text)
{
    // Draw a floating tooltip bottom-right of the cursor position
    // with custom text
    ctx.save();
    ctx.font = "18px sans-serif";
    ctx.textBaseline = "top";
    textmetrics = ctx.measureText(text);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, textmetrics.width + 10, 30);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#222222";
    ctx.fillText(text, x + 5, y + 5);
    ctx.restore();
}

function generateBar()
{
    start = Date.now() + (1 * 1000);
    end = Date.now() - (5 * 1000);
    start2 = Date.now() - 1;
    end2 = Date.now() + (10 * 1000);
    swimlane = 1;
    type = 5;
    return JSON.parse('{"bars": [{"name": "A", "start": ' + start + ', "end": ' + end + ', "swimlane": ' + swimlane + ', "type": ' + type + '},{"name": "A", "start": ' + start2 + ', "end": ' + end2 + ', "swimlane": ' + 1 + ', "type": ' + 7 + '}]}');
}

function increaseTimeScale()
{
    timeScale += 10;
    if(timeScale >= 150)
    {
        timeScale = 150;
    }
}

function decreaseTimeScale()
{
    timeScale -= 10;
    if(timeScale <= 10)
    {
        timeScale = 10;
    }
}

function drawFrame(ctx, config)
{
    // Update internal values
    startTime = Date.now();
    endTime = Date.now() - ((cwMax - cwMin) * timeScale); // * 1000);
    maxTimeInWindow = ((cwMax - cwMin) / timeScale);

    // Draw view
    drawBase(ctx, config);
    state["bars"].forEach(function(bar) {
        if(bar["type"] == 5 || bar["type"] == 6)
        {
            col = barColorGreen;
        }
        else if(bar["type"] == 7 || bar["type"] == 8)
        {
            col = barColorAmber;
        }
        else
        {
            col = barColorGray;
        }
        if(bar["start"] <= startTime)
        {
            startX = cwMax - Math.round((((startTime - bar["start"]) / 1000) * timeScale))
            if(bar["end"] < startTime)
            {
                endX = cwMax - Math.round((((startTime - bar["end"]) / 1000) * timeScale))
            }
            else
            {
                endX = cwMax;
            }
            if(startX <= cwMin)
            {
                startX = cwMin;
            }
            if(endX <= cwMin)
            {
                endX = cwMin;
            }
            drawActiveBar(ctx, bar["swimlane"], startX, endX, col);
            if(getCursorViewPosition().ypos == bar["swimlane"] && cursor.x <= startX && cursor.x >= endX)
            {
                drawTooltip(ctx, cursor.x + 10, cursor.y + 10, "Signal group " + bar["name"]);
            }
        }
    });

    // Draw a vertical line where the mouse cursor is
    if(cursor.x > cwMin && cursor.x < cwMax && cursor.y < ch)
    {
        curpos = getCursorViewPosition();
        document.getElementById("cursorlocation").innerHTML = cursor.x + " / " + formatUXTime(curpos.xpos) + " x " + curpos.ypos;
        drawLine(ctx, cursor.x, 0, cursor.x, cw - 1, cursorLineColor);
        drawLine(ctx, cwMin, cursor.y, cwMax - 1, cursor.y, cursorLineColor);
    }

    // XHR load error tracking
    if(errorCounter > 5)
    {
        drawText(ctx, (cw / 2) + (cw / 4), 100, "Error loading state! Stale data!", "36px sans-serif");
    }

    // Update state table
    document.getElementById("statecontents").innerHTML = "";
    state["bars"].forEach(function(bar) {
        duration = (bar["end"] - bar["start"]) / 1000;
        document.getElementById("statecontents").innerHTML += "<tr><td>" + bar["name"] + "</td><td>" + SG(bar["type"]) + "</td><td>" + formatUXTime(bar["start"]) + "</td><td>" + formatUXTime(bar["end"]) + "</td><td>" + duration + "</td>"
    });

    // Update debug table
    document.getElementById("starttime").innerHTML = formatUXTime(startTime);
    document.getElementById("endtime").innerHTML = formatUXTime(endTime);
    document.getElementById("timescale").innerHTML = timeScale + " px/s";
    document.getElementById("maxtimeinwindow").innerHTML = maxTimeInWindow + " s";
    document.getElementById("programphase").innerHTML = programPhase;
}

function formatUXTime(uxtime)
{
    const tzOffset = (1000 * 60 * 60 * 2);  // hack, UTC+2
    var newDate = new Date();
    newDate.setTime(uxtime + tzOffset);
    return newDate.toUTCString();
}

function getSwimlaneForItem(name)
{
    for(let i = 0; i < config.signal_groups.length; i++)
    {
        if(config.signal_groups[i].name == name)
        {
            return i + 1;
        }
    }
    return -1;
}

/* SG state to string */
function SG(state)
{
    if(state == 0) { return "Unavailable"; }
    if(state == 1) { return "Dark"; }
    if(state == 2) { return "StopThenProceed"; }
    if(state == 3) { return "StopAndRemain"; }
    if(state == 4) { return "PreMovement"; }
    if(state == 5) { return "PermissiveMovementAllowed"; }
    if(state == 6) { return "ProtectedMovementAllowed"; }
    if(state == 7) { return "PermissiveClearance"; }
    if(state == 8) { return "ProtectedClearance"; }
    if(state == 9) { return "CautionConflictingTraffic"; }
    if(state == 10) { return "PermissiveMovementPreClearance"; }
    if(state == 11) { return "ProtectedMovementPreClearance"; }
    return "Unknown (" + state + ")"
}

function updateState(e)
{
    const ctx = cnvs.getContext("2d");
    if(e.type == "error" && programPhase == 0)
    {
        drawText(ctx, (cw / 2) + (cw / 6), 100, "Unable to load setup!", "36px sans-serif");
    }
    else if(e.type == "error" && programPhase > 0)
    {
        errorCounter++;
    }
    else
    {
        if(programPhase == 0)
        {
            console.log("Received setup JSON object");
            config = JSON.parse(this.responseText);
            programPhase++;
            periodicUpdateState();
        }
        else if(programPhase == 1)
        {
            state = JSON.parse(this.responseText);
            console.log("Received first state JSON object");
            // Set up interval functions such as drawing and updating state object
            setInterval(drawFrame, 66, ctx, config);        
            setInterval(periodicUpdateState, 1000);
            programPhase++;
        }
        else if(programPhase == 2)
        {
            state = JSON.parse(this.responseText);
            errorCounter = 0;
        }
    }
}

function getSetup()
{
    req.open("GET", setupURL);
    req.send();
}

function periodicUpdateState()
{
    req.open("GET", stateURL);
    req.send();
}

function getCursorViewPosition()
{
    // xpos returns time inside view
    // ypos returns swimlane index
    xpos = (cursor.x - cwMin) / (cwMax - cwMin) * (startTime - endTime) + endTime;
    ypos = 0;
    for(let i = 0; i < 20; i++)
    {
        testpos = Math.abs(cursor.y - (slSpacing * (i)));
        if(testpos < 15)
        {
            ypos = i;
        }
    }
    return { 'xpos': xpos, 'ypos': ypos };
}

addEventListener("mousemove", (e) =>
{
    cursor.x = e.clientX - cnvs.getBoundingClientRect().left;
    cursor.y = e.clientY - cnvs.getBoundingClientRect().top;
});

window.onload = function() {
    // Get canvas and its context
    cnvs = document.getElementById("vis");
    const ctx = cnvs.getContext("2d");

    // Set up XHR
    req.addEventListener("load", updateState);
    req.addEventListener("error", updateState);

    // Bind timescale inc/dec buttons to their functions
    document.getElementById("inc-timescale").onclick = increaseTimeScale;
    document.getElementById("dec-timescale").onclick = decreaseTimeScale;

    // Start the ball rolling
    getSetup();
};