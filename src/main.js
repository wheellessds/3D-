import { Game } from './game.js';

const app = document.querySelector('#app');
if (!app) throw new Error('找不到 #app 根節點');

const game = new Game(app);
game.boot();
