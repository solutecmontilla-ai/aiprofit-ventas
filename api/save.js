const { getFile, putFile, checkAuth } = require('./_github');

const FIELD_TAGS = {
  headline: 'h1',
  subheadline: 'p',
  price_2pagos: 'div',
  cta_2pagos: 'a',
  price_unico: 'div',
  cta_unico: 'span',
  price_3pagos: 'div',
  cta_3pagos: 'a',
  cta_principal: 'span',
  testimonio_susan: 'p',
  testimonio_ervin: 'p',
};

const COLOR_VARS = ['lime', 'violet', 'violet-d'];

function applyEdits(content, fields, colors) {
  let out = content;

  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined || value === null) continue;
    const tag = FIELD_TAGS[key];
    if (!tag) continue;
    const re = new RegExp(`(<${tag}[^>]*?data-edit="${key}"[^>]*?>)([\\s\\S]*?)(<\\/${tag}>)`, 'g');
    out = out.replace(re, (_m, open, _old, close) => `${open}${value}${close}`);
  }

  for (const [name, value] of Object.entries(colors || {})) {
    if (!value || !COLOR_VARS.includes(name)) continue;
    if (!/^#[0-9A-Fa-f]{3,8}$/.test(value)) continue;
    const re = new RegExp(`(--${name}:\\s*)#[0-9A-Fa-f]{3,8}(\\s*;)`, 'g');
    out = out.replace(re, (_m, pre, post) => `${pre}${value}${post}`);
  }

  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!checkAuth(req)) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }

  try {
    const { fields, colors } = req.body || {};

    for (const path of ['index.html', 'pagina-ventas-profit-code_2.html']) {
      const { content, sha } = await getFile(path);
      const updated = applyEdits(content, fields, colors);
      if (updated === content) continue;
      await putFile(path, updated, sha, 'Editar copy/colores desde el panel');
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
