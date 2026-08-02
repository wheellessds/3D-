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
const GameClass = new Function('THREE', `${source}\nreturn Game;`)(THREE);

// The original prototype calculated WASD displacement in world space. Correct it
// after each player-update tick so movement follows the camera's yaw while still
// reusing the game's collision routine.
const prototype = GameClass.prototype;
const methodNames = Object.getOwnPropertyNames(prototype).filter(
  (name) => name !== 'constructor' && typeof prototype[name] === 'function',
);
const movementUpdateName = methodNames.find((name) => {
  const body = Function.prototype.toString.call(prototype[name]);
  return body.includes('KeyW')
    && body.includes('KeyA')
    && body.includes('KeyS')
    && body.includes('KeyD')
    && body.includes('playerPosition');
});
const collisionMoveName = [
  'tryMovePlayer',
  'movePlayer',
  'movePlayerWithCollisions',
].find((name) => typeof prototype[name] === 'function') ?? methodNames.find((name) => {
  if (name === movementUpdateName || prototype[name].length !== 1) return false;
  const body = Function.prototype.toString.call(prototype[name]);
  return body.includes('playerPosition')
    && (body.includes('collider') || body.includes('collision') || body.includes('walls'));
});

if (movementUpdateName) {
  const originalUpdate = prototype[movementUpdateName];
  const collisionMove = collisionMoveName ? prototype[collisionMoveName] : null;
  const up = new THREE.Vector3(0, 1, 0);

  prototype[movementUpdateName] = function cameraRelativeMovementPatch(...args) {
    const position = this.playerPosition;
    const keys = this.keys;
    if (!position?.isVector3 || typeof keys?.has !== 'function') {
      return originalUpdate.apply(this, args);
    }

    const forward = keys.has('KeyW');
    const backward = keys.has('KeyS');
    const left = keys.has('KeyA');
    const right = keys.has('KeyD');
    const hasMovementInput = forward || backward || left || right;
    const beforeX = position.x;
    const beforeZ = position.z;

    const result = originalUpdate.apply(this, args);
    if (!hasMovementInput) return result;

    const rawX = position.x - beforeX;
    const rawZ = position.z - beforeZ;
    const dt = Number(args[0]) || 0;
    const velocityMagnitude = this.velocity?.isVector3
      ? Math.hypot(this.velocity.x, this.velocity.z) * dt
      : 0;
    const distance = Math.max(Math.hypot(rawX, rawZ), velocityMagnitude);
    if (distance <= 1e-7) return result;

    const localDirection = new THREE.Vector3(
      Number(right) - Number(left),
      0,
      Number(backward) - Number(forward),
    );
    if (localDirection.lengthSq() === 0) return result;

    localDirection
      .normalize()
      .applyAxisAngle(up, this.yaw?.rotation?.y ?? 0)
      .multiplyScalar(distance);

    // Undo the world-space horizontal movement performed by the original tick.
    position.x = beforeX;
    position.z = beforeZ;

    if (collisionMove) {
      collisionMove.call(this, localDirection);
    } else {
      position.x += localDirection.x;
      position.z += localDirection.z;
    }

    return result;
  };
} else {
  console.warn('PROJECT ECHO：找不到玩家移動更新函式，鏡頭相對移動修正未套用。');
}

export const Game = GameClass;
