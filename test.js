let example = '{"signal_groups": [{"name": "A"},{"name": "B"},{"name": "C"},{"name": "D"},{"name": "_E"}],"detectors": [{"name": "A50"},{"name": "A0"},{"name": "B75"},{"name": "B30"},{"name": "B0"},{"name": "C30"},{"name": "C0"},{"name": "D110"},{"name": "D65"},{"name": "D0"},{"name": "PN_E"}],"inputs": [{"name": "IN1"}],"outputs": [{"name": "OUT1"}]}';
const config =  JSON.parse(example);

const cw = 1000;             // canvas width
const ch = 600;             // canvas height
const slSpacing = 30;       // swim lane spacing
const abHeight = 20;        // active bar height

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

function setSize() {
    cnvs.height = innerHeight;
    cnvs.width = innerWidth;
}

function drawFrame(ctx, config)
{
    //console.log("Draw frame")
    //console.log("Time now: " + Date.now())
    drawBase(ctx, config);
    drawActiveBar(ctx, 2, 75, 225, "#00CC00");
    drawActiveBar(ctx, 3, 100, 250, "#00CC00");
    drawActiveBar(ctx, 3, 250, 270, "#e3c800");
    drawActiveBar(ctx, 7, 400, 800, "#0057e3");
    drawActiveBar(ctx, 11, 200, 550, "#0057e3");
    drawActiveBar(ctx, 11, 180, 195, "#0057e3");

    // Draw a vertical line where the mouse cursor is
    if(cursor.x > 70 && cursor.x < cw && cursor.y < ch)
    {
        drawLine(ctx, cursor.x, 0, cursor.x, ch - 1, "#C0C0C0");
    }
}

addEventListener("mousemove", (e) =>
{
    cursor.x = e.clientX;
    cursor.y = e.clientY;
});

window.onload = function() {
    const cnvs = document.getElementById("vis");
    const ctx = cnvs.getContext("2d");
    setInterval(drawFrame, 50, ctx, config);
    //drawFrame(ctx, config);
};