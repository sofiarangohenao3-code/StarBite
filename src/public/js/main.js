const homeView  = document.getElementById("home-view");
const chatView  = document.getElementById("chat-view");
const userInput = document.getElementById("user-input");
const chatBox   = document.getElementById("chat-box");

function switchToChatMode() {
  if (homeView) homeView.style.display = "none";
  if (chatView) chatView.style.display = "flex";
  setTimeout(() => { if (userInput) userInput.focus(); }, 50);
}

function switchToHomeMode() {
  if (chatView) chatView.style.display = "none";
  if (homeView) homeView.style.display = "flex";
}

async function sendMessage() {
  const message = (userInput && userInput.value || '').trim();
  if (!message) return;

  // Mostrar mensaje del usuario
  chatBox.innerHTML += `
    <div class="flex justify-end">
      <div class="bg-orange text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-[75%] shadow-md font-garet text-sm">
        ${message}
      </div>
    </div>`;

  if (userInput) userInput.value = '';
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });

  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div class="flex justify-start" id="${typingId}">
      <div class="bg-white text-gray-400 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 font-garet text-sm italic animate-pulse">
        StarBite AI está pensando...
      </div>
    </div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: message })
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const el = document.getElementById(typingId);
      if (el) el.remove();
      chatBox.innerHTML += `
        <div class="flex justify-start">
          <div class="bg-red-50 text-red-600 px-5 py-3 rounded-2xl rounded-tl-none border border-red-100 max-w-[75%] font-garet text-sm">
            Respuesta inesperada del servidor.
          </div>
        </div>`;
      return;
    }

    const el = document.getElementById(typingId);
    if (el) el.remove();

    if (!response.ok) {
      const serverErr = data?.error || data?.message || 'Error en el servidor';
      chatBox.innerHTML += `
        <div class="flex justify-start">
          <div class="bg-red-50 text-red-600 px-5 py-3 rounded-2xl rounded-tl-none border border-red-100 max-w-[75%] font-garet text-sm">
            ${serverErr}
          </div>
        </div>`;
    } else {
      const replyText = data.respuesta || data.reply || "No pude obtener una respuesta válida.";
      chatBox.innerHTML += `
        <div class="flex justify-start">
          <div class="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-[75%] font-garet text-sm leading-relaxed">
            ${replyText}
          </div>
        </div>`;
    }
  } catch (error) {
    const el = document.getElementById(typingId);
    if (el) el.remove();
    chatBox.innerHTML += `
      <div class="flex justify-start">
        <div class="bg-red-50 text-red-600 px-5 py-3 rounded-2xl rounded-tl-none border border-red-100 max-w-[75%] font-garet text-sm">
          Error al conectar con el servidor.
        </div>
      </div>`;
  }

  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
}

// Nav activo
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const page = link.getAttribute('data-page');
  if (currentFile.includes(page)) {
    link.classList.remove('text-grey');
    link.classList.add('text-orange');
  }
});