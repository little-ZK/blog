// 点赞 API —— Cloudflare Pages Functions
// GET  /api/like?path=/xxx    -> 查询某篇文章的点赞数和当前访问者是否已点赞
// POST /api/like?path=/xxx    -> 给某篇文章点赞（同一 Cookie 只能点一次）

const COOKIE_PREFIX = 'blog_liked_';
const MAX_AGE = 31536000; // 1 年

// 简单字符串 hash，用于生成合法的 Cookie 名
function hashPath(path) {
  let h = 0;
  for (let i = 0; i < path.length; i++) {
    h = ((h << 5) - h + path.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const eq = part.indexOf('=');
    if (eq > -1) {
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      cookies[k] = v;
    }
  });
  return cookies;
}

function json(data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '/';
  const key = 'like:' + path;
  const count = parseInt((await env.blog_like_count.get(key)) || '0', 10) || 0;
  const cookies = parseCookies(request.headers.get('Cookie'));
  const liked = cookies[COOKIE_PREFIX + hashPath(path)] === '1';
  return json({ count, liked });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '/';
  const key = 'like:' + path;
  const cookieName = COOKIE_PREFIX + hashPath(path);

  const cookies = parseCookies(request.headers.get('Cookie'));
  if (cookies[cookieName] === '1') {
    // 已经点过赞：不重复计数，返回当前数量
    const count = parseInt((await env.blog_like_count.get(key)) || '0', 10) || 0;
    return json({ count, liked: true, already: true });
  }

  let count = parseInt((await env.blog_like_count.get(key)) || '0', 10) || 0;
  count += 1;
  await env.blog_like_count.put(key, String(count));

  return json(
    { count, liked: true, already: false },
    {
      'Set-Cookie': `${cookieName}=1; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`,
    }
  );
}
