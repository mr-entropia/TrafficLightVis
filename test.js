let example = '{"signal_groups": [{"name": "A"},{"name": "B"},{"name": "C"},{"name": "D"},{"name": "_E"}],"detectors": [{"name": "A50"},{"name": "A0"},{"name": "B75"},{"name": "B30"},{"name": "B0"},{"name": "C30"},{"name": "C0"},{"name": "D110"},{"name": "D65"},{"name": "D0"},{"name": "PN_E"}],"inputs": [{"name": "IN1"}],"outputs": [{"name": "OUT1"}]}';
const config =  JSON.parse(example);

const cw = 1000;            // canvas width
const ch = 600;             // canvas height
const cwMin = 70;           // canvas width minimum (counting labels)
const cwMax = cw;           // canvas width max
const slSpacing = 30;       // swim lane spacing
const abHeight = 20;        // active bar height

const barColorGreen = "#00CC00";     // Permissive/Protected Movement Allowed
const cursorLineColor = "#C0C0C0";

var timeScale = 50;        // pixels per second
var startTime = 0;
var endTime = 0;
var maxTimeInWindow = 0;

const cursor =
{
    x: 0,
    y: 0
};

function clearCanvas(ctx)
{
    ctx.save();
    //ctx.globalCompositeOperation = "destination-over";
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
    //console.log("Draw base")
    clearCanvas(ctx);

    // Draw swim lanes for signal groups
    for(let i = 0; i < config.signal_groups.length; i++)
    {
        drawLine(ctx, 70, (slSpacing * (i + 1)), cw, (slSpacing * (i + 1)), "#BB0000");
        drawText(ctx, 60, (slSpacing * (i + 1)), config.signal_groups[i].name, "20px sans-serif");
    }

    start_y = (config.signal_groups.length + 1) * slSpacing;

    // Draw swim lanes for detectors
    for(let i = 0; i < config.detectors.length; i++)
    {
        drawLine(ctx, 70, start_y + (slSpacing * (i + 1)), cw, start_y + (slSpacing * (i + 1)), "#BBBBBB");
        drawText(ctx, 60, start_y + (slSpacing * (i + 1)), config.detectors[i].name, "16px sans-serif");
    }
}

function generateBar()
{
    start = Date.now() + (1 * 1000);;
    end = Date.now() + (5 * 1000);
    swimlane = 1;
    type = 1;
    return JSON.parse('{"bars": [{"start": ' + start + ', "end": ' + end + ', "swimlane": ' + swimlane + ', "type": ' + type + '}]}');
}

function setSize() {
    cnvs.height = innerHeight;
    cnvs.width = innerWidth;
}

function drawFrame(ctx, config, state)
{
    // Update internal values
    startTime = Date.now();
    endTime = Date.now() - ((cwMax - cwMin) * timeScale * 1000);
    maxTimeInWindow = ((cwMax - cwMin) / timeScale);

    //console.log("Draw frame")
    //console.log("Time now: " + Date.now())
    drawBase(ctx, config);
    state["bars"].forEach(function(bar) {
        if(bar["type"] == 1)
        {
            col = barColorGreen;
        }
        if(bar["start"] < startTime)
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
            if(startX < cwMin)
            {
                startX = cwMin;
            }
            if(endX < cwMin)
            {
                endX = cwMin;
            }
            drawActiveBar(ctx, bar["swimlane"], startX, endX, col);
        }
    });

    // Draw a vertical line where the mouse cursor is
    if(cursor.x > cwMin && cursor.x < cwMax && cursor.y < ch)
    {
        document.getElementById("cursorlocation").innerHTML = cursor.x;
        drawLine(ctx, cursor.x, 0, cursor.x, ch - 1, cursorLineColor);
    }

    // Update debug table
    document.getElementById("starttime").innerHTML = startTime;
    document.getElementById("endtime").innerHTML = endTime;
    document.getElementById("timescale").innerHTML = timeScale + " px/s";
    document.getElementById("maxtimeinwindow").innerHTML = maxTimeInWindow + " s";
}

addEventListener("mousemove", (e) =>
{
    cursor.x = e.clientX;
    cursor.y = e.clientY;
});

window.onload = function() {
    const cnvs = document.getElementById("vis");
    const ctx = cnvs.getContext("2d");
    setInterval(drawFrame, 33, ctx, config, generateBar());
    //drawFrame(ctx, config);
};