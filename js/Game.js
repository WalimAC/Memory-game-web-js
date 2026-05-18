import { imageCollections } from './ImageCollection.js';
import { ApiService } from './ApiService.js';
import { DOMManager } from './DOMManager.js';

export class Game {
  #id;
  #difficulty;
  #collectionName;
  #domManager;

  #flippedCards = [];
  #isProcessing = false;
  #pairsFound = 0;

  #soundGG = new Audio('/assets/sons/victory.mp3');
  #soundPair = new Audio('/assets/sons/victory-pair.mp3');
  #soundGameOver = new Audio('/assets/sons/game-over.mp3');

  #timerId = null;
  #timeLeft = 60;
  #initialDuration = 60;

  #mode = "classic";
  #level = 1;
  #combo = 0;
  #maxCombo = 0;
  #jokerAvailable = true;

  constructor() {
    this.#domManager = new DOMManager();
  }

  #stopTimer() {
    if (this.#timerId) {
      clearInterval(this.#timerId);
      this.#timerId = null;
    }
  }

  // Clôture de la session en cours et affichage des résultats
  async endGame(reason = "victory") {
    this.#stopTimer();
    const idARemplacer = this.#id;
    const nombreDePairesRestante = this.#difficulty - this.#pairsFound;

    document.querySelector('.game-board').classList.add('hidden');
    document.querySelector('.game-sidebar').classList.add('hidden');

    const msgElement = document.querySelector('#game-message');
    if (msgElement) msgElement.classList.add('game-message-hidden');

    const endScreen = document.querySelector('#end-game-screen');
    const endTitle = document.querySelector('#end-title');
    const endMessage = document.querySelector('#end-message');
    const replayBtn = document.querySelector('#btn-replay');

    if (reason === "timeout") {
      this.#soundGameOver.currentTime = 0;
      this.#soundGameOver.play().catch(err => console.warn("Audio bloqué :", err));

      endTitle.textContent = "Temps écoulé !";
      endTitle.style.color = "#ff5964";
      endMessage.textContent = this.#mode === "level"
          ? `Dommage ! Tu as échoué au Niveau ${this.#level}. ⏱️`
          : "Dommage... Tu n'as pas été assez rapide ! ⏱️";
      replayBtn.textContent = this.#mode === "level" ? "Réessayer" : "Rejouer";
    } else if (reason === "abandon") {
      endTitle.textContent = "Abandon !";
      endTitle.style.color = "#718096";
      endMessage.textContent = `Partie arrêtée. Il te restait ${nombreDePairesRestante} paires à trouver. 🏳️`;
      replayBtn.textContent = "Rejouer";
    } else {
      this.#soundGG.currentTime = 0;
      this.#soundGG.play().catch(err => console.warn("Audio bloqué :", err));

      const tempsMis = this.#initialDuration - this.#timeLeft;
      endTitle.textContent = "Victoire !";
      endTitle.style.color = "#2ec4b6";

      let statsHTML = this.#mode === "level"
          ? `Niveau ${this.#level} validé avec succès ! 🔥<br><br>`
          : `Incroyable ! Tu as trouvé toutes les paires ! 🔥<br><br>`;

      statsHTML += `⏱️ | Temps mis : <strong>${tempsMis} secondes</strong><br>`;
      statsHTML += `💥 | Combo Max : <strong>x${this.#maxCombo}</strong>`;

      endMessage.innerHTML = statsHTML;
      replayBtn.textContent = this.#mode === "level" ? "Niveau Suivant" : "Rejouer";
    }

    endScreen.classList.remove('hidden');

    try {
      await ApiService.updateGameResult(idARemplacer, nombreDePairesRestante);
    } catch (error) {
      console.error('Error API:', error);
    }

    const restartBtn = document.querySelector('#btn-restart');
    const newRestartBtn = restartBtn.cloneNode(true);
    const newReplayBtn = replayBtn.cloneNode(true);
    restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
    replayBtn.parentNode.replaceChild(newReplayBtn, replayBtn);

    newRestartBtn.addEventListener('click', () => {
      this.#level = 1;
      endScreen.classList.add('hidden');
      document.querySelector('.game-board').classList.remove('hidden');
      document.querySelector('.game-sidebar').classList.remove('hidden');
      document.querySelector('.game-area').classList.add('hidden');
      document.querySelector('.setup-form').classList.remove('hidden');
    });

    newReplayBtn.addEventListener('click', () => {
      document.querySelector('#end-game-screen').classList.add('hidden');
      document.querySelector('.game-board').classList.remove('hidden');
      document.querySelector('.game-sidebar').classList.remove('hidden');

      if (this.#mode === "level") {
        if (reason === "victory") {
          this.#level++;
        } else {
          this.#level = 1;
          this.#jokerAvailable = true;
        }
      }
      document.querySelector('.game-form').requestSubmit();
    });
  }

  // Initialisation et configuration de la partie
  startGame(id, difficulty, collectionName, duration = 60, mode = "classic") {
    this.#id = id;
    this.#mode = mode;

    const levelZone = document.querySelector('#level-zone');

    if (this.#mode === "level") {
      levelZone.classList.remove('hidden');
      document.querySelector('#current-level').textContent = this.#level;

      this.#difficulty = Math.min(3 + this.#level, 8);
      this.#timeLeft = Math.max(70 - (this.#level * 10), 20);

      const collections = ["animals", "fruits", "cars"];
      this.#collectionName = collections[(this.#level - 1) % collections.length];
    } else if (this.#mode === "survie") {
      levelZone.classList.add('hidden');
      this.#difficulty = difficulty;
      this.#collectionName = collectionName;
      this.#timeLeft = 45;
    } else {
      levelZone.classList.add('hidden');
      this.#difficulty = difficulty;
      this.#collectionName = collectionName;
      this.#timeLeft = duration;
    }

    this.#initialDuration = this.#timeLeft;
    this.#pairsFound = 0;
    this.#flippedCards = [];
    this.#isProcessing = false;
    this.#combo = 0;
    this.#maxCombo = 0;

    // Gestion du joker selon le mode choisi
    const jokerBtn = document.querySelector('#btn-joker');

    if (this.#mode === "flash") {
      this.#jokerAvailable = false;
      jokerBtn.disabled = true;
      jokerBtn.textContent = "👁️ Joker (Bloqué)";
    } else if (this.#mode === "level") {
      if (this.#level === 1) this.#jokerAvailable = true;
      jokerBtn.disabled = !this.#jokerAvailable;
      jokerBtn.textContent = `👁️ Joker (${this.#jokerAvailable ? 1 : 0})`;
    } else {
      this.#jokerAvailable = true;
      jokerBtn.disabled = false;
      jokerBtn.textContent = "👁️ Joker (1)";
    }

    document.querySelector('#combo-value').textContent = "x0";
    document.querySelector('#chrono').textContent = this.#timeLeft;
    document.querySelector('.setup-form').classList.add('hidden');
    document.querySelector('.game-area').classList.remove('hidden');

    const fullCollection = imageCollections[this.#collectionName];
    const selectedImages = fullCollection.slice(0, this.#difficulty);
    let gameCards = [...selectedImages, ...selectedImages];

    // Algorithme de mélange de Fisher-Yates
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    this.#domManager.createCards(gameCards);

    // Démarrage spécifique au mode de jeu
    if (this.#mode === "flash") {
      this.#isProcessing = true;
      setTimeout(() => {
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(c => this.#domManager.flipCard(c));

        setTimeout(() => {
          allCards.forEach(c => this.#domManager.unflipCard(c));
          this.#isProcessing = false;
          this.#runTimer();
        }, 2000);
      }, 300);
    } else {
      this.#runTimer();
    }

    const newJokerBtn = jokerBtn.cloneNode(true);
    jokerBtn.parentNode.replaceChild(newJokerBtn, jokerBtn);
    newJokerBtn.addEventListener('click', () => this.#useJoker());

    const abandonBtn = document.querySelector('#btn-abandon');
    const newAbandonBtn = abandonBtn.cloneNode(true);
    abandonBtn.parentNode.replaceChild(newAbandonBtn, abandonBtn);
    newAbandonBtn.addEventListener('click', () => this.endGame("abandon"));

    const gameBoard = document.querySelector('.game-board');
    const newGameBoard = gameBoard.cloneNode(true);
    gameBoard.parentNode.replaceChild(newGameBoard, gameBoard);

    newGameBoard.addEventListener('click', (event) => {
      const clickedCard = event.target.closest('.card');
      if (!clickedCard || this.#isProcessing || clickedCard.classList.contains('flipped')) return;
      this.#handleCardClick(clickedCard);
    });
  }

  #runTimer() {
    this.#stopTimer();
    this.#timerId = setInterval(() => {
      this.#timeLeft--;
      document.querySelector('#chrono').textContent = this.#timeLeft;
      if (this.#timeLeft <= 0) this.endGame("timeout");
    }, 1000);
  }

  #useJoker() {
    if (!this.#jokerAvailable || this.#isProcessing) return;
    this.#jokerAvailable = false;
    this.#isProcessing = true;

    const jokerBtn = document.querySelector('#btn-joker');
    jokerBtn.disabled = true;
    jokerBtn.textContent = "👁️ Joker (0)";

    const hiddenCards = document.querySelectorAll('.card:not(.matched)');
    hiddenCards.forEach(c => this.#domManager.flipCard(c));

    setTimeout(() => {
      hiddenCards.forEach(c => {
        if (!this.#flippedCards.includes(c)) this.#domManager.unflipCard(c);
      });
      this.#isProcessing = false;
    }, 1000);
  }

  // Traitement du clic utilisateur sur une carte
  #handleCardClick(card) {
    this.#domManager.flipCard(card);
    this.#flippedCards.push(card);

    if (this.#flippedCards.length === 2) {
      const [card1, card2] = this.#flippedCards;

      if (card1.dataset.id === card2.dataset.id) {
        this.#pairsFound++;
        this.#flippedCards = [];
        this.#combo++;

        this.#soundPair.currentTime = 0;
        this.#soundPair.play().catch(err => console.warn("Audio bloqué :", err));

        if (this.#combo > this.#maxCombo) {
          this.#maxCombo = this.#combo;
        }

        if (this.#mode === "survie") this.#timeLeft += 3;

        document.querySelector('#combo-value').textContent = `x${this.#combo}`;
        if (this.#combo >= 2) document.querySelector('.combo-zone').classList.add('combo-bump');

        const msgElement = document.querySelector('#game-message');
        if (msgElement) {
          msgElement.textContent = "🔥 Bien joué ! Une paire !";
          msgElement.classList.remove('game-message-hidden');
          setTimeout(() => msgElement.classList.add('game-message-hidden'), 1500);
        }

        card1.classList.add('matched');
        card2.classList.add('matched');

        if (this.#pairsFound === this.#difficulty) this.endGame("victory");
      } else {
        this.#isProcessing = true;
        this.#combo = 0;

        if (this.#mode === "survie") {
          this.#timeLeft = Math.max(this.#timeLeft - 2, 0);
        }

        document.querySelector('#combo-value').textContent = "x0";
        document.querySelector('.combo-zone').classList.remove('combo-bump');

        setTimeout(() => {
          this.#domManager.unflipCard(card1);
          this.#domManager.unflipCard(card2);
          this.#flippedCards = [];
          this.#isProcessing = false;
          if (this.#timeLeft <= 0) this.endGame("timeout");
        }, 1000);
      }
    }
  }

  getLevel() { return this.#level; }
}