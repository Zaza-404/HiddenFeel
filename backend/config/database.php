<?php
// Menggunakan JSON sebagai database
define('DATA_PATH', __DIR__ . '/../data/');
define('USERS_FILE', DATA_PATH . 'users.json');
define('ENTRIES_FILE', DATA_PATH . 'entries.json');

// Buat folder data jika belum ada
if (!file_exists(DATA_PATH)) {
    mkdir(DATA_PATH, 0777, true);
}

// Inisialisasi file JSON jika belum ada
function initDatabase() {
    if (!file_exists(USERS_FILE)) {
        file_put_contents(USERS_FILE, json_encode([]));
        chmod(USERS_FILE, 0777);
    }
    
    if (!file_exists(ENTRIES_FILE)) {
        file_put_contents(ENTRIES_FILE, json_encode([]));
        chmod(ENTRIES_FILE, 0777);
    }
}

initDatabase();

function readJSON($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function writeJSON($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

function getNextId($data) {
    if (empty($data)) return 1;
    $ids = array_column($data, 'id');
    return max($ids) + 1;
}
?>