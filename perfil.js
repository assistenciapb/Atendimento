// 🔥 Firebase
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

/* ---------------------------
   📌 Função para limpar CPF
---------------------------- */
function limparCpf(cpf) {
  return cpf.replace(/\D/g,'');
}

/* ---------------------------
   📌 Elementos do DOM
---------------------------- */
const perfisContainer = document.getElementById('perfisContainer');
const searchInput = document.getElementById('searchPerfil');
const perfilModal = document.getElementById('perfilModal');
const closeModalBtn = document.getElementById('closeModal');
const modalNome = document.getElementById('modalNome');
const modalCPF = document.getElementById('modalCPF');
const linhaTempo = document.getElementById('linhaTempo');

/* ---------------------------
   📌 Carregar perfis
---------------------------- */
async function carregarPerfis() {
  const snapshot = await db.collection('perfis').get();
  perfisContainer.innerHTML = '';
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'perfil-card';
    card.innerHTML = `
      <strong>${data.nome}</strong><br>${data.cpf}
      <br><button class="removerPerfilBtn" style="margin-top:6px; padding:4px 8px; font-size:12px; background:#c0392b; color:#fff; border:none; border-radius:4px; cursor:pointer;">Remover Perfil</button>
    `;
    
    // Abrir modal ao clicar no card (exceto no botão remover)
    card.addEventListener('click', (e) => {
      if(e.target.classList.contains('removerPerfilBtn')) return;
      abrirModalPerfil(data);
    });

    // Remover perfil
    card.querySelector('.removerPerfilBtn').addEventListener('click', async () => {
      if(confirm(`Deseja remover o perfil de ${data.nome}?`)){
        await db.collection('perfis').doc(data.cpf).delete();
        carregarPerfis();
      }
    });

    perfisContainer.appendChild(card);
  });
}

/* ---------------------------
   📌 Abrir modal de perfil
---------------------------- */
function abrirModalPerfil(perfil) {
  modalNome.textContent = perfil.nome;
  modalCPF.textContent = perfil.cpf;
  linhaTempo.innerHTML = '';

  if(perfil.atendimentos && perfil.atendimentos.length > 0){
    perfil.atendimentos
      .sort((a,b)=> new Date(b.data) - new Date(a.data))
      .forEach((atendimento, idx)=>{
        const evento = document.createElement('div');
        evento.className = 'evento';
        const dataFormat = new Date(atendimento.data).toLocaleString();
        evento.innerHTML = `
          <span class="evento-data">${dataFormat}</span>
          <span class="evento-local">Local: ${atendimento.local}</span>
          <span class="evento-motivo">Motivo: ${atendimento.motivo}</span>
          <button class="removerAtendimentoBtn" style="margin-top:6px; padding:4px 8px; font-size:12px; background:#c0392b; color:#fff; border:none; border-radius:4px; cursor:pointer;">Remover Atendimento</button>
        `;
        // Remover atendimento
        evento.querySelector('.removerAtendimentoBtn').addEventListener('click', async () => {
          if(confirm('Deseja remover este atendimento?')){
            await db.collection('perfis').doc(perfil.cpf).update({
              atendimentos: firebase.firestore.FieldValue.arrayRemove(atendimento)
            });
            abrirModalPerfil({...perfil, atendimentos: perfil.atendimentos.filter((_,i)=>i!==idx)});
            carregarPerfis();
          }
        });
        linhaTempo.appendChild(evento);
      });
  } else {
    linhaTempo.innerHTML = '<p>Sem atendimentos registrados.</p>';
  }

  perfilModal.style.display = 'flex';
}

/* ---------------------------
   📌 Fechar modal
---------------------------- */
closeModalBtn.addEventListener('click', ()=> perfilModal.style.display='none');
window.addEventListener('click', (e)=>{ if(e.target === perfilModal) perfilModal.style.display='none'; });

/* ---------------------------
   📌 Filtro de busca
---------------------------- */
searchInput.addEventListener('input', () => {
  const filtro = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll('.perfil-card');
  cards.forEach(card => {
    const nome = card.querySelector('strong').textContent.toLowerCase();
    const cpf = card.querySelector('strong').nextSibling.textContent.toLowerCase();
    if(nome.includes(filtro) || cpf.includes(filtro)){
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
});

/* ---------------------------
   📌 Dashboard de atendimentos
---------------------------- */
const totalAtendimentosElem = document.getElementById('totalAtendimentos');
const filtroBtns = document.querySelectorAll('.filtro-periodo');
let graficoLocal, graficoMotivo;

async function carregarDashboard(periodo='total') {
  const snapshot = await db.collection('perfis').get();
  let todosAtendimentos = [];
  snapshot.forEach(doc => {
    const perf = doc.data();
    if(perf.atendimentos) todosAtendimentos.push(...perf.atendimentos);
  });

  const agora = new Date();
  let atendimentosFiltrados = todosAtendimentos.filter(a=>{
    const data = new Date(a.data);
    if(periodo==='dia') return data.toDateString() === agora.toDateString();
    if(periodo==='semana') {
      const diff = (agora - data)/(1000*60*60*24);
      return diff <=7;
    }
    if(periodo==='mes') return data.getMonth() === agora.getMonth() && data.getFullYear()===agora.getFullYear();
    return true;
  });

  totalAtendimentosElem.textContent = atendimentosFiltrados.length;

  // Atendimentos por local
  const locaisCount = {};
  atendimentosFiltrados.forEach(a=>locaisCount[a.local] = (locaisCount[a.local]||0)+1);
  const labelsLocais = Object.keys(locaisCount);
  const dataLocais = Object.values(locaisCount);

  if(graficoLocal) graficoLocal.destroy();
  graficoLocal = new Chart(document.getElementById('graficoLocal'), {
    type: 'bar',
    data: { labels: labelsLocais, datasets:[{label:'Atendimentos', data:dataLocais, backgroundColor:'#2e5a86'}]},
    options: { responsive:true, plugins:{legend:{display:false}}, indexAxis:'y' }
  });

  // Atendimentos por motivo
  const motivoCount = {};
  atendimentosFiltrados.forEach(a=>motivoCount[a.motivo] = (motivoCount[a.motivo]||0)+1);
  const labelsMotivo = Object.keys(motivoCount);
  const dataMotivo = Object.values(motivoCount);

  if(graficoMotivo) graficoMotivo.destroy();
  graficoMotivo = new Chart(document.getElementById('graficoMotivo'), {
    type: 'bar',
    data: { labels: labelsMotivo, datasets:[{label:'Atendimentos', data:dataMotivo, backgroundColor:'#2e5a86'}]},
    options: { responsive:true, plugins:{legend:{display:false}}, indexAxis:'y' } // horizontal
  });
}

/* ---------------------------
   📌 Filtros de período
---------------------------- */
filtroBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filtroBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    carregarDashboard(btn.dataset.periodo);
  });
});

/* ---------------------------
   📌 Inicialização
---------------------------- */
carregarPerfis();
carregarDashboard(); 
