(function verificarAcesso() {
    const role = localStorage.getItem('userRole');
    if(!role){
        alert("Você precisa fazer login!");
        window.location.href = "login.html";
    }
})();

const firebaseConfig = {
  apiKey: "AIzaSyDI5-NlhqEInMh4VYEg2zBjwWn8fmmBhjQ",
  authDomain: "agendamentos-348f3.firebaseapp.com",
  projectId: "agendamentos-348f3",
  storageBucket: "agendamentos-348f3.firebasestorage.app",
  messagingSenderId: "691316969145",
  appId: "1:691316969145:web:eff04404e65e384c70d568"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos DOM
const searchInput = document.getElementById('searchPerfil');
const perfisContainer = document.getElementById('perfisContainer');
const perfilModal = document.getElementById('perfilModal');
const closeModalBtn = document.getElementById('closeModal');
const linhaTempoContainer = document.getElementById('linhaTempo');

// Dashboard elementos
const dashboardContainer = document.getElementById('dashboardContainer');
const totalAtendimentosSpan = document.getElementById('totalAtendimentos');
const filtroPeriodoBtns = document.querySelectorAll('.filtro-periodo');
const ctxLocal = document.getElementById('graficoLocal').getContext('2d');
const ctxMotivo = document.getElementById('graficoMotivo').getContext('2d');

let perfis = [];
let filtroLocal = null;
let ordemCrescente = true;
let atendimentosGerais = [];
let chartLocal = null;
let chartMotivo = null;

// Locais fixos
const locais = ["Secretaria", "CRAS Poeirão", "CRAS Santa Maria", "CREAS"];

// Criar card de perfil
function criarCardPerfil(perfil) {
    const card = document.createElement('div');
    card.className = 'perfil-card';
    card.innerHTML = `<strong>${perfil.nome}</strong><br>CPF: ${perfil.cpf}`;
    card.addEventListener('click', () => abrirPerfil(perfil));
    perfisContainer.appendChild(card);
}

// Carregar perfis
async function carregarPerfis() {
    perfisContainer.innerHTML = '';
    try {
        const snapshot = await db.collection('perfis').get();
        perfis = snapshot.docs.map(doc => {
            const p = doc.data();
            if (!p.atendimentos) p.atendimentos = [];
            return p;
        });
        perfis.forEach(perfil => criarCardPerfil(perfil));
        atualizarDashboard();
    } catch (err) {
        console.error("Erro ao carregar perfis:", err);
    }
}

// Modal perfil
function abrirPerfil(perfil) {
    perfilModal.style.display = 'flex';
    filtroLocal = null;
    renderLinhaTempo(perfil);
}

// Fechar modal
closeModalBtn.addEventListener('click', () => perfilModal.style.display = 'none');

// Linha do tempo
function renderLinhaTempo(perfil) {
    linhaTempoContainer.innerHTML = '';

    // Botões de filtro por local
    const filtroContainer = document.createElement('div');
    locais.forEach(local => {
        const btn = document.createElement('button');
        btn.textContent = local;
        btn.className = filtroLocal === local ? 'active' : '';
        btn.addEventListener('click', () => {
            filtroLocal = filtroLocal === local ? null : local;
            renderLinhaTempo(perfil);
        });
        filtroContainer.appendChild(btn);
    });

    // Botão para alternar ordem
    const ordemBtn = document.createElement('button');
    ordemBtn.textContent = ordemCrescente ? 'Ordem: Crescente' : 'Ordem: Decrescente';
    ordemBtn.style.marginLeft = '10px';
    ordemBtn.addEventListener('click', () => {
        ordemCrescente = !ordemCrescente;
        renderLinhaTempo(perfil);
    });
    filtroContainer.appendChild(ordemBtn);

    linhaTempoContainer.appendChild(filtroContainer);

    // Filtrar atendimentos
    let atendimentos = [...perfil.atendimentos];
    if(filtroLocal) {
        atendimentos = atendimentos.filter(a => a.local === filtroLocal);
    }

    // Ordenar
    atendimentos.sort((a,b) => ordemCrescente ? new Date(a.data)-new Date(b.data) : new Date(b.data)-new Date(a.data));

    if(atendimentos.length === 0){
        const p = document.createElement('p');
        p.textContent = 'Nenhum atendimento registrado.';
        linhaTempoContainer.appendChild(p);
        return;
    }

    // Criar eventos
    atendimentos.forEach(a => {
        const evento = document.createElement('div');
        evento.className = 'evento';
        const legenda = a.local === 'CREAS' ? 'Diagnóstico' : 'Motivo';
        evento.innerHTML = `
            <span class="evento-data">${new Date(a.data).toLocaleString()}</span>
            <span class="evento-local">${a.local}</span>
            <span class="evento-motivo"><strong>${legenda}:</strong> ${a.motivo}</span>
        `;
        linhaTempoContainer.appendChild(evento);
    });
}

// Busca por nome/CPF
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    perfisContainer.innerHTML = '';
    perfis.filter(p => p.nome.toLowerCase().includes(query) || p.cpf.includes(query))
           .forEach(p => criarCardPerfil(p));
});

// Dashboard
function atualizarDashboard() {
    atendimentosGerais = [];
    perfis.forEach(p => atendimentosGerais.push(...p.atendimentos));

    const periodo = document.querySelector('.filtro-periodo.active')?.dataset.periodo || 'total';
    let filtrados = filtrarPorPeriodo(atendimentosGerais, periodo);

    // Total geral
    totalAtendimentosSpan.textContent = filtrados.length;

    // Quantidade por local
    const qtdPorLocal = locais.map(local => filtrados.filter(a => a.local===local).length);

    if(chartLocal) chartLocal.destroy();
    chartLocal = new Chart(ctxLocal, {
        type:'bar',
        data:{
            labels:locais,
            datasets:[{
                label:'Atendimentos por Local',
                data:qtdPorLocal,
                backgroundColor:['#2e5a86','#5dade2','#85c1e9','#1abc9c']
            }]
        },
        options:{
            responsive:true,
            plugins:{ legend:{ display:true } },
            scales:{ y:{ beginAtZero:true, precision:0 } }
        }
    });

    // Quantidade por motivo/diagnóstico
    const motivosMap = {};
    filtrados.forEach(a=>{
        let motivo = a.local==='CREAS' ? 'Diagnóstico' : a.motivo;
        motivosMap[motivo] = (motivosMap[motivo]||0)+1;
    });
    const motivosLabels = Object.keys(motivosMap);
    const motivosData = Object.values(motivosMap);

    if(chartMotivo) chartMotivo.destroy();
    chartMotivo = new Chart(ctxMotivo, {
        type:'bar',
        data:{
            labels:motivosLabels,
            datasets:[{
                label:'Atendimentos por Motivo',
                data:motivosData,
                backgroundColor:'#2e86c1'
            }]
        },
        options:{
            indexAxis:'y',
            responsive:true,
            plugins:{ legend:{ display:true } },
            scales:{ x:{ beginAtZero:true, precision:0 } }
        }
    });
}

// Filtrar período
function filtrarPorPeriodo(atendimentos, periodo){
    const agora = new Date();
    if(periodo==='dia') return atendimentos.filter(a => new Date(a.data).toDateString()===agora.toDateString());
    if(periodo==='semana'){
        const inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate()-agora.getDay());
        const fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate()+6);
        return atendimentos.filter(a=>{
            const d = new Date(a.data);
            return d>=inicioSemana && d<=fimSemana;
        });
    }
    if(periodo==='mes'){
        const mes = agora.getMonth()+1;
        const ano = agora.getFullYear();
        return atendimentos.filter(a=>{
            const d = new Date(a.data);
            return (d.getMonth()+1)===mes && d.getFullYear()===ano;
        });
    }
    return atendimentos; // total
}

// Filtro período
filtroPeriodoBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
        filtroPeriodoBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        atualizarDashboard();
    });
});

// Inicialização
carregarPerfis();
