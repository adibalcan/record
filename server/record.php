<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
$dataDir = 'record';

if(isset($_POST['session'])){
	if(isset($_POST['screen'])){
		$imageData = $_POST['screen'];
		$name = $_POST['session'] . '_' . $_POST['timestamp'];

		$filteredData = substr($imageData, strpos($imageData, ",") + 1);
		$unencodedData = base64_decode($filteredData);    

		$imageFile = $dataDir . DIRECTORY_SEPARATOR . $name . '.png';

		file_put_contents($imageFile, $unencodedData);
	}

	$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'session_' . $_POST['session'] . '.json';

	//Open
	if(file_exists($dataFile)){
		$data = json_decode(file_get_contents($dataFile), true);
	}else{
		$data = array();
	}

	if(isset($_POST['screen'])){
		$_POST['screen'] = $imageFile;
	}

	$data[] = $_POST;

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





