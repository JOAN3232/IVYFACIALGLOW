document.addEventListener("DOMContentLoaded", () => {
  const quizModal = document.getElementById("quiz-modal");
  const quizContent = document.getElementById("quiz-content");
  const openQuizBtn = document.getElementById("open-quiz");
  const closeQuizBtn = document.getElementById("close-quiz");

  const quizData = [
    {
      question: "What best describes your skin type?",
      options: ["Dry", "Oily", "Combination", "Sensitive"],
    },
    {
      question: "What is your primary skincare goal?",
      options: ["Glow", "Acne Control", "Hydration", "Even Tone"],
    },
    {
      question: "How would you describe your current routine?",
      options: ["Minimal", "Simple", "Detailed", "None"],
    },
  ];

  let currentQuestion = 0;
  let answers = [];

  // OPEN MODAL
  openQuizBtn?.addEventListener("click", (e) => {
    e.preventDefault();

    quizModal.classList.remove("hidden");
    quizModal.classList.add("flex");

    currentQuestion = 0;
    answers = [];

    renderQuestion();
  });

  // CLOSE MODAL
  closeQuizBtn?.addEventListener("click", () => {
    quizModal.classList.add("hidden");
    quizModal.classList.remove("flex");
  });

  function renderQuestion() {
    const q = quizData[currentQuestion];

    quizContent.innerHTML = `
      <div class="text-center mb-6">
        <p class="text-xs tracking-[0.25em] uppercase text-[#b89b8c] mb-2">
          Skin Diagnostic
        </p>

        <h2 class="text-2xl md:text-3xl font-serif text-[#5a4632] mb-4">
          ${q.question}
        </h2>

        <div class="w-full bg-[#f3e7ea] h-1 rounded-full mb-6 overflow-hidden">
          <div class="h-1 bg-[#c79aa3] transition-all duration-300"
            style="width:${((currentQuestion + 1) / quizData.length) * 100}%">
          </div>
        </div>
      </div>

      <div class="grid gap-4">
        ${q.options
          .map(
            (opt) => `
          <button class="quiz-option border border-[#ead9dd] rounded-2xl py-4 px-5 text-left hover:bg-[#fff5f7] transition">
            ${opt}
          </button>
        `
          )
          .join("")}
      </div>

      <div class="flex justify-between mt-8">
        <button id="prevQ" class="px-5 py-2 border rounded-full text-sm">
          Back
        </button>

        <button id="nextQ" class="px-6 py-3 bg-[#c79aa3] text-white rounded-full text-sm">
          ${currentQuestion === quizData.length - 1 ? "Finish Ritual" : "Next"}
        </button>
      </div>
    `;

    // SELECT OPTION
    document.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[currentQuestion] = btn.textContent;

        document.querySelectorAll(".quiz-option").forEach((b) =>
          b.classList.remove("bg-[#fff0f3]", "border-[#c79aa3]")
        );

        btn.classList.add("bg-[#fff0f3]", "border-[#c79aa3]");
      });
    });

    // NEXT
    document.getElementById("nextQ").addEventListener("click", () => {
      if (!answers[currentQuestion]) return;

      if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        renderQuestion();
      } else {
        renderResult();
      }
    });

    // BACK
    document.getElementById("prevQ").addEventListener("click", () => {
      if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
      }
    });
  }

  // =========================
  // ROUTINE + PRODUCTS LOGIC
  // =========================
  function getResult(answers) {
  const skin = (answers[0] || "").trim().toLowerCase();
  const goal = (answers[1] || "").trim().toLowerCase();

  let result = {
    title: "",
    steps: [],
    products: [],
    extras: [],
  };

  // SKIN TYPES
  if (skin === "dry") {
    result.title = "Hydration Glow Ritual 💧";
    result.steps = [
      "Gentle Cream Cleanser",
      "Hydrating Toner",
      "Hyaluronic Acid Serum",
      "Rich Moisturizer",
    ];
    result.products = [
      { name: "CeraVe Hydrating Cleanser", step: "Cleanser" },
      { name: "Hada Labo Hydrating Lotion", step: "Toner" },
      { name: "The Ordinary Hyaluronic Acid", step: "Serum" },
      { name: "Nivea Soft Moisturizer", step: "Moisturizer" },
    ];
  }

  if (skin === "oily") {
    result.title = "Oil Control Balance Ritual 🌿";
    result.steps = [
      "Foaming Cleanser",
      "Niacinamide Serum",
      "Lightweight Moisturizer",
      "SPF Protection",
    ];
    result.products = [
      { name: "La Roche-Posay Effaclar Gel", step: "Cleanser" },
      { name: "The Ordinary Niacinamide 10%", step: "Serum" },
      { name: "Neutrogena Hydro Boost", step: "Moisturizer" },
      { name: "Biore UV SPF50", step: "SPF" },
    ];
  }

  if (skin === "combination") {
    result.title = "Balanced Skin Ritual ✨";
    result.steps = [
      "Gentle Gel Cleanser",
      "Balancing Toner",
      "Hydrating Serum",
      "Light Moisturizer",
    ];
    result.products = [
      { name: "CeraVe Foaming Cleanser", step: "Cleanser" },
      { name: "Klairs Supple Toner", step: "Toner" },
      { name: "Hyaluronic Acid Serum", step: "Serum" },
      { name: "Simple Light Moisturizer", step: "Moisturizer" },
    ];
  }

  if (skin === "sensitive") {
    result.title = "Calming Skin Ritual 🌸";
    result.steps = [
      "Fragrance-free Cleanser",
      "Soothing Toner",
      "Centella Serum",
      "Barrier Repair Cream",
    ];
    result.products = [
      { name: "Aveeno Calm Cleanser", step: "Cleanser" },
      { name: "Isntree Green Tea Toner", step: "Toner" },
      { name: "Skin1004 Centella Serum", step: "Serum" },
      { name: "Cicaplast Baume B5", step: "Moisturizer" },
    ];
  }

  // GOALS
  if (goal === "glow") result.extras.push("Vitamin C Serum (AM glow boost)");
  if (goal === "acne control") result.extras.push("Salicylic Acid Spot Treatment");
  if (goal === "even tone") result.extras.push("Niacinamide + SPF consistency");

  // fallback (VERY IMPORTANT)
  if (!result.products.length) {
    result.title = "Personalized Skin Ritual ✨";
    result.steps = ["Gentle Cleanser", "Moisturizer", "SPF"];
    result.products = [
      { name: "CeraVe Cleanser", step: "Cleanser" },
      { name: "Basic Moisturizer", step: "Moisturizer" },
      { name: "SPF 50 Sunscreen", step: "SPF" },
    ];
  }

  return result;
}

  // =========================
  // RESULT SCREEN
  // =========================
  function renderResult() {
    const result = getResult(answers);

    quizContent.innerHTML = `
      <div class="text-center mb-6">
        <h2 class="text-2xl md:text-3xl font-serif text-[#5a4632] mb-2">
          ${result.title}
        </h2>
        <p class="text-sm text-[#a88f82]">
          Your personalized skincare ritual + product match
        </p>
      </div>

      <div class="grid gap-3 mb-6">
        ${result.steps
          .map(
            (step, i) => `
          <div class="border rounded-xl p-3">
            <span class="text-[#c79aa3] font-medium">${i + 1}.</span>
            ${step}
          </div>
        `
          )
          .join("")}
      </div>

      <div class="mb-6">
        <h3 class="text-xs uppercase tracking-[0.25em] text-[#b89b8c] mb-3">
          Recommended Products
        </h3>

        <div class="grid gap-3">
          ${result.products
            .map(
              (p) => `
            <div class="border rounded-xl p-3 flex justify-between items-center">
              <div>
                <p class="font-medium text-[#5a4632]">${p.name}</p>
                <p class="text-xs text-[#a88f82]">${p.step}</p>
              </div>

              <button class="px-3 py-1 text-xs bg-[#c79aa3] text-white rounded-full">
                Add
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      ${
        result.extras.length
          ? `
        <div class="mb-6">
          <h3 class="text-xs uppercase tracking-[0.25em] text-[#b89b8c] mb-3">
            Boosters
          </h3>

          ${result.extras
            .map(
              (e) => `
            <div class="border rounded-xl p-3 mb-2">
              ✨ ${e}
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      <button id="restart"
        class="w-full mt-4 px-6 py-3 bg-[#c79aa3] text-white rounded-full">
        Retake Diagnostic
      </button>
    `;

    document.getElementById("restart").addEventListener("click", () => {
      currentQuestion = 0;
      answers = [];
      renderQuestion();
    });
  }
});
// Runs the homepage quiz and maps customer answers to recommended shop moods
// and product categories.
