const MAX_TITLE = 120;
const MAX_BODY = 2000;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const reply = (status, message) =>
      new Response(JSON.stringify({ message }), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, 'Method not allowed');
    if (request.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply(403, 'Forbidden');

    let data;
    try {
      data = await request.json();
    } catch {
      return reply(400, 'Invalid request');
    }

    // Honeypot: real users never fill this in; pretend success so bots don't retry.
    if (data.website) return reply(200, 'Thanks!');

    const title = String(data.title || '').trim();
    const details = String(data.details || '').trim();
    if (!title || !details) return reply(400, 'Title and details are required');
    if (title.length > MAX_TITLE || details.length > MAX_BODY) return reply(400, 'Message too long');

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: data.turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP'),
      }),
    });
    const result = await verify.json();
    if (!result.success) return reply(400, 'Bot check failed. Please try again.');

    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'callingmanager-report-worker',
      },
      body: JSON.stringify({
        title: `[User report] ${title}`,
        body: `${details}\n\n---\n_Submitted via the in-app report form._`,
        labels: ['user-report'],
      }),
    });
    if (!gh.ok) return reply(502, 'Could not file the report. Please try again later.');

    return reply(200, 'Thanks! Your report was submitted.');
  },
};
