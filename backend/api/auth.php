<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/functions.php';

$action = $_GET['action'] ?? '';

// REGISTER
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Debug: log received data
    error_log("Register data: " . print_r($data, true));
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $name = $data['name'] ?? '';
    
    // Validasi
    if (!$email || !$password || !$name) {
        jsonResponse(['error' => 'Semua field harus diisi'], 400);
        exit();
    }
    
    if (!validateEmail($email)) {
        jsonResponse(['error' => 'Email tidak valid'], 400);
        exit();
    }
    
    if (!validatePassword($password)) {
        jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
        exit();
    }
    
    if (getUserByEmail($email)) {
        jsonResponse(['error' => 'Email sudah terdaftar'], 409);
        exit();
    }
    
    // Simpan user
    $users = readJSON(USERS_FILE);
    $newUser = [
        'id' => getNextId($users),
        'email' => $email,
        'password' => hashPassword($password),
        'name' => $name,
        'created_at' => date('Y-m-d H:i:s')
    ];
    $users[] = $newUser;
    writeJSON(USERS_FILE, $users);
    
    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $newUser['id'],
            'email' => $newUser['email'],
            'name' => $newUser['name']
        ],
        'token' => generateToken($newUser['id'])
    ]);
    exit();
}

// LOGIN
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Debug: log received data
    error_log("Login data: " . print_r($data, true));
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (!$email || !$password) {
        jsonResponse(['error' => 'Email dan password harus diisi'], 400);
        exit();
    }
    
    $user = getUserByEmail($email);
    if (!$user || !verifyPassword($password, $user['password'])) {
        jsonResponse(['error' => 'Email atau password salah'], 401);
        exit();
    }
    
    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name']
        ],
        'token' => generateToken($user['id'])
    ]);
    exit();
}

// Jika action tidak dikenal
jsonResponse(['error' => 'Action not found'], 404);
?>