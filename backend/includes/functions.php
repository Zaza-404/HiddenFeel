<?php
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit();
}

function callClaudeAPI($prompt, $maxTokens = 200) {
    $apiKey = getenv('ANTHROPIC_API_KEY');
    
    // Jika tidak ada API key, return fallback response
    if (!$apiKey) {
        return getFallbackResponse($prompt);
    }
    
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'claude-3-sonnet-20240229',
        'max_tokens' => $maxTokens,
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ]
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        return $data['content'][0]['text'] ?? getFallbackResponse($prompt);
    }
    
    return getFallbackResponse($prompt);
}

function getFallbackResponse($prompt) {
    if (strpos($prompt, 'kutipan') !== false) {
        return "KUTIPAN: Kebahagiaan bukanlah sesuatu yang sudah jadi. Itu datang dari tindakanmu sendiri.\nPENULIS: Dalai Lama";
    }
    if (strpos($prompt, 'saran praktis') !== false) {
        return "Luangkan waktu 5 menit untuk bernapas dalam-dalam dan tuliskan 3 hal yang kamu syukuri hari ini.";
    }
    if (strpos($prompt, 'psikolog virtual') !== false) {
        return "Dari data yang ada, terlihat ada fluktuasi emosi yang wajar. Cobalah untuk menyisihkan waktu istirahat singkat di sela-sela aktivitas. Minggu depan, coba praktikkan teknik pernapasan sederhana untuk mengurangi stres.";
    }
    return "Terima kasih sudah mencatat emosi hari ini. Kamu hebat! 💚";
}
?>