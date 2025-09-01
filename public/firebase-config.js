// Configuración global de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmmWdNz0bua_-cHeaaQ_Uhyl6IxPB3MZk",
  authDomain: "cal-aire.firebaseapp.com",
  databaseURL: "https://cal-aire-default-rtdb.firebaseio.com",
  projectId: "cal-aire",
  storageBucket: "cal-aire.firebasestorage.app",
  messagingSenderId: "251397262883",
  appId: "1:251397262883:web:5bb2049547fba7efb0eb96",
  measurementId: "G-RD7CP9P6VM"
};

// Inicializa Firebase una sola vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
} // Si ya está inicializado, usa la instancia existente
