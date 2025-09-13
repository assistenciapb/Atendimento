// =======================
// Verificação de Login
// =======================
document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem('userRole');

    if(!role){
        alert("Você precisa fazer login!");
        window.location.href = "login.html";
        return;
    }

    // Mostra botões apenas para admin
    if(role === 'admin') {
        const btnCreas = document.getElementById('btnCreas');
        const btnPerfis = document.getElementById('btnPerfis');
        if(btnCreas) btnCreas.style.display = 'inline-block';
        if(btnPerfis) btnPerfis.style.display = 'inline-block';
    }
});

// Configuração Firebase
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

// Elementos do DOM
const form = document.getElementById('atendimentoForm');
const tabelaBody = document.querySelector('#tabelaAtendimentos tbody');
const filtroBtns = document.querySelectorAll('.filtro-btn');
const mesSelecionado = document.getElementById('mesSelecionado');
const btnImprimirMes = document.getElementById('btnImprimirMes');

const motivoSelect = document.getElementById('motivoSelect');
const motivoOutro = document.getElementById('motivoOutro');
const localAtendimento = document.getElementById('local');

let atendimentos = [];
let statusRealizado = JSON.parse(localStorage.getItem('statusRealizado')) || {};

// Pré-selecionar último local
const ultimoLocal = localStorage.getItem('ultimoLocal');
if(ultimoLocal) localAtendimento.value = ultimoLocal;

// Mostrar/ocultar campo "Outros"
motivoSelect.addEventListener('change', () => {
    if(motivoSelect.value === 'Outros'){
        motivoOutro.style.display = 'inline-block';
        motivoOutro.required = true;
    } else {
        motivoOutro.style.display = 'none';
        motivoOutro.required = false;
    }
});

// Salvar status local
function salvarStatus() {
    localStorage.setItem('statusRealizado', JSON.stringify(statusRealizado));
}

// Registrar atendimento
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const nis = document.getElementById('nis').value.trim();
    const local = localAtendimento.value;
    let motivo = motivoSelect.value;
    if(motivo === 'Outros') motivo = motivoOutro.value.trim();
    const data = new Date().toISOString();

    if(!nome || !motivo || !local) return alert('Nome, Local e Motivo são obrigatórios.');

    try {
        // Salvar atendimento geral
        const docRef = await db.collection('atendimentos_gerais').add({nome, cpf, nis, local, motivo, data});

        // Salvar último local
        localStorage.setItem('ultimoLocal', local);

        // Reset do formulário
        form.reset();
        motivoOutro.style.display = 'none';
        if(ultimoLocal) localAtendimento.value = ultimoLocal;

        // Criar ou atualizar perfil
        const perfilRef = db.collection('perfis').doc(cpf);
        const perfilDoc = await perfilRef.get();
        if(!perfilDoc.exists){
            await perfilRef.set({nome, cpf, atendimentos: []});
        }
        await perfilRef.update({
            atendimentos: firebase.firestore.FieldValue.arrayUnion({
                tipo: 'geral',
                local,
                motivo,
                data
            })
        });

        // Recarregar atendimentos
        carregarAtendimentos();

    } catch(err){
        console.error(err);
        alert("Erro ao registrar atendimento.");
    }
});

// Carregar atendimentos gerais
function carregarAtendimentos() {
    tabelaBody.innerHTML = '';
    db.collection('atendimentos_gerais').get()
      .then(snapshot => {
          atendimentos = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
          atendimentos.sort((a,b) => new Date(a.data) - new Date(b.data));
          aplicarFiltro('dia');
      })
      .catch(err => console.error(err));
}

// Filtros de data
function aplicarFiltro(tipo){
    let agora = new Date();
    let filtrados = [];
    if(tipo === 'dia'){
        filtrados = atendimentos.filter(a => new Date(a.data).toDateString() === agora.toDateString());
        mesSelecionado.style.display = 'none'; btnImprimirMes.style.display = 'none';
    } else if(tipo === 'semana'){
        let inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate() - agora.getDay());
        let fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate() + 6);
        filtrados = atendimentos.filter(a => {
            let d = new Date(a.data);
            return d >= inicioSemana && d <= fimSemana;
        });
        mesSelecionado.style.display = 'none'; btnImprimirMes.style.display = 'none';
    } else if(tipo === 'mes'){
        mesSelecionado.style.display = 'inline-block'; btnImprimirMes.style.display = 'inline-block';
        if(mesSelecionado.value){
            const [ano, mes] = mesSelecionado.value.split('-').map(Number);
            filtrados = atendimentos.filter(a => {
                let d = new Date(a.data);
                return d.getFullYear() === ano && (d.getMonth()+1) === mes;
            });
        } else filtrados = [];
    }
    atualizarTabela(filtrados);
}

// Atualizar tabela
function atualizarTabela(lista){
    tabelaBody.innerHTML = '';

    lista.forEach(a => {
        const tr = document.createElement('tr');

        // Status
        const statusTd = document.createElement('td');
        const statusBtn = document.createElement('span');
        statusBtn.className = 'status-btn';
        if(statusRealizado[a.id]) statusBtn.classList.add('realizado');
        statusBtn.addEventListener('click', () => {
            statusBtn.classList.toggle('realizado');
            statusRealizado[a.id] = statusBtn.classList.contains('realizado');
            salvarStatus();
        });
        statusTd.appendChild(statusBtn);
        tr.appendChild(statusTd);

        // Nome
        const nomeTd = document.createElement('td');
        nomeTd.textContent = a.nome;
        tr.appendChild(nomeTd);

        // CPF
        const cpfTd = document.createElement('td');
        cpfTd.textContent = a.cpf;
        tr.appendChild(cpfTd);

        // NIS
        const nisTd = document.createElement('td');
        nisTd.textContent = a.nis || '-';
        tr.appendChild(nisTd);

        // Local
        const localTd = document.createElement('td');
        localTd.textContent = a.local;
        tr.appendChild(localTd);

        // Motivo
        const motivoTd = document.createElement('td');
        motivoTd.textContent = a.motivo;
        tr.appendChild(motivoTd);

        // Data
        const dataTd = document.createElement('td');
        dataTd.textContent = new Date(a.data).toLocaleString();
        tr.appendChild(dataTd);

        // Ações
        const acoesTd = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Excluir';
        delBtn.className = 'acao-btn delete-btn';
        delBtn.addEventListener('click', async () => {
            await db.collection('atendimentos_gerais').doc(a.id).delete();
            const perfilRef = db.collection('perfis').doc(a.cpf);
            const perfilDoc = await perfilRef.get();
            if(perfilDoc.exists){
                const atendimentosPerfil = perfilDoc.data().atendimentos.filter(at => at.data !== a.data || at.motivo !== a.motivo);
                await perfilRef.update({atendimentos: atendimentosPerfil});
            }
            carregarAtendimentos();
        });
        acoesTd.appendChild(delBtn);
        tr.appendChild(acoesTd);

        tabelaBody.appendChild(tr);
    });
}


// Eventos de filtros
filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filtroBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        aplicarFiltro(btn.dataset.filtro);
    });
});

mesSelecionado.addEventListener('change', () => aplicarFiltro('mes'));

// Imprimir PDF do mês
btnImprimirMes.addEventListener('click', () => {
    const mesAno = mesSelecionado.value;
    if(!mesAno) return alert('Selecione o mês.');
    const [ano, mes] = mesAno.split('-').map(Number);
    const lista = atendimentos.filter(a => {
        const d = new Date(a.data);
        return d.getFullYear() === ano && (d.getMonth()+1) === mes;
    });
    if(lista.length === 0) return alert('Nenhum atendimento neste mês.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'landscape' });
    const dados = lista.map(a => [a.nome, a.cpf, a.nis, a.local, a.motivo, new Date(a.data).toLocaleString()]);
    doc.autoTable({ head:[['Nome','CPF','NIS','Local','Motivo','Data']], body:dados, startY:10 });
    doc.save(`Atendimentos_${mesAno}.pdf`);
});

// Logout
const btnLogout = document.getElementById('btnLogout');
btnLogout.addEventListener('click', () => {
    // Limpa o role do usuário
    localStorage.removeItem('userRole');
    // Redireciona para a página de login
    window.location.href = "index.html";
});

// Carregar atendimentos ao iniciar
carregarAtendimentos();
