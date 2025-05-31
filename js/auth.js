// js/auth.js
let auth;
let onAuthStateChangedCallback;

export function initAuth(app, callback) {
    auth = firebase.auth(app);
    onAuthStateChangedCallback = callback;
    auth.onAuthStateChanged(user => {
        onAuthStateChangedCallback(user);
    });
}

export function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .catch(error => {
            console.error("Erro no login com Google:", error);
            alert(`Erro no login: ${error.message}`);
        });
}

export function signOutUser() {
    return auth.signOut()
        .catch(error => {
            console.error("Erro no logout:", error);
            alert(`Erro no logout: ${error.message}`);
        });
}

export function getCurrentUser() {
    return auth.currentUser;
}