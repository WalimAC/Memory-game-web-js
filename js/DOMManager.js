export class DOMManager {

  // Génère les cartes sur le plateau
  createCards(images) {
    const gameBoard = document.querySelector('.game-board');
    gameBoard.innerHTML = '';

    images.forEach((image, index) => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');

      cardElement.dataset.id = image.id;
      cardElement.dataset.index = index;
      cardElement.dataset.trueSrc = image.url;

      cardElement.innerHTML = `
        <div class="card-inner">
          <img class="card-img" src="assets/images/mask1.jpg" alt="Memory Card">
        </div>
      `;

      gameBoard.appendChild(cardElement);
    });
  }

  // Révèle une carte
  flipCard(cardElement) {
    cardElement.classList.add('flipped');
    const imgElement = cardElement.querySelector('.card-img');
    if (imgElement && cardElement.dataset.trueSrc) {
      imgElement.src = cardElement.dataset.trueSrc;
    }
  }

  // Masque une carte
  unflipCard(cardElement) {
    cardElement.classList.remove('flipped');
    const imgElement = cardElement.querySelector('.card-img');
    if (imgElement) {
      imgElement.src = "assets/images/mask1.jpg";
    }
  }
}