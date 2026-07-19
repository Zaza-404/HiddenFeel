<?php
require_once __DIR__ . '/../config/database.php';

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET /entries
if ($method === 'GET') {
    $entries = getUserEntries($userId);
    echo json_encode(['success' => true, 'data' => $entries]);
    exit();
}

// POST /entries
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit();
    }
    
    $entry = [
        'date' => $input['date'],
        'moodEmoji' => $input['moodEmoji'],
        'moodName' => $input['moodName'],
        'moodVal' => $input['moodVal'],
        'intensity' => $input['intensity'] ?? 3,
        'triggers' => $input['triggers'] ?? [],
        'energy' => $input['energy'] ?? null,
        'note' => $input['note'] ?? '',
        'ts' => $input['ts'] ?? time()
    ];
    
    if (saveUserEntry($userId, $entry)) {
        echo json_encode(['success' => true, 'message' => 'Entry saved']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save']);
    }
    exit();
}

// DELETE /entries/{date}
if ($method === 'DELETE') {
    $path = $_SERVER['REQUEST_URI'];
    $date = basename($path);
    
    $allEntries = loadEntries();
    $newEntries = array_values(array_filter($allEntries, function($entry) use ($userId, $date) {
        return !(isset($entry['user_id']) && $entry['user_id'] === $userId && $entry['date'] === $date);
    }));
    
    if (saveEntries($newEntries)) {
        echo json_encode(['success' => true, 'message' => 'Entry deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete']);
    }
    exit();
}
?>