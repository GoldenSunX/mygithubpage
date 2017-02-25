/* Some of the layout code adapted from http://raphaeljs.com/hand.html. */
kGraphicsConstants = {
    width: 300,
    height: 300,
    radius: 20,
    radialDistance: 100,
    fontFamily: "monospace",
    fontSize: 24,
    connectorWidth: 2,
    circleStroke: "#a0a0c0",
    circleFill: "#c0c0e0",
    circleStrokeWidth: 2
};

/* List of the circles displayed in the graph. */
circles = [];

/* Handle to the Raphael drawing instance. */
raphael = null;

/* 2D grid tracking which arcs are currently active. */
relation = [];

/* Container of all the arrows between circles. */
arrows = [];

/* Container of all the checkboxes. */
checkboxes = []

/* Utility function to increment a character. */
function charAfter(s) {
    return String.fromCharCode(s.charCodeAt(0) + 1);
}

/* Given a circle index, returns the angle at which the circle lies from the center. */
function circleAngle(n) {
    return n * 2 * Math.PI / kConfig.domainSize;
}

/* Given a circle index, returns the x and y coordinates of that circle's center as an object
 * whose properties are x and y.
 */
function xyCoord(n) {
    var angle = circleAngle(n);
    return { x: kGraphicsConstants.width  / 2 - kGraphicsConstants.radialDistance * Math.cos(angle),
             y: kGraphicsConstants.height / 2 - kGraphicsConstants.radialDistance * Math.sin(angle)
           };
}

/* Creates all of the circles in the display. */
function initCircles() {
    var label = "a";

    /* Create all the circles. */
    for (var n = 0; n < kConfig.domainSize; n++) {
        (function (n) {
            /* Compute the center coordinates. */
            var xy = xyCoord(n);
            var x = xy.x;
            var y = xy.y;

            /* Create the circle object to display. */
            var circle = raphael.circle(x, y, kGraphicsConstants.radius);
            circle.attr({
                stroke: kGraphicsConstants.circleStroke, 
                fill: kGraphicsConstants.circleFill,
                "stroke-width": kGraphicsConstants.circleStrokeWidth
            });
            circles.push(circle);

            /* Create the label. */
            var labelObj = raphael.text(x, y, label).attr({
                "font-size": kGraphicsConstants.fontSize,
                "font-family": kGraphicsConstants.fontFamily
            });

        })(n);
        
        label = charAfter(label);
    }
}

/* Creates a self-loop at the indicated circle. */
function makeSelfLoop(i) {
    /* Figure out where the circle is. */
    var xy = xyCoord(i);

    /* Get the angle to the circle. */
    var theta = circleAngle(i);

    /* Choose x by going to the circle and stepping outward one radius. */
    var x = xy.x - Math.cos(theta) * kGraphicsConstants.radius;
    var y = xy.y - Math.sin(theta) * kGraphicsConstants.radius;

    /* Create a circle to represent a self-loop. */
    var selfLoop = raphael.circle(x, y, kGraphicsConstants.radius).attr({"stroke-width": kGraphicsConstants.connectorWidth});
    selfLoop.toBack();
    selfLoop.hide();
    
    return selfLoop;
}

/* Creates an arrow running from node i to node j. */
function makeArrow(i, j) {
    /* Determine the positions of the centers of these circles. */
    var xyI = xyCoord(i), xyJ = xyCoord(j);

    /* Get the distance and angle between them. */
    var dx = xyJ.x - xyI.x;
    var dy = xyJ.y - xyI.y;

    var dist  = Math.sqrt(dx * dx - dy * dy);
    var theta = Math.atan2(dy, dx);

    /* Get the start coordinates by beginning at the start point and stepping forward by
     * one circle radius in the proper direction.
     */
    var x0 = xyI.x + kGraphicsConstants.radius * Math.cos(theta);
    var y0 = xyI.y + kGraphicsConstants.radius * Math.sin(theta);

    /* Get the end coordinates by beginning at the end point and backing up by one circle
     * radius in the proper direction.
     */
    var x1 = xyJ.x - kGraphicsConstants.radius * Math.cos(theta);
    var y1 = xyJ.y - kGraphicsConstants.radius * Math.sin(theta);

    var line = raphael.path("M" + x0 + "," + y0 + "L" + x1 + "," + y1);
    line.attr({"stroke-width": kGraphicsConstants.connectorWidth, "arrow-end": "block-wide-long"});
    line.toBack();
    line.hide();
    return line;
}

/* Sets up the arrows that run between the circles. */
function initArrows() {
    for (var i = 0; i < kConfig.domainSize; i++) {
        var connectors = [];
        for (var j = 0; j < kConfig.domainSize; j++) {
            if (i == j) connectors.push(makeSelfLoop(i));
            else        connectors.push(makeArrow(i, j));
        }
        arrows.push(connectors);
    }
}

/* Sets up the initial Raphael instance and draws circles. */
function initRaphael() {
    raphael = Raphael("holder", kGraphicsConstants.width, kGraphicsConstants.height);

    initCircles();
    initArrows();
}

/* Creates the table header. */
function createHeader(table, numCells) {
    var header = document.createElement("tr");
    
    /* Add a blank cell first. */
    header.appendChild(document.createElement("td"));

    /* Add one column for each circle. */
    var label = "a";
    for (var i = 0; i < numCells; i++) {
        var cell = document.createElement("td");
        cell.textContent = label;
        header.appendChild(cell);

        label = charAfter(label);
    }

    table.appendChild(header);
}

/* Creates a single row in the table. */
function createSingleRow(table, numCells, i, label) {
    var row = document.createElement("tr");

    /* Add the row header */
    var header = document.createElement("td");
    header.textContent = label;
    row.appendChild(header);

    /* Create the checkboxes. */
    var boxes = [];
    for (var j = 0; j < numCells; j++) {
        (function(from, to) {
            var boxHolder = document.createElement("td");
            var box = document.createElement("input");
            box.type = "checkbox";
            box.className = "checkbox";
            box.onclick = function() {
                select(from, to, box.checked);
            }
            boxHolder.appendChild(box);
            row.appendChild(boxHolder);

            boxes.push(box);
        }) (i, j);
    }
    checkboxes.push(boxes);
    table.appendChild(row);
}

/* Creates the rows of controls in the table. */
function createRows(table, numCells) {
    var label = "a";
    for (var i = 0; i < numCells; i++) {
        createSingleRow(table, numCells, i, label);
        label = charAfter(label);
    }
}

/* Sets up the grid of checkboxes. */
function initGrid() {
    var container = document.getElementById("grid");

    var table = document.createElement("table");
    createHeader(table, circles.length);
    createRows(table, circles.length);

    container.appendChild(table);
}

/* Sets up the relation matrix. */
function initMatrix() {
    for (var i = 0; i < circles.length; i++) {
        var arr = [];
        for (var j = 0; j < circles.length; j++ ) {
            arr.push(false);
        }
        relation.push(arr);
    }
}

/* Sets up the buttons. */
function initButtons() {
    document.getElementById("reset").onclick = function() {
        reset();
    }
}

/* Main initialization routine; sets up all the controls and the display. */
function init() {
    initRaphael();
    initGrid();
    initMatrix();
    initButtons();
    recalculateProperties();
}

/* Updates the display with the properties of the given relation. */
function recalculateProperties() {
    document.getElementById("properties").innerHTML = propertiesOf(relation, kConfig.domainSize, kConfig.relationTypes);
}

/* Invoked by a checkbox when it's clicked. Updates the internal representation
 * and the display.
 */
function select(from, to, isSet) {
    relation[from][to] = isSet;
    if (isSet) arrows[from][to].show();
    else       arrows[from][to].hide();
    recalculateProperties();
}

/* Invoked by the reset button. Clears all the checkboxes and the display. */
function reset() {
    for (var i = 0; i < kConfig.domainSize; i++) {
        for (var j = 0; j < kConfig.domainSize; j++) {
            relation[i][j] = false;
            arrows[i][j].hide();
            checkboxes[i][j].checked = false;
            recalculateProperties();
        }
    }
}
