<html>
	<head>
		<title>player</title>
		<style>
			#view{
				border:1px solid black;
			}
		</style>
	</head>

	<body>
		<script type="text/javascript">
			var data = <?php echo $play; ?>;
			var interval = null;
			var currentStep = 0;		
			var timeout = null;
			var maxSleep = 5000; //ms
			timeout = setTimeout(playStep, 1000);
			
			function playStep(){
					var view 	= document.getElementById('view');
					var loc 	= document.getElementById('location');
					var pointer = document.getElementById('pointer');

					if(data[currentStep] === undefined){
						return;
					}

					var step = data[currentStep];
					loc.innerHTML = step.location;

					view.style.width 	= step.viewportW + 'px';
					view.style.height 	= step.viewportH + 'px';
					pointer.style.left 	= step.mouseX + 'px';
					pointer.style.top 	= step.mouseY + 'px';

					view.style.backgroundPositionX = (step.scrollX * -1) + 'px';
					view.style.backgroundPositionY = (step.scrollY * -1) + 'px';

					if(step.screen !== undefined){
						view.style.background = 'url(' + step.screen + ')';
					}

					currentStep++;

					if(data[currentStep] !== undefined){
						nextStep = data[currentStep];
						var interval = nextStep.now - step.now;
						if(interval > maxSleep){
							interval = maxSleep;
						}
						timeout = setTimeout(playStep, interval);
					}
			}


		</script>


		<div id="location"></div>
		<div id="view" style="position:relative;">
			<img id="pointer" style="position:absolute;" src="pointer.png" />
		</div>

	</body>
</html>