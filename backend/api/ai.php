<?php
require_once __DIR__ . '/../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    sendResponse(false, null, 'Method not allowed');
}

$action = $input['action'] ?? '';

switch ($action) {
    case 'daily':
        $entry = $input['entry'];
        $recentEntries = $input['recentEntries'] ?? [];
        
        $prompt = "Kamu adalah teman emosional yang hangat dan penuh empati. Seorang pengguna baru saja mencatat mood mereka.

Mood hari ini: {$entry['moodEmoji']} {$entry['moodName']} (intensitas: {$entry['intensity']}/5)
Energi: {$entry['energy']}
Trigger: " . implode(", ", $entry['triggers']) . "
Catatan: \"{$entry['note']}\"
Mood 7 hari terakhir: " . implode(", ", $recentEntries) . "

Berikan respons hangat singkat (2-3 kalimat) dalam bahasa Indonesia yang:
1. Mengakui perasaan mereka dengan empati
2. Satu insight kecil tentang pola yang kamu lihat (jika ada)
3. Satu kata semangat atau tips kecil

Jangan gunakan bullet point. Tulis seperti teman bicara langsung.";

        $insight = callClaudeAPI($prompt, 200);
        sendResponse(true, ['insight' => $insight]);
        break;
        
    case 'weekly':
        $entries = $input['entries'];
        $summary = '';
        foreach ($entries as $e) {
            $summary .= "{$e['date']}: {$e['moodEmoji']} {$e['moodName']} ({$e['moodVal']}/5), trigger: " . implode(", ", $e['triggers']) . ", catatan: \"{$e['note']}\"\n";
        }
        
        $prompt = "Kamu adalah psikolog virtual yang penuh empati. Analisa pola emosi pengguna selama 7 hari ini:

$summary

Berikan analisa dalam bahasa Indonesia yang:
1. Pola emosi yang kamu lihat
2. Trigger yang paling berpengaruh  
3. Satu rekomendasi konkret untuk minggu depan

Format: 3 paragraf pendek, tulis seperti profesional tapi hangat. Tidak perlu heading.";

        $insight = callClaudeAPI($prompt, 400);
        sendResponse(true, ['insight' => $insight]);
        break;
        
    case 'quote':
        $moodContext = $input['moodContext'] ?? '';
        $moodCtx = $moodContext ? "tentang $moodContext atau cara menghadapinya" : "tentang kesehatan mental atau ketenangan";
        
        $prompt = "Berikan SATU kutipan inspiratif dalam bahasa Indonesia $moodCtx. 
Format:
KUTIPAN: [teks kutipan]
PENULIS: [nama penulis]

Hanya berikan kutipan dan nama penulis, tidak ada teks lain.";

        $response = callClaudeAPI($prompt, 150);
        $lines = explode("\n", $response);
        $quoteLine = '';
        $authorLine = '';
        foreach ($lines as $line) {
            if (strpos($line, 'KUTIPAN:') === 0) {
                $quoteLine = trim(substr($line, 8));
            } elseif (strpos($line, 'PENULIS:') === 0) {
                $authorLine = trim(substr($line, 8));
            }
        }
        
        sendResponse(true, [
            'quote' => $quoteLine ?: $response,
            'author' => $authorLine ?: 'HiddenFeel'
        ]);
        break;
        
    case 'tip':
        $avgMood = $input['avgMood'] ?? '3';
        $topTrigger = $input['topTrigger'] ?? 'pekerjaan';
        
        $prompt = "Pengguna memiliki rata-rata mood $avgMood/5 dan trigger terbanyak adalah \"$topTrigger\".
Berikan 1 saran praktis singkat (1-2 kalimat) untuk meningkatkan wellbeing mereka besok. Bahasa Indonesia, hangat dan konkret.";

        $tip = callClaudeAPI($prompt, 120);
        sendResponse(true, ['tip' => $tip]);
        break;
        
    default:
        sendResponse(false, null, 'Invalid action');
}
?>