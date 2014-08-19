<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
$dataDir = 'record';


if($_SERVER['REQUEST_METHOD'] == 'POST'){
	$request_body = file_get_contents('php://input');
	$jsonData = json_decode($request_body);
	$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'session_' . $jsonData[0]->session . '.json';
	
	//Open
	if(file_exists($dataFile)){
		$data = json_decode(file_get_contents($dataFile));
		if(!is_array($data)){
			$data = array($data);
		}
	}else{
		$data = array();
	}

	//Parse frames
	foreach ($jsonData as $key => $frame) {
		//If is keyFrame
		if(isset($frame->screen)){
			$imageData = $frame->screen;
			$name = $frame->session . '_' . $frame->now;

			$filteredData = substr($imageData, strpos($imageData, ",") + 1);
			$unencodedData = base64_decode($filteredData);    

			$imageFile = $dataDir . DIRECTORY_SEPARATOR . $name . '.png';
			$frame->screen = $imageFile;

			file_put_contents($imageFile, $unencodedData);
		}

		$data[] = $frame;
	}

	//Save
	file_put_contents($dataFile, json_encode($data));
	
}else{

	if(isset($_GET['play'])){
		$play = file_get_contents($dataDir . DIRECTORY_SEPARATOR . $_GET['play']);
		include('player.php');
	}else{
		$sessions = array();
		$dh  = opendir($dataDir);

		while (false !== ($filename = readdir($dh))) {
			if(strpos($filename, 'session') !== False){
				$sessions[] = $filename;
				echo '<a href="?play='.$filename.'">'.$filename.'</a><br/>';
			}
		}
	}

}