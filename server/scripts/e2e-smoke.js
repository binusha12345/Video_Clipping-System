#!/usr/bin/env node
// ============================================================
// End-to-end smoke test for the ClipForge API.
//
// Exercises the full pipeline against a running server:
//   register -> login -> video metadata -> create project ->
//   analysis (poll) -> render job (poll) -> download MP4
//
//   npm run test:e2e            (expects API on :5001)
//   API_BASE=... npm run test:e2e
//
// Exits non-zero on the first failure.
// ============================================================
const BASE = process.env.API_BASE || 'http://localhost:5001/api';
const VIDEO_URL = process.env.TEST_VIDEO_URL || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    console.log('\nSmoke test FAILED');
    process.exit(1);
  }
}

async function call(path, { method = 'GET', token, body, raw = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return { status: res.status, buffer: Buffer.from(await res.arrayBuffer()), res };
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json, res };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(path, token, predicate, label, timeoutMs) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    const { status, json } = await call(path, { token });
    if (status === 200) {
      last = json.data;
      if (predicate(last)) return last;
    }
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for ${label}. Last state: ${JSON.stringify(last)}`);
}

(async () => {
  // 1. Health
  const health = await call('/health');
  check('GET /health', health.status === 200 && health.json.success === true);

  // 2. Auth
  const email = `smoke${Date.now()}@example.com`;
  const reg = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Test', email, password: 'password123' },
  });
  check('POST /auth/register', reg.status === 201 && !!reg.json.data?.accessToken, `status ${reg.status}`);
  const token = reg.json.data.accessToken;

  const me = await call('/auth/me', { token });
  check('GET /auth/me', me.status === 200 && me.json.data.email === email);

  const unauth = await call('/projects');
  check('Unauthenticated request rejected', unauth.status === 401, `status ${unauth.status}`);

  // 3. Rights gate — must refuse without confirmation
  const noRights = await call('/projects', {
    method: 'POST',
    token,
    body: { url: VIDEO_URL, rightsConfirmed: false, rightsType: 'OWNER', sourceType: 'youtube' },
  });
  check('Rights confirmation is enforced', noRights.status === 403, `status ${noRights.status}`);

  const safeModeConflict = await call('/projects', {
    method: 'POST',
    token,
    body: {
      url: VIDEO_URL,
      rightsConfirmed: true,
      rightsType: 'FAIR_USE_CLAIM',
      rightsSafeMode: true,
      sourceType: 'youtube',
    },
  });
  check(
    'Rights-Safe Mode rejects fair-use claims',
    safeModeConflict.status === 422,
    `status ${safeModeConflict.status}`
  );

  // 4. Music library requires auth
  const musicNoAuth = await call('/export/music/library');
  check('Music library rejects anonymous requests', musicNoAuth.status === 401, `status ${musicNoAuth.status}`);
  const music = await call('/export/music/library', { token });
  check(
    'GET /export/music/library lists installed tracks',
    music.status === 200 && Array.isArray(music.json.data) && music.json.data.length > 0,
    `${music.json.data?.length ?? 0} tracks`
  );

  // 5. Metadata
  const meta = await call('/projects/metadata', { method: 'POST', token, body: { url: VIDEO_URL } });
  check('POST /projects/metadata', meta.status === 200 && !!meta.json.data?.title, `status ${meta.status}`);

  // 5. Create project -> analysis pipeline
  const created = await call('/projects', {
    method: 'POST',
    token,
    body: {
      url: VIDEO_URL,
      rightsConfirmed: true,
      rightsType: 'OWNER',
      rightsSafeMode: true,
      sourceType: 'youtube',
    },
  });
  check('POST /projects', created.status === 201 && !!created.json.data?.id, `status ${created.status}`);
  const projectId = created.json.data.id;

  const project = await waitFor(
    `/projects/${projectId}`,
    token,
    (p) => p.status === 'READY' || p.status === 'ERROR',
    'analysis to finish (READY/ERROR)',
    240000
  );
  check('Analysis reaches READY', project.status === 'READY', `status=${project.status} ${project.statusMessage || ''}`);
  check('Clip candidates produced', Array.isArray(project.clips) && project.clips.length > 0, `${project.clips?.length} clips`);

  // 5b. Upload flow (rights-safe path)
  const tinyVideo = Buffer.from(
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=' +
      'AAAAIZnJlZQ==' ,
    'base64'
  );
  const form = new FormData();
  form.append('video', new Blob([tinyVideo], { type: 'video/mp4' }), 'my-video.mp4');
  form.append('rightsConfirmed', 'true');
  form.append('rightsType', 'OWNER');
  form.append('rightsSafeMode', 'true');
  const upRes = await fetch(`${BASE}/projects/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const upBody = await upRes.json().catch(() => ({}));
  check(
    'POST /projects/upload accepts a video',
    upRes.status === 201 && !!upBody.data?.id,
    `status ${upRes.status} ${upBody.error || ''}`
  );

  const upNoRights = await (async () => {
    const f = new FormData();
    f.append('video', new Blob([tinyVideo], { type: 'video/mp4' }), 'x.mp4');
    f.append('rightsConfirmed', 'false');
    f.append('rightsType', 'OWNER');
    const r = await fetch(`${BASE}/projects/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: f,
    });
    return r.status;
  })();
  check('Upload enforces rights confirmation', upNoRights === 403, `status ${upNoRights}`);

  // 6. Render
  const clip = project.clips[0];
  const render = await call('/render', {
    method: 'POST',
    token,
    body: {
      projectId,
      clipId: clip.id,
      editorConfig: {
        trimStart: 0,
        trimEnd: 0,
        subtitles: true,
        subtitleStyle: {
          fontFamily: 'Inter',
          fontSize: 42,
          color: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 2,
          bold: true,
          italic: false,
          position: 'bottom',
          animation: 'fade-in',
        },
        musicVolume: 0.3,
        voiceVolume: 1,
        aiCommentary: false,
        watermark: { enabled: false, position: 'bottom-right', opacity: 0.8 },
      },
    },
  });
  check('POST /render', render.status === 202 && !!render.json.data?.jobId, `status ${render.status}`);
  const jobId = render.json.data.jobId;

  const job = await waitFor(
    `/render/${jobId}`,
    token,
    (j) => j.status === 'COMPLETED' || j.status === 'FAILED',
    'render to finish',
    300000
  );
  check('Render completes', job.status === 'COMPLETED', `status=${job.status} error=${job.error || 'none'}`);

  // 7. Download (authenticated, and rejected otherwise)
  const dlNoAuth = await call(`/export/${jobId}/download`, { raw: true });
  check('Download rejects anonymous requests', dlNoAuth.status === 401, `status ${dlNoAuth.status}`);

  const dl = await call(`/export/${jobId}/download`, { token, raw: true });
  const isMp4 = dl.buffer.length > 1000 && dl.buffer.slice(4, 8).toString() === 'ftyp';
  check('GET /export/:jobId/download returns an MP4', dl.status === 200 && isMp4, `status ${dl.status}, ${dl.buffer.length} bytes`);

  // 8. SSE endpoint requires auth
  const sseRes = await fetch(`${BASE}/render/${jobId}/progress`);
  check('SSE progress stream rejects anonymous requests', sseRes.status === 401, `status ${sseRes.status}`);
  await sseRes.body?.cancel();

  console.log('\nSmoke test PASSED: register → analyze → render → download');
})().catch((err) => {
  console.error('\nSmoke test FAILED:', err.message);
  process.exit(1);
});
