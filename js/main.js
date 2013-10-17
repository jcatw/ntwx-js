var nodes = [];
var edges = [];

//physical constants
var k = 10.0;
var G = 40.0;
var l = 40.0;
var delta_t = 0.02;
var physical = true;

//drawing parameters
var nodeRadius = 10.0;
var edgeWidth = 5.0;
var forceWidth = 2.0;
var forceScale = 0.1;

var textPoint = new PointText(view.center);//view.bounds.topLeft - view.bounds.bottomRight.multiply(0.05));
textPoint.fillColor = 'black';
//textpoint.paragraphStyle.justification = 'center';
//textPoint.characterStyle.fontSize = 20;

//order is important here; last in, first up
var edgeLayer = new Layer();
var forceLayer = new Layer();
var nodeLayer = new Layer();
//var termLayer = new Layer();

//make the terminal
//termLayer.bounds.top = termLayer.bounds.bottom + 50.0;
//project.activeLayer = termLayer;
//termRect = new Path.Rectangle(termLayer.bounds);
//termRect.fillColor='black';


function nodeExists(node) {
    var i=0;
    for (i=0; i<nodes.length; i++) {
	if (nodes[i].contains(node)) {
	    return true;
	}
    }
    return false;
}

function nodeIndex(node) {
    var i=0;
    for (i=0; i<nodes.length; i++) {
	if (nodes[i].contains(node)) {
	    return i;
	}
    }
    return -1;
}


function onMouseDown(event) {
    if (nodeExists(event.point)) {
	console.log("down, exists");
    }
    else {
	project.activeLayer = nodeLayer;
	var node = new Path.Circle(event.point,nodeRadius);
	node.fillColor = 'black';

	node.edges = [];
	node.velocity = new Point(0.0, 0.0);

	project.activeLayer = forceLayer;
	node.vforce = new Path();
	node.vforce.add(node.position);
	node.vforce.add(node.position);
	node.vforce.strokeWidth = forceWidth;
	node.vforce.strokeColor = 'red';
	project.activeLayer = nodeLayer;
	
	nodes.push(node);
    }
}

function onMouseUp(event) {
    var from = event.downPoint;
    var fromIndex = nodeIndex(from);
    
    var to = event.point;
    var toIndex = nodeIndex(to);
    
    if (fromIndex > -1 && toIndex > -1 && fromIndex != toIndex) {
	// select the edge layer
	project.activeLayer = edgeLayer;

	// create and populate edge
	var edge = new Path();
	edge.add(nodes[fromIndex].position);
	edge.add(nodes[toIndex].position);

	// set properties
	edge.strokeColor = 'blue';
	edge.strokeWidth = edgeWidth;
	
	edge.tail = fromIndex;
	edge.head = toIndex;
	edges.push(edge);
	project.activeLayer = nodeLayer;

	nodes[fromIndex].edges.push(toIndex);
	nodes[toIndex].edges.push(fromIndex);
    }
}

function onKeyDown(event) {
    //speed up
    if (event.key == '=') {
	delta_t += 0.01;
	textPoint.content = 'Delta t: ' + delta_t;
    }
    //slow down
    if (event.key == '-') {
	delta_t -= 0.01;
	if (delta_t < 0.0) {
	    delta_t = 0.0;
	}
	textPoint.content = 'Delta t: ' + delta_t;
    }
    //show force vectors?
    if (event.key == 'f') {
	forceLayer.visible = !forceLayer.visible;
	textPoint.content = 'Forces Visible: ' + forceLayer.visible;
    }
    //physical motion or linear in force?
    if (event.key == 'p') {
	physical = !physical;
	textPoint.content = 'Physical Forces: ' + physical;
    }
}


function onFrame(event) {
    var i=0;
    var j=0;
    //this will cease animation after some specified of frame counts
    //if (event.count > 1000) {
    //	function onFrame(event) {}
    //	return
    //}
    
    console.log("Number of nodes");
    console.log(nodes.length);

    //on each frame, populate the stack of forces
    var forces = [];
    for (i=0; i<nodes.length; i++) {
	
	console.log("Node #");
	console.log(i);
	console.log("Node Edges");
	console.log(nodes[i].edges);
	console.log("Node Velocity");
	console.log(nodes[i].velocity);

	// init force
	var F = new Point(0.0, 0.0);
	var x = new Point(0.0, 0.0);
	if (nodes[i].edges.length != 0) {
	    // TODO: the efficiency of these force calculations could
	    // be improved by performing a search over the graph
	    // rather than iterating over each node's edges.
	    
	    // each edge represents a spring with constant k and
	    // natural length l.
	    for (j=0; j<nodes[i].edges.length; j++) {
		x = nodes[i].position - nodes[nodes[i].edges[j]].position;
		console.log("x");
		console.log(x);
		//can't seem to do scaler * vector,
		//so we have this vector.multiply(scaler) business.
		F = F - x.multiply(k * (x.length - l) / x.length); 
	    }
	    // all pairs of nodes experience an inverse-square repellant
	    // force (like, say, positively charged particles)
	    for (j=0; j<nodes[i].edges.length; j++) {
		if (nodes[i].edges.length != 0) {
		    x = nodes[i].position - nodes[nodes[i].edges[j]].position;
		    F = F + x.multiply(G / Math.pow(x.length, 3.0));
		}
	    }
	}
	console.log("Force After");
	console.log(F);

	// push F onto forces stack
	// we traverse the nodes in order,
	// so F will be indexed by node
	forces.push(F);
    }

    for (i=0; i<nodes.length; i++) {
	console.log("Velocity:");
	console.log(nodes[i].velocity);
	console.log("Position:");
	console.log(nodes[i].position);

	console.log("delta_t");
	console.log(delta_t);
	
	// update velocity and position according to force vector
	if (physical) {
	    nodes[i].velocity = nodes[i].velocity + (forces[i].multiply(delta_t));
	    nodes[i].position = nodes[i].position + (nodes[i].velocity.multiply(delta_t));
	}
	else {
	    nodes[i].position = nodes[i].position + (forces[i].multiply(delta_t));
	}

	// draw the force vector
	nodes[i].vforce.segments[0].point = nodes[i].position;
	nodes[i].vforce.segments[1].point = nodes[i].position + forces[i].multiply(forceScale);

	
    }
    for (j=0; j<edges.length; j++) {
	console.log("segment 0 point");
	console.log(edges[j].segments[0].point);

	edges[j].segments[0].point = nodes[edges[j].tail].position;
	edges[j].segments[1].point = nodes[edges[j].head].position;
    }
}

