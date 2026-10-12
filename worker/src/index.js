const MAX_TITLE = 120;
const MAX_BODY = 2000;

const TYPES = {
  issue: {
    prefix: '[User report]',
    label: 'user-report',
    source: 'report',
    body: (details) => details,
  },
  feature: {
    prefix: '[Feature request]',
    label: 'feature-request',
    source: 'feature request',
    body: (details, idea) =>
      `### What are you trying to do?\n${details}` + (idea ? `\n\n### Idea\n${idea}` : ''),
  },
};

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

    const type = TYPES[data.type || 'issue'];
    if (!type) return reply(400, 'Invalid request');

    const title = String(data.title || '').trim();
    const details = String(data.details || '').trim();
    const idea = String(data.idea || '').trim();
    if (!title || !details) return reply(400, 'Title and details are required');
    if (title.length > MAX_TITLE || details.length > MAX_BODY || idea.length > MAX_BODY) return reply(400, 'Message too long');

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
        title: `${type.prefix} ${title}`,
        body: type.body(details, idea) + `\n\n---\n_Submitted via the in-app ${type.source} form._`,
        labels: [type.label],
      }),
    });
    if (!gh.ok) return reply(502, 'Could not file the report. Please try again later.');

    const issue = await gh.json();
    return new Response(JSON.stringify({ message: 'Thanks! Your report was submitted.', url: issue.html_url }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
