let example = '{"signal_groups": [{"name": "A"},{"name": "B"},{"name": "C"},{"name": "D"},{"name": "_E"}],"detectors": [{"name": "A50"},{"name": "A0"},{"name": "B75"},{"name": "B30"},{"name": "B0"},{"name": "C30"},{"name": "C0"},{"name": "D110"},{"name": "D65"},{"name": "D0"},{"name": "PN_E"}],"inputs": [{"name": "IN1"}],"outputs": [{"name": "OUT1"}]}';
const config =  JSON.parse(example);

const cw = 800;             // canvas width
const ch = 400;             // canvas height
const slSpacing = 30;       // swim lane spacing
const abHeight = 20;        // active bar height

function clearCanvas(ctx)
{
    ctx.save();
    //ctx.globalCompositeOperation = "destination-over";
    ctx.clearRect(0, 0, cw, ch);
    ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2, col)
{
    ctx.strokeStyle = col;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawActiveBar(ctx, swimLane, x1, x2, col)
{
    y = (swimLane * slSpacing);
    ctx.fillStyle = col;
    ctx.fillRect(x1, y - (abHeight / 2), x2 - x1, abHeight);
}

function drawBase(ctx, config)
{
    console.log("Draw base")
    clearCanvas(ctx);
    for(let i = 0; i < config.signal_groups.length; i++)
    {
        drawLine(ctx, 0, (slSpacing * (i + 1)), cw, (slSpacing * (i + 1)), "#BB0000");
    }
}



function drawFrame(ctx, config)
{
    console.log("Draw frame")
    console.log("Time now: " + Date.now())
    drawBase(ctx, config);
    drawActiveBar(ctx, 1, 50, 200, "#00CC00");
    drawActiveBar(ctx, 2, 75, 225, "#00CC00");
    drawActiveBar(ctx, 3, 100, 250, "#00CC00");
    drawActiveBar(ctx, 3, 250, 270, "#e3c800");
}



window.onload = function() {
    const ctx = document.getElementById("vis").getContext("2d");
    setInterval(drawFrame, 500, ctx, config);
};