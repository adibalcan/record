//params
var server = "";
var maxKeyFrameStep = 10; //Seconds
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

function startRecording(params){
	//SET A NEW SESSION OR RESTORE AN OLD ONE
	if(getCookie('record_session') == ""){
		session = getRandomInt(100000,999999);
		setCookie('record_session', session, 1);
	}else{
		session = getCookie('record_session');
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

	if(recording && (now - lastFrameTimestampMs) / 1000 > minFrameStep){
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
	var formData = new FormData();

	if(screen !== undefined){
		formData.append('screen', screen);
		console.log('send key frame')
	}else{
		console.log('send frame');
	}

	formData.append('location', document.location);
	formData.append('session', session);
	formData.append('timestamp', timestamp);
	formData.append('now', now);
	formData.append('mouseX', mouse.x);
	formData.append('mouseY', mouse.y);
	formData.append('scrollX', winScroll.left);
	formData.append('scrollY', winScroll.top);
	formData.append('viewportW', viewport.width);
	formData.append('viewportH', viewport.height);

	//Send data to server
	var request = new XMLHttpRequest();
	request.open("POST", server);
	request.send(formData);
	lastFrameTimestampMs = now;
}


//Utils
function getRandomInt(min, max){
	return Math.floor((Math.random() * ((max + 1) - min)) + min);
}

function getViewport(){
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

	var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
	var hasHScroll = document.body.scrollWidth > document.body.clientHeight;

	//TODO remove scroll width

	return {width:w, height:h};
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
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/; secure";
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



//TODO
//mobile events