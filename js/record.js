var recordJS = {

	//options
	server: "",

    defaultOptions: {
        maxKeyFrameStep: 2, //Seconds
        minFrameStep: 0.5 //Seconds, DEPRICATED
    },

	//global
	recording: false,
	timeout: null,
	mouse: {x: 0, y: 0},
	viewport: {width: 0, height: 0},
	winScroll: {top: 0, left: 0},
	session: 0,
	lastScreenTimestampMs: 0,
	lastFrameTimestampMs: 0,
	currentFrame: 0,
	timestamp: 0,
	now: 0,
	scrollBarWidth: 0,
	frames: [],

	mb: 1024 * 1024,

	startRecording: function(options) {
		//SET A NEW SESSION OR RESTORE AN OLD ONE
		if(recordJS.getCookie('record_session') === "") {
			recordJS.session = recordJS.getRandomInt(100000,999999);
			recordJS.setCookie('record_session', recordJS.session, 1);
			localStorage.clear();
		} else {
			recordJS.session = recordJS.getCookie('record_session');
			var temp = localStorage.getItem('recording');
			
			if(temp !== null) {
				temp = JSON.parse(temp);
				if(temp[0].session != recordJS.session) {
					localStorage.clear();
					recordJS.log('localStorage error');
				} else {
					recordJS.frames = temp;
					//localStorage.clear();
				}
			}
		}

		//options
		recordJS.server = options.server;
		recordJS.maxKeyFrameStep = options.maxKeyFrameStep || recordJS.defaultOptions.maxKeyFrameStep; //Seconds
		recordJS.minFrameStep = options.minFrameStep || recordJS.defaultOptions.minFrameStep; //Seconds

		recordJS.viewport = recordJS.getViewport();

		//Start recording
		recordJS.recording = true;
        recordJS.log('recording started');
	},

	stopRecording: function() {
		recordJS.recording = false;
		clearTimeout(recordJS.timeout);
        recordJS.log('recording stopped');
    },

	recordFrame: function(key) {
		recordJS.now = Date.now();
		recordJS.timestamp = Math.round(recordJS.now / 1000); 
		clearTimeout(recordJS.timeout);

		if (
			recordJS.recording 
			//&& (recordJS.now - recordJS.lastFrameTimestampMs) / 1000 > recordJS.minFrameStep
        ){
			//Send a KeyFrame
			if(((recordJS.now - recordJS.lastScreenTimestampMs) / 1000 > recordJS.maxKeyFrameStep) || key !== undefined){
				html2canvas(document.body, {
				    onrendered: function(canvas) {
				        //Draw mouse over canvas
				  		// var context=canvas.getContext("2d");
				  		// var img = new Image() //creates a variable for a new image	 
						// img.src= "pointer.png" // specifies the location of the image
						// context.drawImage(img, mouse.x, mouse.y); // draws the image at the specified x and y location

				        var data = canvas.toDataURL("image/png"); 
				        recordJS.sendFrame(data);
				    }
				});

				recordJS.lastScreenTimestampMs = recordJS.now;
			} else {
				recordJS.sendFrame();
			}	
		}
	},

	sendFrame: function(screen) {
		var frame = {};

		if(screen !== undefined) {
			frame.screen = screen;
			console.log('make key frame');
		} else {
			console.log('make frame');
		}

		frame.location 	= document.location.href;
		frame.session 	= recordJS.session;
		frame.timestamp = recordJS.timestamp;
		frame.now		= recordJS.now;
		frame.mouseX	= recordJS.mouse.x;
		frame.mouseY	= recordJS.mouse.y;
		frame.scrollX	= recordJS.winScroll.left;
		frame.scrollY 	= recordJS.winScroll.top;
		frame.viewportW = recordJS.viewport.width;
		frame.viewportH = recordJS.viewport.height;

		recordJS.frames.push(frame);
		localStorage.setItem('recording', JSON.stringify(recordJS.frames));

		if(recordJS.frames.length > 20 || recordJS.sizeOf(recordJS.frames) > recordJS.mb ){
			recordJS.log('sending frames to server');
			//Send data to server
			
			var request = recordJS.getXHR();

			request.open("POST", recordJS.server);
			request.send(JSON.stringify(recordJS.frames));
			recordJS.lastFrameTimestampMs = recordJS.now;
			
			recordJS.frames = [];
			localStorage.clear();
            recordJS.log('frames sent');
		}
	},

	sendMetaInfo: function() {
		var meta = {}
		var request = recordJS.getXHR();
		var data = "";
		
		//GET IP Location
		request.onreadystatechange = function () {
		if (request.readyState === 4) {
			if (request.status == 200 && request.status < 300){
				data = JSON.parse(xhr.responseText);
			}
		}

		request.open('GET', 'http://ipinfo.io', false);
		request.send();

		meta.session 	= session;
		meta.domain 	= document.domain;
		meta.country 	= data.country;

		request.open("POST", server);
		request.send(JSON.stringify(meta));
	},

	//Utils
	getXHR: function() {
		var request = null;
		
		if (window.XDomainRequest){
			request = new XDomainRequest();	        
		}
		else if (window.XMLHttpRequest){
			request = new XMLHttpRequest();
		}
		else{
			request = new ActiveXObject("Microsoft.XMLHTTP");
		}

		return request;
	},

	getRandomInt: function(min, max) {
		return Math.floor((Math.random() * ((max + 1) - min)) + min);
	},

	getViewport: function() {
		var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		// BUG HERE
		// var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
		// var hasHScroll = document.body.scrollWidth > document.body.clientHeight;

		//TODO remove scroll width

		return {width:w, height:h};
	},

	// http://code.stephenmorley.org/
	sizeOf: function(object) {
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
	},

	getScroll: function () {
		var doc = document.documentElement;
		var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
		var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
		return {top:top, left:left};
	},

	getScrollBarWidth: function (){
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
	},

	//Cookie functions
	//TODO: Add escape for cookie content
	setCookie: function(name, value, hours) {
	    var d = new Date();
	    d.setTime(d.getTime() + (hours*60*60*1000));
	    var expires = "expires="+d.toGMTString();
	    document.cookie = name + "=" + value + "; " + expires + "; path=/";
	},

	getCookie: function(cname) {
	    var name = cname + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0; i<ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1);
	        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
	    }
	    return "";
	},

	//HANDLERS
	mouseMoveHandler: function (e){
		recordJS.mouse.x = e.clientX || e.pageX; 
	    recordJS.mouse.y = e.clientY || e.pageY;
	    recordJS.recordFrame();
	    //recordJS.log('mouse move');
	},

	mouseClickHandler: function (e){
		recordJS.mouse.x = e.clientX || e.pageX; 
	    recordJS.mouse.y = e.clientY || e.pageY; 
	    //Send delayed keyframe
	    clearTimeout(recordJS.timeout);
	    recordJS.timeout = setTimeout(function(){recordJS.recordFrame(true);}, 100);
	    recordJS.log('mouse click');
	},

	keyHandler: function (e){
	    //Send delayed keyframe
	    clearTimeout(recordJS.timeout);
	    recordJS.timeout = setTimeout(function(){recordJS.recordFrame(true);}, 100);
	},

	resizeHandler: function (e){
		recordJS.viewport = recordJS.getViewport();
		//console.log(viewport)
		//Send delayed keyframe
		clearTimeout(recordJS.timeout);
		recordJS.timeout = setTimeout(function(){recordJS.recordFrame(true);}, 100);
	},

	scrollHandler: function (e){
		recordJS.winScroll = recordJS.getScroll();
		//console.log(winScroll)
		//Send delayed keyframe
		clearTimeout(recordJS.timeout);
		recordJS.timeout = setTimeout(function(){recordJS.recordFrame(true);}, 100);
	},

    //logging
    log: function(message) {
        console.log(message);
    }
};

window.addEventListener('mousemove', recordJS.mouseMoveHandler, false);
window.addEventListener('click', recordJS.mouseClickHandler, false);
window.addEventListener('keyup', recordJS.keyHandler, false);

//window stuff
window.addEventListener('resize', recordJS.resizeHandler, false);
window.addEventListener('scroll', recordJS.scrollHandler, false);

//TODO: mobile events
