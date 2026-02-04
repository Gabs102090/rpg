const display = document.getElementById("calc-display");
const buttons = document.querySelectorAll(".buttons button");

let currentInput = "";
let lastWasResult = false;

const updateDisplay = (value) => {
  display.textContent = value || "0";
};

const appendValue = (value) => {
  if (lastWasResult && /[0-9.]/.test(value)) {
    currentInput = "";
  }
  lastWasResult = false;
  currentInput += value;
  updateDisplay(currentInput);
};

const clearAll = () => {
  currentInput = "";
  lastWasResult = false;
  updateDisplay("0");
};

const backspace = () => {
  currentInput = currentInput.slice(0, -1);
  updateDisplay(currentInput);
};

const calculateResult = () => {
  if (!currentInput) {
    return;
  }
  const sanitized = currentInput.replace(/×/g, "*").replace(/÷/g, "/");
  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    currentInput = Number.isFinite(result) ? String(result) : "Erro";
  } catch (error) {
    currentInput = "Erro";
  }
  lastWasResult = true;
  updateDisplay(currentInput);
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const { action, value } = button.dataset;

    if (action === "clear") {
      clearAll();
      return;
    }

    if (action === "backspace") {
      backspace();
      return;
    }

    if (action === "equals") {
      calculateResult();
      return;
    }

    if (value) {
      appendValue(value);
    }
  });
});

const feedback = document.getElementById("game-feedback");
const attemptsLabel = document.getElementById("attempts");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const resetButton = document.getElementById("reset-game");

let secretNumber = 0;
let attempts = 0;

const startGame = () => {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  attempts = 0;
  attemptsLabel.textContent = "0";
  feedback.textContent = "Boa sorte! 🎯";
  guessInput.value = "";
  guessInput.focus();
};

const handleGuess = () => {
  const guess = Number(guessInput.value);
  if (!guess || guess < 1 || guess > 100) {
    feedback.textContent = "Digite um número válido entre 1 e 100.";
    return;
  }

  attempts += 1;
  attemptsLabel.textContent = String(attempts);

  if (guess === secretNumber) {
    feedback.textContent = `Você acertou em ${attempts} tentativa(s)! 🎉`;
    return;
  }

  feedback.textContent = guess < secretNumber ? "Está baixo! Tente um número maior." : "Está alto! Tente um número menor.";
};

startGame();

guessButton.addEventListener("click", handleGuess);
resetButton.addEventListener("click", startGame);

guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGuess();
  }
});
