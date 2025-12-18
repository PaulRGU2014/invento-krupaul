#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { Translate } from '@google-cloud/translate/build/src/v2';

type Messages = Record<string, unknown>;

const root = path.resolve(__dirname, '..');
const enPath = path.join(root, 'src/i18n/en.json');
const genThPath = path.join(root, 'src/i18n/generated/th.json');
const overridesThPath = path.join(root, 'src/i18n/overrides/th.json');

function readJson(p: string): Messages {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};
}

function writeJson(p: string, obj: Messages) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

function flatten(obj: Messages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  const rec = obj as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const v = rec[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

function setNested(obj: Messages, key: string, value: string) {
  const parts = key.split('.');
  let cur = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    cur[p] = isPlainObject(next) ? next : {};
    cur = cur[p] as Record<string, unknown>;
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
      console.error(`Failed: ${key}`, e);
    }
  }

  writeJson(genThPath, genTh);
  console.log('Updated generated Thai translations:', genThPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
