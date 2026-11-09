<?php
/* POST /api/contact — delivers enquiries and call requests.
 *
 * The Apache counterpart to api/contact.js, which does the same job on Vercel.
 * Both forms post natively, so they work with JavaScript disabled; site.js and
 * digital.js upgrade them to submit in place and expect JSON back whenever they
 * send an Accept: application/json header.
 *
 * Mail goes out through the server's own mail transport to a mailbox on this
 * domain, so there is no API key to configure and nothing to keep in sync with
 * a third party. CONTACT_FROM must stay on frameworksstudios.com or SPF and
 * DKIM will not cover it and the mail will be treated as spoofed.
 */

const CONTACT_TO   = 'cameron@frameworksstudios.com';
const CONTACT_FROM = 'Frameworks Studios <no-reply@frameworksstudios.com>';

const FIELDS = ['name', 'company', 'email', 'phone', 'sector', 'location',
                'services', 'budget', 'timeline', 'date', 'time', 'message', 'source'];
const LABELS = [
  'name' => 'Name', 'company' => 'Company', 'email' => 'Email', 'phone' => 'Phone',
  'sector' => 'Sector', 'location' => 'Location', 'services' => 'Services of interest',
  'budget' => 'Budget', 'timeline' => 'Timeline', 'date' => 'Requested date',
  'time' => 'Requested time (CET)', 'message' => 'Notes', 'source' => 'Enquiry from',
];
const LIMIT = 4000;

function esc($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }

/* Checkbox groups arrive as repeated keys. PHP's own $_POST keeps only the last
   value unless the field is named foo[], which this markup does not do, so the
   body is parsed by hand to keep every value. */
function from_params($raw) {
    $out = [];
    foreach (explode('&', $raw) as $pair) {
        if ($pair === '') continue;
        $bits = explode('=', $pair, 2);
        $k = urldecode(str_replace('+', ' ', $bits[0]));
        $v = isset($bits[1]) ? urldecode(str_replace('+', ' ', $bits[1])) : '';
        if (array_key_exists($k, $out)) {
            $out[$k] = array_merge((array) $out[$k], [$v]);
        } else {
            $out[$k] = $v;
        }
    }
    return $out;
}

function read_body() {
    $raw  = file_get_contents('php://input');
    $type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== false) {
        $parsed = json_decode($raw, true);
        return is_array($parsed) ? $parsed : [];
    }
    if ($raw !== '') return from_params($raw);
    return $_POST;
}

function clean($v) {
    $out = [];
    foreach ((array) $v as $x) {
        if ($x === null) continue;
        $x = trim((string) $x);
        if ($x === '') continue;
        $out[] = mb_substr($x, 0, LIMIT);
    }
    return $out;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body      = read_body();
$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
$isCall    = (string) ($body['mode'] ?? '') === 'call';

/* Where a no-JavaScript submit lands. Only same-origin paths are honoured —
   "//host" would leave the site, so it is rejected along with absolute URLs. */
$next = $body['next'] ?? '';
$back = (is_string($next) && str_starts_with($next, '/') && !str_starts_with($next, '//'))
    ? $next
    : '/contact?sent=1';
$fail = explode('?', $back)[0] . '?error=';

function done($status, $ok, $message) {
    global $wantsJson, $back, $fail;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        http_response_code(303);
        header('Location: ' . ($ok ? $back : $fail . rawurlencode($message) . '#enquire'));
    }
    exit;
}

/* Honeypot: a real person never fills a field they cannot see. Answer as if it
   succeeded so the bot has nothing to learn from the difference. */
if (count(clean($body['_gotcha'] ?? null))) {
    done(200, true, 'Thank you — your enquiry is on its way.');
}

$data = [];
foreach (FIELDS as $f) {
    $v = clean($body[$f] ?? null);
    if (count($v)) $data[$f] = implode($f === 'services' ? ', ' : ' ', $v);
}

if (empty($data['name']) || empty($data['email'])) {
    done(400, false, 'Please give us your name and an email address.');
}
if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $data['email'])) {
    done(400, false, 'That email address does not look right.');
}
if ($isCall && (empty($data['date']) || empty($data['time']))) {
    done(400, false, 'Please choose a date and a time for the call.');
}

$rows = array_values(array_filter(FIELDS, fn($f) => !empty($data[$f])));

$text = implode("\n", array_map(fn($f) => LABELS[$f] . ': ' . $data[$f], $rows));

$html = '<div style="font-family:-apple-system,Segoe UI,sans-serif;line-height:1.55">'
      . '<h2 style="font-weight:600;margin:0 0 4px">' . ($isCall ? 'Call request' : 'New enquiry') . '</h2>'
      . '<p style="color:#666;margin:0 0 18px">' . esc($data['source'] ?? 'Website') . '</p>'
      . '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">';
foreach ($rows as $f) {
    $html .= '<tr><td style="padding:7px 22px 7px 0;color:#666;vertical-align:top;white-space:nowrap">'
           . LABELS[$f] . '</td><td style="padding:7px 0">'
           . nl2br(esc($data[$f])) . '</td></tr>';
}
$html .= '</table></div>';

$subject = $isCall
    ? 'Call request — ' . $data['name'] . (!empty($data['date']) ? ' · ' . $data['date'] . ' ' . $data['time'] : '')
    : 'Enquiry — ' . $data['name'] . (!empty($data['company']) ? ' (' . $data['company'] . ')' : '');

/* A multipart message so the plain-text copy survives clients that will not
   render HTML, and so the mail does not look like a bare HTML blob to filters. */
$boundary = 'fw-' . bin2hex(random_bytes(12));
$headers  = [
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    'From: ' . CONTACT_FROM,
    'Reply-To: ' . $data['name'] . ' <' . $data['email'] . '>',
    'X-Mailer: frameworksstudios.com',
];

$message = "--$boundary\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: 8bit\r\n\r\n"
         . $text . "\r\n\r\n"
         . "--$boundary\r\n"
         . "Content-Type: text/html; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: 8bit\r\n\r\n"
         . $html . "\r\n\r\n"
         . "--$boundary--\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = @mail(CONTACT_TO, $encodedSubject, $message, implode("\r\n", $headers),
              '-f no-reply@frameworksstudios.com');

if (!$sent) {
    error_log('contact: mail() refused the message for ' . CONTACT_TO);
    done(502, false, 'We could not send that just now. Please try again shortly.');
}

done(200, true, $isCall
    ? 'Thank you — we will confirm your call by email.'
    : 'Thank you — your enquiry is on its way.');
