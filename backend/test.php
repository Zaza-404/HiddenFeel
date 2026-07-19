<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'OK',
    'message' => 'Backend berjalan dengan baik',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);
?>