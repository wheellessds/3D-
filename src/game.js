import * as THREE from 'three';

const EXPECTED_SHA256 = '62eae47a0b4c2dba0fd2112e96d275c0a392f3af465f14a4d2ecf2ac7dd96fac';
const partUrls = Array.from(
  { length: 8 },
  (_, index) => new URL(`./runtime/part-${index.toString().padStart(2, '0')}.b64`, import.meta.url),
);

const responses = await Promise.all(partUrls.map((url) => fetch(url)));
for (const response of responses) {
  if (!response.ok) {
    throw new Error(`PROJECT ECHO 核心載入失敗：${response.status} ${response.url}`);
  }
}

const encoded = (await Promise.all(responses.map((response) => response.text())))
  .join('')
  .replace(/\s+/g, '');
const binary = atob(encoded);
const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
const digest = await crypto.subtle.digest('SHA-256', bytes);
const checksum = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
if (checksum !== EXPECTED_SHA256) {
  throw new Error(`PROJECT ECHO 核心校驗失敗：${checksum}`);
}

const source = new TextDecoder().decode(bytes);
export const Game = new Function('THREE', `${source}\nreturn Game;`)(THREE);
