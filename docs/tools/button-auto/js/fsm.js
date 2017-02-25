kNumImages = 7; // Total number of images.
state = 0;

function changeState(s) {
	document.getElementById("fsm").src = "images/q" + s + ".png";
	state = s;
	
	if (state == 6) {
		document.getElementById("button").textContent = "Click to Reset";
	}
}

function error(msg) {
	window.alert(msg);
}

/* Set up the page so that the client area has the right size,
 * then preload images.
 */
function init() {
	/* Set up the client area. */
	var back = document.getElementById("workspace");
	
	/* TODO: This is a total hack. Try to figure out a way to account for where the
	 * scrollbar will be and do so more intelligently.
	 */
	back.style.width =  (document.body.clientWidth  - 20) + "px";
	back.style.height = document.body.clientHeight + "px";

	var images = [];
	for (var i = 0; i < kNumImages; i++) {
		images.push(new Image("images/q" + i + ".png"));
	}
	
	var button = document.getElementById("button");
	var workspace = document.body;
		
	workspace.onmousedown = function(e) {
		if (state == 0) {
			changeState(4);
		}
		e.stopPropagation();
		return false;
	}
	
	workspace.onmouseup = function(e) {
		if (state == 4) {
			changeState(0);
		} else if (state == 3) {
			changeState(0);
		}
		e.stopPropagation();
	}
	
	button.onmousedown = function(e) {
		if (state == 1) {
			changeState(2);
		}
		e.stopPropagation();
		return false;
	}
	
	button.onmouseup = function(e) {
		if (state == 2) {
			changeState(6);
		} else if (state == 5) {
			changeState(1);
		} else if (state == 6) {
			document.getElementById("button").textContent = "Click Me!";
			changeState(1);
		}
		e.stopPropagation();
	}
	
	button.onmouseover = function(e) {
		if (state == 0) {
			changeState(1);
		} else if (state == 4) {
			changeState(5);
		} else if (state == 3) {
			changeState(2);
		}
		e.stopPropagation();
	}
	
	button.onmouseout = function(e) {
		if (state == 1) {
			changeState(0);
		} else if (state == 2) {
			changeState(3);
		} else if (state == 5) {
			changeState(4);
		}
		e.stopPropagation();
	}
}
