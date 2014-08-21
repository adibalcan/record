<table>
	<?php
	foreach($files as $file){
		$dataJson = json_decode(file_get_contents($dataDir . DIRECTORY_SEPARATOR . $file));
		?>

		<tr>
			<td><img src="img/countries/<?php echo $dataJson->meta->country; ?>.png"/></td>
			<td><?php echo $dataJson->meta->domain; ?></td>
			<td><?php echo date('d-m-Y', $dataJson->meta->timestamp); ?></td>
			<td><a href="?play=<?php echo $file; ?>">Play</a></td>
		</tr>

	<?php } ?>
</table>