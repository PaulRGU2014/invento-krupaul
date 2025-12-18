#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

const root = path.resolve(__dirname, '..');
const enPath = path.join(root, 'src/i18n/en.json');
const genThPath = path.join(root, 'src/i18n/generated/th.json');
const overridesThPath = path.join(root, 'src/i18n/overrides/th.json');

function readJson(p) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

function setNested(obj, key, value) {
  const parts = key.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    cur[p] = cur[p] && typeof cur[p] === 'object' ? cur[p] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

async function main() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  if (!projectId) {
    console.error('Missing GOOGLE_PROJECT_ID');
    process.exit(1);
  }
  const translate = new Translate({ projectId });

  const en = readJson(enPath);
  const genTh = readJson(genThPath);
  const overridesTh = readJson(overridesThPath);

  const enFlat = flatten(en);
  const genFlat = flatten(genTh);
  const overrideFlat = flatten(overridesTh);

  const missingKeys = Object.keys(enFlat).filter((k) => !(k in genFlat) && !(k in overrideFlat));
  if (missingKeys.length === 0) {
    console.log('No missing keys to translate.');
    return;
  }

  console.log(`Translating ${missingKeys.length} keys to Thai...`);
  for (const key of missingKeys) {
    const source = enFlat[key];
    try {
      const [translated] = await translate.translate(source, 'th');
      setNested(genTh, key, translated);
      console.log(`✓ ${key}`);
    } catch (e) {
      console.error(`Failed: ${key}`, e.message || e);
    }
  }

  writeJson(genThPath, genTh);
  console.log('Updated generated Thai translations:', genThPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
