<?php
/**
 * Email templates. Each function returns [subject, html, text].
 * All user-supplied values are escaped with e() before reaching the HTML.
 */

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function email_layout(string $preheader, string $bodyHtml): string
{
    $pre = e($preheader);

    return <<<HTML
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aisle &amp; Beyond</title></head>
<body style="margin:0;padding:0;background:#faf4ea;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">{$pre}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf4ea;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffcf6;border:1px solid #f4e6e0;border-radius:4px;">
<tr><td style="background:#0b2345;padding:28px 32px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:1px;color:#fdfaf3;">Aisle &amp; Beyond</td></tr>
<tr><td style="padding:36px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#444444;">
{$bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px;background:#f4e6e0;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6f6f6f;">Aisle &amp; Beyond &middot; Thoughtful. Intentional. Elevated.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
}

/** Auto-reply sent to the person who submitted the form. */
function template_client_reply(array $d): array
{
    $first = e(strtok($d['name'], ' ') ?: $d['name']);
    $replyTo = e(REPLY_TO_EMAIL);

    $body = <<<HTML
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;color:#0b2345;">Thank you, {$first}.</h1>
<p style="margin:0 0 16px;">We have received your note and are so glad you reached out. A member of our team will be in touch shortly to begin the conversation about your bridal journey.</p>
<p style="margin:0 0 16px;">If there is anything you would like to add in the meantime, simply reply to this email or write to us at <a href="mailto:{$replyTo}" style="color:#c2705a;">{$replyTo}</a>.</p>
<p style="margin:24px 0 0;">With care,<br><span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#0b2345;">The Aisle &amp; Beyond Team</span></p>
HTML;

    $text = "Thank you, {$d['name']}.\n\n"
        . "We have received your note and are so glad you reached out. A member of our team will be in touch shortly to begin the conversation about your bridal journey.\n\n"
        . "If there is anything you would like to add, reply to this email or write to us at " . REPLY_TO_EMAIL . ".\n\n"
        . "With care,\nThe Aisle & Beyond Team\n";

    return [
        'We received your message - Aisle & Beyond',
        email_layout('We have received your note and will be in touch shortly.', $body),
        $text,
    ];
}

/** Notification sent to OWNER_EMAIL with the full inquiry. */
function template_owner_notification(array $d): array
{
    $rows = [
        'Name' => $d['name'],
        'Email' => $d['email'],
        'Phone' => $d['phone'],
        'Wedding date' => $d['wedding_date'],
        'Wedding location' => $d['wedding_location'],
        'Required service' => $d['service'],
    ];

    $rowsHtml = '';
    $text = "New inquiry from the website\n\n";

    foreach ($rows as $label => $value) {
        $shown = $value !== '' ? $value : '-';
        $label = e($label);
        $valueHtml = e($shown);

        if ($label === 'Email' && $value !== '') {
            $valueHtml = '<a href="mailto:' . e($value) . '" style="color:#c2705a;">' . e($value) . '</a>';
        }

        $rowsHtml .= '<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid #f4e6e0;width:150px;vertical-align:top;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2705a;">'
            . $label . '</td><td style="padding:10px 0;border-bottom:1px solid #f4e6e0;color:#1b2b3f;">'
            . $valueHtml . '</td></tr>';
        $text .= $label . ': ' . $shown . "\n";
    }

    $details = $d['details'] !== '' ? $d['details'] : '(no additional details)';
    $detailsHtml = nl2br(e($details));
    $text .= "\nDetails:\n" . $details . "\n";

    $body = <<<HTML
<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:#0b2345;">New inquiry</h1>
<p style="margin:0 0 20px;">Someone just submitted the contact form. Reply to this email to answer them directly.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">{$rowsHtml}</table>
<p style="margin:24px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2705a;">More details</p>
<p style="margin:0;color:#1b2b3f;">{$detailsHtml}</p>
HTML;

    return [
        'New inquiry from ' . $d['name'],
        email_layout('New inquiry from ' . $d['name'], $body),
        $text,
    ];
}
