// 🔒 Verificação de acesso
(function verificarAcesso() {
    const role = localStorage.getItem('userRole');
    if(!role){
        alert("Você precisa fazer login!");
        window.location.href = "login.html";
    }
})();

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
    return cpf.replace(/\D/g,''); // remove tudo que não for número
}

/* ---------------------------
   📌 Registro de Atendimento
---------------------------- */
const formCreas = document.getElementById('creasForm');
formCreas.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const cpf = limparCpf(document.getElementById('cpf').value);
    const diagnostico = document.getElementById('diagnostico').value.trim();
    const data = new Date().toISOString();
    const atendimento = { nome, cpf, local:"CREAS", motivo:diagnostico, data };
    if(!nome || !cpf || !diagnostico) return alert("Todos os campos são obrigatórios.");
    try{
        await db.collection('creas').add(atendimento);
        await db.collection('atendimentos').add(atendimento);
        formCreas.reset();
        alert("Atendimento registrado com sucesso!");
    }catch(err){ console.error(err); alert("Erro ao registrar atendimento."); }
});

/* ---------------------------
   📌 Perfis CREAS
---------------------------- */
const novoPerfilBtn = document.getElementById('novoPerfilBtn');
const perfilModal = document.getElementById('perfilModal');
const closeModal = document.getElementById('closeModal');
const perfilForm = document.getElementById('perfilForm');
const perfisContainer = document.getElementById('perfisContainer');

novoPerfilBtn.onclick = () => {
    perfilModal.style.display = 'block';
    document.getElementById('modalTitle').textContent = "Novo Perfil CREAS";
    perfilForm.reset();
};

closeModal.onclick = () => perfilModal.style.display = 'none';

/* ---------------------------
   📌 Fechar modais clicando fora
---------------------------- */
window.onclick = (e) => {
    if(e.target == perfilModal) perfilModal.style.display = 'none';
    if(e.target == modalAtendimentos) modalAtendimentos.style.display = 'none';
};

/* Mostrar/ocultar campo de substância psicoativa */
document.getElementById('perfilSPA').onchange = function() {
    document.getElementById('perfilSubstancia').style.display = this.value==="Sim"?"block":"none";
};

/* Salvar perfil */
perfilForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = {
        nome: document.getElementById('perfilNome').value.trim(),
        sexo: document.getElementById('perfilSexo').value,
        grupo: document.getElementById('perfilGrupo').value,
        nascimento: document.getElementById('perfilNascimento').value,
        agenteSaude: document.getElementById('perfilAgente').value.trim(),
        cpf: limparCpf(document.getElementById('perfilCpf').value),
        nis: document.getElementById('perfilNis').value.trim(),
        endereco: document.getElementById('perfilEndereco').value.trim(),
        escolaridade: document.getElementById('perfilEscolaridade').value.trim(),
        tipoResidencia: document.getElementById('perfilResidencia').value.trim(),
        tipoAuxilio: document.getElementById('perfilAuxilio').value,
        cartaoSUS: document.getElementById('perfilSus').value.trim(),
        usuarioSPA: document.getElementById('perfilSPA').value,
        substanciaSPA: document.getElementById('perfilSubstancia').value.trim(),
        telefone: document.getElementById('perfilTelefone').value.trim(),
        composicaoFamiliar: document.getElementById('perfilFamilia').value.trim()
    };
    try{
        await db.collection('perfisCreas').doc(data.cpf).set(data);
        perfilModal.style.display='none';
        carregarPerfis();
    }catch(err){ console.error(err); alert("Erro ao salvar perfil."); }
});

/* ---------------------------
   📌 Carregar perfis
---------------------------- */
async function carregarPerfis(){
    const snapshot = await db.collection('perfisCreas').get();
    perfisContainer.innerHTML="";
    snapshot.forEach(doc=>{
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'perfil-card';
        card.innerHTML = `<strong>${data.nome}</strong><br>${data.cpf}`;
        card.onclick = ()=> expandirPerfil(data);
        perfisContainer.appendChild(card);
    });
}

/* ---------------------------
   📌 Expandir perfil
---------------------------- */
let cpfExpandidoAtual = ""; // guarda CPF do perfil expandido

const perfilExpandido = document.getElementById('perfilExpandido');
const expandidoConteudo = document.getElementById('expandidoConteudo');
const closeExpandido = document.getElementById('closeExpandido');
const editarPerfilBtn = document.getElementById('editarPerfilBtn');
const consultarAtendimentosBtn = document.getElementById('consultarAtendimentosBtn');
const modalAtendimentos = document.getElementById('modalAtendimentos');
const listaAtendimentos = document.getElementById('listaAtendimentos');
const cpfAtendimentoSpan = document.getElementById('cpfAtendimento');

closeExpandido.onclick = ()=> perfilExpandido.style.display='none';

// Expandir perfil e configurar botões
function expandirPerfil(data){
    cpfExpandidoAtual = data.cpf;
    expandidoConteudo.innerHTML=`
        <p><strong>Nome:</strong> ${data.nome}</p>
        <p><strong>Sexo:</strong> ${data.sexo}</p>
        <p><strong>Grupo Social:</strong> ${data.grupo}</p>
        <p><strong>Data de Nascimento:</strong> ${data.nascimento}</p>
        <p><strong>Agente de Saúde:</strong> ${data.agenteSaude}</p>
        <p><strong>CPF:</strong> ${data.cpf}</p>
        <p><strong>NIS:</strong> ${data.nis}</p>
        <p><strong>Endereço:</strong> ${data.endereco}</p>
        <p><strong>Escolaridade:</strong> ${data.escolaridade}</p>
        <p><strong>Tipo de Residência:</strong> ${data.tipoResidencia}</p>
        <p><strong>Tipo de Auxílio:</strong> ${data.tipoAuxilio}</p>
        <p><strong>Cartão do SUS:</strong> ${data.cartaoSUS}</p>
        <p><strong>Usuário de SPA:</strong> ${data.usuarioSPA}</p>
        <p><strong>Substância:</strong> ${data.substanciaSPA}</p>
        <p><strong>Telefone:</strong> ${data.telefone}</p>
        <p><strong>Composição Familiar:</strong> ${data.composicaoFamiliar}</p>`;
    perfilExpandido.style.display='block';

    // Editar perfil
    editarPerfilBtn.onclick = ()=>{
        perfilModal.style.display='block';
        document.getElementById('modalTitle').textContent = "Editar Perfil CREAS";
        perfilModal.style.zIndex = 2500; // garante frente
        for(const key in data){
            const el = document.getElementById('perfil'+key.charAt(0).toUpperCase()+key.slice(1));
            if(el) el.value = data[key];
        }
        document.getElementById('perfilSubstancia').style.display = data.usuarioSPA==="Sim"?"block":"none";
    };

    // Consultar atendimentos CREAS
    consultarAtendimentosBtn.onclick = async ()=>{
        modalAtendimentos.style.display='block';
        modalAtendimentos.style.zIndex = 2400; // frente do expandido
        const cpf = limparCpf(cpfExpandidoAtual);
        cpfAtendimentoSpan.textContent = cpf;
        listaAtendimentos.innerHTML = "<p>Carregando...</p>";

        try{
            const snapshot = await db.collection('atendimentos')
                                     .where('cpf','==',cpf)
                                     .where('local','==','CREAS')
                                     .get();

            if(snapshot.empty){
                listaAtendimentos.innerHTML = "<p>Nenhum atendimento no CREAS encontrado.</p>";
                return;
            }

            const atendimentos = snapshot.docs.map(d=>d.data())
                                             .sort((a,b)=> new Date(b.data) - new Date(a.data));

            listaAtendimentos.innerHTML = "";
            atendimentos.forEach(at=>{
                const card = document.createElement('div');
                card.style.background="#f5f5f5";
                card.style.padding="10px";
                card.style.marginBottom="10px";
                card.style.borderRadius="8px";
                card.innerHTML = `<strong>Local:</strong> ${at.local}<br>
                                  <strong>Motivo/Diagnóstico:</strong> ${at.motivo}<br>
                                  <strong>Data:</strong> ${new Date(at.data).toLocaleString()}`;
                listaAtendimentos.appendChild(card);
            });
        }catch(err){
            console.error(err);
            listaAtendimentos.innerHTML="<p>Erro ao carregar atendimentos do CREAS.</p>";
        }
    };
}

/* ---------------------------
   📌 Buscar perfis em tempo real
---------------------------- */
document.getElementById('buscarCpf').addEventListener('input', async (e)=>{
    const filtro = limparCpf(e.target.value.trim());
    const snapshot = await db.collection('perfisCreas').get();
    perfisContainer.innerHTML="";
    snapshot.forEach(doc=>{
        const data = doc.data();
        if(data.cpf.includes(filtro)) {
            const card = document.createElement('div');
            card.className = 'perfil-card';
            card.innerHTML = `<strong>${data.nome}</strong><br>${data.cpf}`;
            card.onclick = ()=> expandirPerfil(data);
            perfisContainer.appendChild(card);
        }
    });
});

/* ---------------------------
   🔄 Inicializa carregamento
---------------------------- */
carregarPerfis();
