(function verificarAcesso() {
    const role = localStorage.getItem('userRole');
    if(!role){
        alert("Você precisa fazer login!");
        window.location.href = "login.html"; // redireciona antes de inicializar Firebase
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

// Elementos do formulário
const formCreas = document.getElementById('creasForm');
const nomeInput = document.getElementById('nome');
const cpfInput = document.getElementById('cpf');
const diagnosticoInput = document.getElementById('diagnostico');

const statusRealizado = JSON.parse(localStorage.getItem('statusRealizado')) || {};

// Registrar atendimento do CREAS
formCreas.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const cpf = cpfInput.value.trim();
    const diagnostico = diagnosticoInput.value.trim();
    const local = "CREAS"; // Local fixo para CREAS
    const data = new Date().toISOString();

    if(!nome || !cpf || !diagnostico) return alert("Nome, CPF e Diagnóstico são obrigatórios.");

    const atendimento = {
        nome,
        cpf,
        local,
        motivo: diagnostico, // armazenamos diagnóstico como motivo para histórico
        data
    };

    try {
        // 1️⃣ Registrar na coleção CREAS (opcional)
        await db.collection('creas').add(atendimento);

        // 2️⃣ Registrar no histórico geral (coleção atendimentos)
        await db.collection('atendimentos').add(atendimento);

        // 3️⃣ Registrar no perfil
        const perfilRef = db.collection('perfis').doc(cpf);
        const perfilSnap = await perfilRef.get();

        if(perfilSnap.exists){
            await perfilRef.update({
                atendimentos: firebase.firestore.FieldValue.arrayUnion(atendimento)
            });
        } else {
            await perfilRef.set({
                nome,
                cpf,
                atendimentos: [atendimento]
            });
        }

        // Resetar formulário
        formCreas.reset();
        alert("Atendimento registrado com sucesso!");
    } catch(err) {
        console.error(err);
        alert("Erro ao registrar atendimento.");
    }
});
