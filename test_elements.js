// User-configurable features
var setupURL = "http://127.0.0.1:11580/vis/setup/TESTINT1"
var stateURL = "http://127.0.0.1:11580/vis/state/TESTINT1"
var debugEnable = true;

// Don't touch beyond here
var config = "";            // JSON object placeholder
var state = "";             // JSON object placeholder
var cnvs = 0;               // Global canvas
var errorCounter = 0;       // XHR load errors
const cw = 1000;            // Canvas width
const ch = 600;             // Canvas height
const cwMin = 70;           // Canvas width minimum (counting labels)
const cwMax = cw;           // Canvas width max
const slSpacing = 30;       // Swimlane spacing
const abHeight = 20;        // Active bar height
const req = new XMLHttpRequest();

// Run-time variables
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
var marker1X = 0;
var marker2X = 0;
var markerSel = 0;



function generateBar()
{
    // FOR DEBUG PURPOSES
    time_now = Date.now();

    // PreMovement
    start = time_now - (15 * 1000);
    end = time_now - (12 * 1000);

    // PermissiveMovementAllowed
    start2 = time_now - (12 * 1000);
    end2 = time_now - (3 * 1000);

    // PermissiveClearance
    start3 = time_now - (3 * 1000);
    end3 = time_now;

    swimlane = 1;
    type = 4;
    type2 = 5;
    type3 = 7;

    document.getElementById("timenow").innerHTML = formatUXTime(time_now);

    return JSON.parse('{"bars": [{"name": "A", "start": ' + start + ', "end": ' + end + ', "swimlane": ' + swimlane + ', "type": ' + type + '},{"name": "A", "start": ' + start2 + ', "end": ' + end2 + ', "swimlane": ' + 1 + ', "type": ' + type2 + '},{"name": "A", "start": ' + start3 + ', "end": ' + end3 + ', "swimlane": ' + swimlane + ', "type": ' + type3 + '}]}');
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

function updateElements()
{
    // Variables for calculations
    endTime = Date.now() - (document.getElementById("visarea").clientWidth * timeScale);
    startTime = Date.now();
    maxTimeInWindow = document.getElementById("visarea").clientWidth / timeScale;

    // Clear visarea
    document.getElementById("visarea").innerHTML = "";

    // Get unique types into their own swimlanes
    var swimlanes = [];
    state["bars"].forEach(function(bar) {
        if (!swimlanes.includes(bar["name"]))
        {
            swimlanes.push(bar["name"]);
        }
    });

    // Draw swimlanes
    var yPos = 30;
    swimlanes.forEach(function(swimlane) {
        placeElement("swimlane", "swimlane-sg", 0, 0, yPos, swimlane, "");
        yPos += 30;
    });

    // Draw timing elements
    state["bars"].forEach(function(bar) {
        duration = (bar["end"] - bar["start"]) / 1000;
        innerText = duration + " s";
        tooltipText = bar["name"] + " " + SG(bar["type"]) + " for " + duration + " s";
        yPos = 20 + (swimlanes.indexOf(bar["name"]) * 30);

        startX = document.getElementById("visarea").clientWidth - Math.round((((endTime - bar["start"]) / 1000) * timeScale))
        if(bar["end"] < startTime)
        {
            //console.log("if");
            endX = document.getElementById("visarea").clientWidth - Math.round((((endTime - bar["end"]) / 1000) * timeScale))
        } else {
            console.log("else: " + bar["end"] + " > " + startTime);
            endX = document.getElementById("visarea").clientWidth;
        }

        if (endX > -10)
        {
            console.log(startX + " -- " + endX);
            placeElement("timing", SG_SPaT_type(bar["type"]), startX, endX, yPos, innerText, tooltipText);
            console.log(" ");
        }
    });


    /*
    placeElement("swimlane", "swimlane-sg", 0, 0, 110, "A", "");
    placeElement("swimlane", "swimlane-others", 0, 0, 210, "B50", "");
    placeElement("timing", "green-bar", 100, 300, 100, "this is a test", "tooltip text");
    */

    
    // XHR load error tracking
    if(errorCounter > 5)
    {
        document.getElementById("notification").innerHTML = "Unable to load state data!<br />Current data is stale!";
        document.getElementById("notification").style.visibility = "visible";
    } else {
        document.getElementById("notification").style.visibility = "hidden";
    }

    // Update state table
    document.getElementById("statecontents").innerHTML = "";
    state["bars"].forEach(function(bar) {
        duration = (bar["end"] - bar["start"]) / 1000;
        //document.getElementById("statecontents").innerHTML += "<tr><td>" + bar["name"] + "</td><td>" + SG(bar["type"]) + "</td><td>" + formatUXTime(bar["start"]) + "</td><td>" + formatUXTime(bar["end"]) + "</td><td>" + duration + "</td>"
        document.getElementById("statecontents").innerHTML += "<tr><td>" + bar["name"] + "</td><td>" + SG(bar["type"]) + "</td><td>" + bar["start"] + "</td><td>" + bar["end"] + "</td><td>" + duration + "</td>"
    });

    if(debugEnable)
    {
        // Update debug table
        document.getElementById("starttime").innerHTML = startTime; //formatUXTime(startTime);
        document.getElementById("endtime").innerHTML = endTime; //formatUXTime(endTime);
        document.getElementById("timescale").innerHTML = timeScale + " px/s";
        document.getElementById("maxtimeinwindow").innerHTML = maxTimeInWindow + " s";
        document.getElementById("programphase").innerHTML = programPhase;
    }
}

function placeElement(type, style, start_x, end_x, y_pos, text1, text2)
{
    if (type == "timing")
    {
        // Create tooltip element
        var tooltip_element = document.createElement("span");
        tooltip_element.appendChild(document.createTextNode(text2));
        tooltip_element.classList.add("tooltip-text");

        // Create timing element
        var element = document.createElement("div");
        element.appendChild(document.createTextNode(text1));
        element.classList.add("timing-element");
        element.classList.add(style);
        element.appendChild(tooltip_element);
        element.style.top = y_pos + "px";
        element.style.left = start_x + "px";
        element.style.width = (end_x - start_x) + "px";

        // Add element to visarea
        document.getElementById("visarea").appendChild(element);
    } else if (type == "swimlane")
    {
        // Create swimlane
        var swimlane_element = document.createElement("div");
        swimlane_element.classList.add(style);
        swimlane_element.style.top = y_pos;

        // Create label
        var label_element = document.createElement("div");
        label_element.classList.add("label-element");
        label_element.appendChild(document.createTextNode(text1));
        label_element.style.top = y_pos - 18 + "px";
        label_element.style.left = "10px";
        label_element.style.width = "50px";

        // Add elements to visarea
        document.getElementById("visarea").appendChild(swimlane_element);
        document.getElementById("visarea").appendChild(label_element);
    }
}

function drawFrame(ctx, config)
{
    var tooltip = 
    {
        draw: false,
        x: 0,
        y: 0,
        text: ""
    };

    // Update internal values
    startTime = Date.now() - ((cwMax - cwMin) * timeScale);
    endTime = Date.now();
    maxTimeInWindow = ((cwMax - cwMin) / timeScale);

    // Draw view
    drawBase(ctx, config);

    // Draw bars
    state["bars"].forEach(function(bar) {
        var doNotDraw = false;

        if(bar["type"] == 0 || bar["type"] == 1)
        {
            col = barColorGray;
        }
        else if(bar["type"] == 2 || bar["type"] == 3)
        {
            doNotDraw = true;
        }
        else if(bar["type"] == 4)
        {
            col = barColorRedAmber;
        }
        else if(bar["type"] == 5 || bar["type"] == 6)
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
        if(bar["start"] <= endTime)
        {
            startX = cwMax - Math.round((((endTime - bar["start"]) / 1000) * timeScale))
            if(bar["end"] < startTime)
            {
                endX = cwMax - Math.round((((endTime - bar["end"]) / 1000) * timeScale))
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

            if(!doNotDraw)
            {
                drawActiveBar(ctx, getSwimlaneForItem(bar["name"]), startX, endX, col);
            }

            if(getCursorViewPosition().ypos == getSwimlaneForItem(bar["name"]) && cursor.x >= startX && cursor.x <= endX)
            {
                duration = (bar["end"] - bar["start"]) / 1000;
                tooltip.draw = true;
                tooltip.x = cursor.x + 10;
                tooltip.y = cursor.y + 10;
                tooltip.text = bar["name"] + ": " + SG(bar["type"]) + " (" + duration + " s)";
            }
        }
    });

    // Draw a vertical line where the mouse cursor is
    if(cursor.x > cwMin && cursor.x < cwMax && cursor.y < ch)
    {
        if(debugEnable)
        {
            curpos = getCursorViewPosition();
            document.getElementById("cursorlocation").innerHTML = cursor.x + " / " + formatUXTime(curpos.xpos) + " x " + curpos.ypos;
        }
        document.getElementById("vertical-cursor").style = "left: " + cursor.x;
    }

    // XHR load error tracking
    if(errorCounter > 5)
    {
        console.log("Error loading state! Stale data!");
    }

    // Update state table
    document.getElementById("statecontents").innerHTML = "";
    state["bars"].forEach(function(bar) {
        duration = (bar["end"] - bar["start"]) / 1000;
        document.getElementById("statecontents").innerHTML += "<tr><td>" + bar["name"] + "</td><td>" + SG(bar["type"]) + "</td><td>" + formatUXTime(bar["start"]) + "</td><td>" + formatUXTime(bar["end"]) + "</td><td>" + duration + "</td>"
    });

    if(debugEnable)
    {
        // Update debug table
        document.getElementById("starttime").innerHTML = formatUXTime(startTime);
        document.getElementById("endtime").innerHTML = formatUXTime(endTime);
        document.getElementById("timescale").innerHTML = timeScale + " px/s";
        document.getElementById("maxtimeinwindow").innerHTML = maxTimeInWindow + " s";
        document.getElementById("programphase").innerHTML = programPhase;
    }
}

function formatUXTime(uxtime)
{
    const tzOffset = (1000 * 60 * 60 * 2);  // hack, UTC+2
    var newDate = new Date();
    newDate.setTime(uxtime + tzOffset);
    return newDate.toUTCString();
}

function SG(state)
{
    if(config["state_type"] == "SPaT")
    {
        return SG_SPaT(state);
    } else if(config["state_type"] == "ISGS")
    {
        return SG_ISGS(state);
    } else {
        return SG_SPaT(state);
    }
}

/* SG state to string, SPaT indices */
function SG_SPaT(state)
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

/* SG state to string, ISGS indices */
function SG_ISGS(state)
{
    if(state == 0) { return "Passive Red"; }
    if(state == 1) { return "Red Request"; }
    if(state == 2) { return "Red Wait"; }
    if(state == 3) { return "Red Stop"; }
    if(state == 4) { return "Intergreen/Start Delay"; }
    if(state == 5) { return "Red Privilege"; }
    if(state == 6) { return "Red Priority"; }
    if(state == 7) { return "Red Clearance Interval"; }
    if(state == 8) { return "Minimum Red"; }
    if(state == 9) { return "VA Minimum Red"; }
    if(state == 10) { return "Red Synchornization"; }
    if(state == 12) { return "Red/Amber"; }
    if(state == 13) { return "Passive Green"; }
    if(state == 14) { return "Minimum Green"; }
    if(state == 15) { return "Green Extension"; }
    if(state == 16) { return "Green Extension LCO"; }
    if(state == 17) { return "Fixed Past-End Green"; }
    if(state == 18) { return "VA Past-End Green"; }
    if(state == 19) { return "Green Blinking"; }
    if(state == 20) { return "VA Minimum Green"; }
    if(state == 21) { return "Fixed Amber"; }
    if(state == 22) { return "VA Amber"; }
    if(state == 23) { return "Amber Flashing"; }
    return "Unknown (" + state + ")"
}

function SG_SPaT_type(state)
{
    if(state == 0) { return "gray-bar"; }
    if(state == 1) { return "dark-gray-bar"; }
    if(state == 2) { return "red-bar"; }
    if(state == 3) { return "red-bar"; }
    if(state == 4) { return "red-amber-bar"; }
    if(state == 5) { return "green-bar"; }
    if(state == 6) { return "green-bar"; }
    if(state == 7) { return "amber-bar"; }
    if(state == 8) { return "amber-bar"; }
    if(state == 9) { return "black-amber-bar"; }
    if(state == 10) { return "red-amber-bar"; }
    if(state == 11) { return "red-amber-bar"; }    
}

function updateState(e)
{
    if(e.type == "error" && programPhase == 0)
    {
        document.getElementById("notification").innerHTML = "Unable to load setup!<br />Visualizer can't start.";
        document.getElementById("notification").style.visibility = "visible";
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
            setInterval(drawFrame, 33, config);        
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

// Cursor movement tracking
addEventListener("mousemove", (e) =>
{
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    const vertical_cursor = document.getElementById("vertical-cursor");
    vertical_cursor.style.left = cursor.x;

    startTime = Date.now() - (document.getElementById("visarea").clientWidth * timeScale);
    endTime = Date.now();
    maxTimeInWindow = document.getElementById("visarea").clientWidth / timeScale;

    

    document.getElementById("window-width").innerHTML = document.getElementById("visarea").clientWidth + " px";
    document.getElementById("cursor-location").innerHTML = "X: " + cursor.x + " Y: " + cursor.y;
});

// Mouse clicking tracking
addEventListener("click", (e) =>
{
    console.log("Cursor: " + cursor.x + " x " + cursor.y);
});

window.onload = function() {
    // Set up XHR
    req.addEventListener("load", updateState);
    req.addEventListener("error", updateState);

    // Bind timescale inc/dec buttons to their functions
    document.getElementById("inc-timescale").onclick = increaseTimeScale;
    document.getElementById("dec-timescale").onclick = decreaseTimeScale;

    // Start the ball rolling
    //getSetup();

    state = generateBar();
    updateElements();
    setInterval(updateElements, 33);

};