//params
var server = "";
var maxKeyFrameStep = 2; //Seconds

//DEPRICATED
var minFrameStep = 0.5 //Seconds

//global
var recording = false;
var timeout = null;
var mouse = {x: 0, y: 0};
var viewport = {width:0, height:0};
var winScroll = {top:0, left:0};
var session = 0;
var lastScreenTimestampMs = 0;
var lastFrameTimestampMs = 0;
var currentFrame = 0;
var timestamp = 0;
var now = 0;
var scrollBarWidth = 0;
var frames = [];

var mb = 1024 * 1024;

function startRecording(params){
	//SET A NEW SESSION OR RESTORE AN OLD ONE
	if(getCookie('record_session') == ""){
		session = getRandomInt(100000,999999);
		setCookie('record_session', session, 1);
		localStorage.clear();
	}else{
		session = getCookie('record_session');
		var temp = localStorage.getItem('recording');
		
		if(temp !== null){
			temp = JSON.parse(temp);
			if(temp[0].session != session){
				localStorage.clear();
				console.log('localStorage error');
			}else{
				frames = temp;
				//localStorage.clear();
			}
		}
	}

	//Params
	server = params.server;
	maxKeyFrameStep = params.maxKeyFrameStep || 10; //Seconds
	minFrameStep = params.minFrameStep || 0.5; //Seconds

	viewport = getViewport();

	//Start recording
	recording = true;
}

function stopRecording(){
	recording = false;
	clearTimeout(timeout);
}

function recordFrame(key){
	now = Date.now();
	timestamp = Math.round(now / 1000); 
	clearTimeout(timeout);

	if(
		recording 
		//&& (now - lastFrameTimestampMs) / 1000 > minFrameStep
		){
		
		//Send a KeyFrame
		if( ((now - lastScreenTimestampMs) / 1000 > maxKeyFrameStep) || key !== undefined){
			html2canvas(document.body, {
			    onrendered: function(canvas) {
			        //Draw mouse over canvas
			  		// var context=canvas.getContext("2d");
			  		// var img = new Image() //creates a variable for a new image	 
					// img.src= "pointer.png" // specifies the location of the image
					// context.drawImage(img, mouse.x, mouse.y); // draws the image at the specified x and y location

			        var data = canvas.toDataURL("image/png"); 
			        sendFrame(data);
			    }
			});

			lastScreenTimestampMs = now;
		}else{
			sendFrame();
		}	
	}
}

function sendFrame(screen){
	var frame = {};

	if(screen !== undefined){
		frame.screen = screen;
		console.log('make key frame')
	}else{
		console.log('make frame');
	}

	frame.location 	= document.location.href;
	frame.session 	= session;
	frame.timestamp = timestamp;
	frame.now		= now;
	frame.mouseX	= mouse.x;
	frame.mouseY	= mouse.y;
	frame.scrollX	= winScroll.left;
	frame.scrollY 	= winScroll.top;
	frame.viewportW = viewport.width;
	frame.viewportH = viewport.height;

	frames.push(frame);
	localStorage.setItem('recording', JSON.stringify(frames));

	if( frames.length > 20 || sizeof(frames) > mb ){
		console.log('send frames');
		//Send data to server
		
		if (window.XDomainRequest){
	        var request = new XDomainRequest();	        
	    }
	    else if (window.XMLHttpRequest){
	        var request = new XMLHttpRequest();
	    }
	    else{
	        var request = new ActiveXObject("Microsoft.XMLHTTP");
	    }

		request.open("POST", server);
		request.send(JSON.stringify(frames));
		lastFrameTimestampMs = now;
		
		frames = [];
		localStorage.clear();
	}
}


//Utils
function getRandomInt(min, max){
	return Math.floor((Math.random() * ((max + 1) - min)) + min);
}

function getViewport(){
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

	// BUG HERE
	// var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
	// var hasHScroll = document.body.scrollWidth > document.body.clientHeight;

	//TODO remove scroll width

	return {width:w, height:h};
}

// http://code.stephenmorley.org/
function sizeof(object) {
    // initialise the list of objects and size
    var objects = [object];
    var size = 0;
    // loop over the objects
    for (var index = 0; index < objects.length; index++) {
        // determine the type of the object
        switch (typeof objects[index]) {
            // the object is a boolean
            case 'boolean':
                size += 4;
                break;
                // the object is a number
            case 'number':
                size += 8;
                break;
                // the object is a string
            case 'string':
                size += 2 * objects[index].length;
                break;
                // the object is a generic object
            case 'object':
                // if the object is not an array, add the sizes of the keys
                if (Object.prototype.toString.call(objects[index]) != '[object Array]') {
                    for (var key in objects[index]) size += 2 * key.length;
                }
                // loop over the keys
                for (var key in objects[index]) {
                    // determine whether the value has already been processed
                    var processed = false;
                    for (var search = 0; search < objects.length; search++) {
                        if (objects[search] === objects[index][key]) {
                            processed = true;
                            break;
                        }
                    }
                    // queue the value to be processed if appropriate
                    if (!processed) objects.push(objects[index][key]);
                }

        }
    }

    // return the calculated size
    return size;
}

function getScroll(){
	var doc = document.documentElement;
	var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
	return {top:top, left:left};
}

function getScrollbarWidth(){
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}

//Cookie functions
function setCookie(name, value, hours) {
    var d = new Date();
    d.setTime(d.getTime() + (hours*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}

//HANDLERS
function mouseMoveHandler(e){
	mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY;
    recordFrame(); 
    //console.log('mouse move');
}

function mouseClickHandler(e){
	mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY; 
    //Send delayed keyframe
    clearTimeout(timeout);
    timeout = setTimeout(function(){recordFrame(true);}, 100);
    console.log('mouse click');
}

function keyHandler(e){
    //Send delayed keyframe
    clearTimeout(timeout);
    timeout = setTimeout(function(){recordFrame(true);}, 100);
}

function resizeHandler(e){
	viewport = getViewport();
	//console.log(viewport)
	//Send delayed keyframe
	clearTimeout(timeout);
	timeout = setTimeout(function(){recordFrame(true);}, 100);
}

function scrollHandler(e){
	winScroll = getScroll();
	//console.log(winScroll)
	//Send delayed keyframe
	clearTimeout(timeout);
	timeout = setTimeout(function(){recordFrame(true);}, 100);
}

window.addEventListener('mousemove', mouseMoveHandler, false);
window.addEventListener('click', mouseClickHandler, false);
window.addEventListener('keyup', keyHandler, false);

//window stuff
window.addEventListener('resize', resizeHandler, false);
window.addEventListener('scroll', scrollHandler, false);

//TODO: mobile events