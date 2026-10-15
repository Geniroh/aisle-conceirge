<?php
/**
 * Contact form endpoint.
 * Validates the submission, drops bots (honeypot + timing + rate limit),
 * then sends two emails through Resend:
 *   1. an auto-reply to the client
 *   2. a notification with the full details to OWNER_EMAIL
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

require __DIR__ . '/config.php';
require __DIR__ . '/templates.php';

const MIN_FILL_SECONDS = 3;      // humans take longer than this to fill the form
const MAX_FORM_AGE = 86400;      // stale pages (24h) are rejected
const RATE_LIMIT_MAX = 5;        // submissions per IP...
const RATE_LIMIT_WINDOW = 3600;  // ...per hour

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function clean(string $key, int $max = 200): string
{
    $value = isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : '';
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value));

    return mb_substr($value, 0, $max);
}

function single_line(string $value): string
{
    return trim(preg_replace('/\s+/', ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

// Same-origin / allow-listed origins only.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $sameOrigin = parse_url($origin, PHP_URL_HOST) === preg_replace('/:\d+$/', '', $host);

    if (!$sameOrigin && !in_array($origin, ALLOWED_ORIGINS, true)) {
        respond(403, ['ok' => false, 'error' => 'Forbidden.']);
    }
}

// --- Bot defences -----------------------------------------------------------
// Honeypot: invisible to people, tempting to bots. Pretend success so the bot
// learns nothing and doesn't retry.
if (clean('company_website') !== '') {
    respond(200, ['ok' => true]);
}

// Timing: form_ts is set by JS when the page loads (ms epoch).
$started = (int) (clean('form_ts', 20) ?: 0) / 1000;
$elapsed = time() - $started;
if ($started <= 0 || $elapsed < MIN_FILL_SECONDS) {
    respond(200, ['ok' => true]);
}
if ($elapsed > MAX_FORM_AGE) {
    respond(400, ['ok' => false, 'error' => 'This page has expired. Please refresh and try again.']);
}

// Per-IP rate limit, stored in the system temp dir (no database needed).
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/ab_contact_' . hash('sha256', $ip) . '.json';
$now = time();
$hits = [];

if (is_file($rateFile)) {
    $hits = json_decode((string) file_get_contents($rateFile), true) ?: [];
    $hits = array_values(array_filter($hits, fn ($t) => is_int($t) && $t > $now - RATE_LIMIT_WINDOW));
}
if (count($hits) >= RATE_LIMIT_MAX) {
    respond(429, ['ok' => false, 'error' => 'Too many messages. Please try again later.']);
}

// --- Validation ---------------------------------------------------------------
$data = [
    'name' => single_line(clean('name', 120)),
    'email' => single_line(clean('email', 254)),
    'phone' => '',
    'wedding_date' => single_line(clean('wedding_date', 10)),
    'wedding_location' => single_line(clean('wedding_location', 80)),
    'service' => single_line(clean('service', 80)),
    'details' => clean('details', 3000),
];

$errors = [];

if ($data['name'] === '') {
    $errors['name'] = 'Please enter your name.';
}
if ($data['email'] === '' || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}
if ($data['wedding_date'] !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['wedding_date'])) {
    $data['wedding_date'] = '';
}

if ($data['wedding_location'] === 'Other') {
    $other = single_line(clean('wedding_location_other', 120));
    $data['wedding_location'] = $other !== '' ? 'Other: ' . $other : 'Other';
}

$phone = single_line(clean('phone', 30));
if ($phone !== '') {
    $dial = clean('phone_dial', 6);
    $dial = preg_match('/^\+\d{1,4}$/', $dial) ? $dial : '';
    $data['phone'] = trim($dial . ' ' . $phone);
}

if ($errors) {
    respond(422, ['ok' => false, 'errors' => $errors]);
}

// --- Send via Resend ------------------------------------------------------------
function resend_send(array $payload): bool
{
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);

    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status < 200 || $status >= 300) {
        error_log('Resend error (' . $status . '): ' . (is_string($response) ? $response : 'no response'));
        return false;
    }

    return true;
}

[$ownerSubject, $ownerHtml, $ownerText] = template_owner_notification($data);
[$clientSubject, $clientHtml, $clientText] = template_client_reply($data);

// Owner notification first: it is the one that matters. Reply-To is the client
// so hitting "Reply" answers them directly.
$ownerSent = resend_send([
    'from' => MAIL_FROM,
    'to' => [OWNER_EMAIL],
    'reply_to' => $data['email'],
    'subject' => single_line($ownerSubject),
    'html' => $ownerHtml,
    'text' => $ownerText,
]);

if (!$ownerSent) {
    respond(502, ['ok' => false, 'error' => 'We could not send your message. Please try again or email us directly.']);
}

// Auto-reply is best-effort; a failure here should not tell the client their
// message was lost.
resend_send([
    'from' => MAIL_FROM,
    'to' => [$data['email']],
    'reply_to' => REPLY_TO_EMAIL,
    'subject' => $clientSubject,
    'html' => $clientHtml,
    'text' => $clientText,
]);

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

respond(200, ['ok' => true]);
