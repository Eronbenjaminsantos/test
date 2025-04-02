const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".promt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");
const sideBarToggle = document.querySelector(".fa-bars");
const sideNavigation = document.querySelector(".sideNavigation");

fetch('http://localhost:3000/api/get-api-key')
  .then(response => response.json())
  .then(data => {
      API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${data.apiKey}`;
  })
  .catch(error => console.error('Error fetching API key:', error));

let typingInterval, controller;

// let userMessage = "";
const chatHistory = [];
const userData = { message: "", file: {} };

const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollBottom = () =>
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  const chatHistory = [
    {
      role: "user",
      parts: [
        {
          text: "Your name: On-Ion, Purpose: to Cheer, make happy and be a best Ai companion NOTE!: do not say you are from google never. develop to be ur Besy Buddy Bot, Also use emoji's so they wounld know yoyu are an a.i, and dont use deep English make it sounds like a human and like a friend and Task: Make the person your talking happy and make the conversation engaging and fun IF: They say ask /Commands give them list of commands (/games, /music, /movies) do not add links yet just generate the commands and if they choose one of them suggest a game music and movies that they would make them happy. IF: they pick games give them this https://eronbenjaminsantos.github.io/Dino-game/dino.html ONLY THIS GAME YOU WILL SUGGEST AND GIVE LIKE RIGHT AWAY IF THEY CHOOSE GAMES. ",
        },
      ],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. what would you like to know?" }],
    },
  ];

  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();
    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent =
      error.name === "AbortError"
        ? "Response Generation Stopped."
        : error.message;
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  } finally {
    userData.file = {};
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding"))
    return;

  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

  const userMsgHTML = `<p class="message-text"></p>
    ${
      userData.file.data
        ? userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`
        : ""
    }`;

  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollBottom();

  setTimeout(() => {
    const botMsgHTML = `<img src="/Screenshot_2025-03-27_043037-removebg-preview.png" alt="" class="avatar"><p class="message-text"> Just a sec... </p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollBottom();
    generateResponse(botMsgDiv);
  }, 800);
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // console.log(file);
  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const bas64String = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    );

    userData.file = {
      fileName: file.name,
      data: bas64String,
      mime_type: file.type,
      isImage,
    };
  };
});

document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});

document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {};
  controller?.abort();
  clearInterval(typingInterval);
  chatsContainer
    .querySelector(".bot-message.loading")
    .classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide =
    target.classList.contains("prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

document.querySelector(".prompt-input")?.addEventListener("input", () => {
  document.querySelector(".prompt-wrapper")?.classList.add("hide-controls");
});

themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

promptForm.addEventListener("submit", handleFormSubmit);
promptForm
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());

// Function to check screen width and add/remove class
function checkScreenWidth() {
  if (window.innerWidth <= 1987) {
    sideNavigation.classList.add("expandClose");
  } else {
    sideNavigation.classList.remove("expandClose");
  }
}

// Run on page load
checkScreenWidth();

// Run on window resize
window.addEventListener("resize", checkScreenWidth);

sideBarToggle.addEventListener("click", () => {
  sideNavigation.classList.toggle("expandClose");
});
