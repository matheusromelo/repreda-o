// --- CONFIGURAÇÃO FIREBASE (COLE SUAS CHAVES REAIS DO CONSOLE AQUI) ---
const firebaseConfig = {
  apiKey: "AIzaSyBxm6ENo7qiMKPCLwsCBHKTH37Wov5CNLI",
  authDomain: "redacaorep.firebaseapp.com",
  projectId: "redacaorep",
  storageBucket: "redacaorep.firebasestorage.app",
  messagingSenderId: "959438351648",
  appId: "1:959438351648:web:e72096f67a7ea37257bb45",
  measurementId: "G-WCSMVK7V02"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let dados = [];
let filtroAtual = "Todos";
let indexAtual = null;
let userLogado = null;

// Elementos do DOM (Atalhos)
const listaEl = document.getElementById("lista");
const modalEl = document.getElementById("modal");

// Monitor de Autenticação
auth.onAuthStateChanged(user => {
    userLogado = user;
    const btnLogin = document.getElementById("btnLogin");
    const userStatus = document.getElementById("userStatus");
    if (user) {
        btnLogin.innerText = "Sair";
        userStatus.innerText = `Logado como: ${user.displayName}`;
        escutarDados();
    } else {
        btnLogin.innerText = "Login";
        userStatus.innerText = "Modo offline. Entre para sincronizar.";
        dados = JSON.parse(localStorage.getItem("reps")) || [];
        render();
    }
});

function handleAuth() {
    if (userLogado) auth.signOut();
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}

function escutarDados() {
    db.collection("repertorios").where("userId", "==", userLogado.uid)
      .onSnapshot(snap => {
          dados = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          render();
      });
}

async function salvar() {
    const t = document.getElementById("titulo");
    const c = document.getElementById("categoria");
    const u = document.getElementById("uso");
    const d = document.getElementById("descricao");

    if(!t.value || !d.value) return alert("Preencha o título e a descrição!");
    
    const novo = {
        titulo: t.value,
        categoria: c.value,
        uso: u.value,
        descricao: d.value,
        status: "medio",
        data: new Date().getTime()
    };

    if (userLogado) {
        novo.userId = userLogado.uid;
        await db.collection("repertorios").add(novo);
    } else {
        dados.push(novo);
        localStorage.setItem("reps", JSON.stringify(dados));
        render();
    }
    t.value = ""; u.value = ""; d.value = "";
}

async function setStatus(idx, tipo) {
    if (userLogado && dados[idx].id) {
        await db.collection("repertorios").doc(dados[idx].id).update({ status: tipo });
    } else {
        dados[idx].status = tipo;
        localStorage.setItem("reps", JSON.stringify(dados));
        render();
    }
}

async function deletar() {
    if(!confirm("Excluir definitivamente?")) return;
    if (userLogado && dados[indexAtual].id) {
        await db.collection("repertorios").doc(dados[indexAtual].id).delete();
    } else {
        dados.splice(indexAtual, 1);
        localStorage.setItem("reps", JSON.stringify(dados));
    }
    fechar();
    render();
}

function render() {
    const busca = document.getElementById("busca").value.toLowerCase();
    listaEl.innerHTML = "";
    dados.forEach((r, i) => {
        if(filtroAtual !== "Todos" && r.categoria !== filtroAtual) return;
        if(!r.titulo.toLowerCase().includes(busca)) return;
        listaEl.innerHTML += `
            <div class="card" onclick="abrir(${i})">
                <div class="status-dots">
                    <div class="dot red ${r.status==='fraco'?'active':''}" onclick="event.stopPropagation(); setStatus(${i},'fraco')"></div>
                    <div class="dot yellow ${r.status==='medio'?'active':''}" onclick="event.stopPropagation(); setStatus(${i},'medio')"></div>
                    <div class="dot green ${r.status==='forte'?'active':''}" onclick="event.stopPropagation(); setStatus(${i},'forte')"></div>
                </div>
                <h3 style="font-size: 17px;">${r.titulo}</h3>
                <p style="font-size: 13px; opacity: 0.7; margin-top: 5px;">${r.uso}</p>
            </div>`;
    });
}

function abrir(i) {
    indexAtual = i;
    const r = dados[i];
    document.getElementById("mTitulo").innerText = r.titulo;
    document.getElementById("mCategoria").innerText = r.categoria;
    document.getElementById("mUso").innerText = r.uso;
    document.getElementById("mDescricao").innerText = r.descricao;
    modalEl.style.display = "flex";
}

function fechar(e) { if(!e || e.target.id === "modal") modalEl.style.display = "none"; }
function toggleTema() { document.body.classList.toggle("dark"); }
function toggleMenu() { document.getElementById("sidebar").classList.toggle("collapsed"); }

function setFiltro(btn, cat) {
    document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtroAtual = cat;
    render();
}

render();