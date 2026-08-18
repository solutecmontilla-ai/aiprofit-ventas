const { getFile, checkAuth } = require('./_github');

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

module.exports = async function handler(req, res) {
  if (!checkAuth(req)) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }
  try {
    const { content } = await getFile('index.html');

    const fields = {};
    for (const [key, tag] of Object.entries(FIELD_TAGS)) {
      const re = new RegExp(`<${tag}[^>]*?data-edit="${key}"[^>]*?>([\\s\\S]*?)<\\/${tag}>`);
      const match = content.match(re);
      fields[key] = match ? match[1].trim() : null;
    }

    const colors = {};
    for (const name of COLOR_VARS) {
      const re = new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{3,8})\\s*;`);
      const match = content.match(re);
      colors[name] = match ? match[1] : null;
    }

    res.status(200).json({
      fields,
      colors,
      _debug: {
        contentLength: content.length,
        hasHeadlineMarker: content.includes('data-edit="headline"'),
        repoEnv: process.env.GITHUB_REPO || null,
        branchEnv: process.env.GITHUB_BRANCH || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
