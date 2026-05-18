import { DOMManager } from './DOMManager.js';
import { Game } from './Game.js';
import { ApiService } from './ApiService.js';

const domManager = new DOMManager();
const game = new Game();

// Lancement de la partie
document.querySelector('.game-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  // Audio d'ambiance
  const bgMusic = document.querySelector('#bg-music');
  if (bgMusic) {
    bgMusic.volume = 0.1;
    bgMusic.play().catch(err => console.warn("Audio bloqué :", err));
  }

  const formData = new FormData(this);
  const pseudo = formData.get('pseudo');
  const mode = formData.get('mode');

  let difficulty = parseInt(formData.get('difficulty'), 10);
  let collectionName = formData.get('collection');
  let duration = parseInt(formData.get('duration'), 10);

  // Configuration dynamique du mode niveau
  if (mode === "level") {
    const currentLevel = game.getLevel();
    difficulty = Math.min(3 + currentLevel, 8);
    const collections = ["animals", "fruits", "cars"];
    collectionName = collections[(currentLevel - 1) % collections.length];
    duration = 70 - (currentLevel * 10);
  }

  try {
    const data = await ApiService.createGame(pseudo, difficulty);
    game.startGame(data.id, difficulty, collectionName, duration, mode);
  } catch (error) {
    alert(error.message || 'Erreur lors de la création de la partie');
  }
});

// Interface : blocage des champs selon le mode choisi
document.querySelector('#game-mode').addEventListener('change', function() {
  const durationSelect = document.querySelector('#game-duration');
  const difficultySelect = document.querySelector('#difficulty');
  const collectionSelect = document.querySelector('#collection');

  switch (this.value) {
    case 'survie':
      durationSelect.disabled = true;
      difficultySelect.disabled = false;
      collectionSelect.disabled = false;
      break;
    case 'level':
      durationSelect.disabled = true;
      difficultySelect.disabled = true;
      collectionSelect.disabled = true;
      break;
    default:
      durationSelect.disabled = false;
      difficultySelect.disabled = false;
      collectionSelect.disabled = false;
      break;
  }
});