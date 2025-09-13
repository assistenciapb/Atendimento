// Inicializa Firebase (configuração do seu projeto)
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
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');

// Evento submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        // Login com Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, senha);
        const uid = userCredential.user.uid;

        // Verifica perfil no Firestore
        const doc = await db.collection('usuarios').doc(uid).get();
        if (!doc.exists) {
            alert("Usuário sem perfil definido!");
            firebase.auth().signOut();
            return;
        }

        // Salva role no localStorage para controle de acesso nas páginas
        const role = doc.data().role;
        localStorage.setItem('userRole', role);

        // Redireciona para a página principal
        window.location.href = "site.html";

    } catch (err) {
        console.error(err);
        alert("Erro no login: " + err.message);
    }
});

// Logout automático se quiser (opcional)
// firebase.auth().signOut();
