import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVNTrlvWQ0rYpvyp9Xr0S-887rr_KblbQ",
  authDomain: "prueba-ef20a.firebaseapp.com",
  projectId: "prueba-ef20a",
  storageBucket: "prueba-ef20a.firebasestorage.app",
  messagingSenderId: "57917606453",
  appId: "1:57917606453:web:d228806c1853b4171e7f7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lista = document.getElementById("lista");
const alerta = document.getElementById("alerta");
const buscador = document.getElementById("buscador");

let productosGlobal = [];

/* ➕ AGREGAR */
window.agregarProducto = async function () {

  const producto = document.getElementById("producto").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);

  if (!producto || !categoria || isNaN(cantidad)) return;

  await addDoc(collection(db, "stock"), {
    nombre: producto,
    categoria: categoria,
    cantidad: cantidad
  });

  document.getElementById("producto").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("cantidad").value = "";
};

/* 📡 REAL TIME */
onSnapshot(collection(db, "stock"), (snapshot) => {

  productosGlobal = [];

  snapshot.forEach((d) => {
    productosGlobal.push({ id: d.id, ...d.data() });
  });

  render(productosGlobal);
});

/* 🔎 BUSCADOR */
buscador.addEventListener("input", () => {

  const txt = buscador.value.toLowerCase();

  const filtrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(txt) ||
    p.categoria.toLowerCase().includes(txt)
  );

  render(filtrados);
});

/* 🖥️ RENDER */
function render(productos) {

  lista.innerHTML = "";

  let alertas = [];

  productos.forEach((p) => {

    if (p.cantidad <= 5) alertas.push(p.nombre);

    lista.innerHTML += `
      <div class="producto">

        <div>
          <strong>${p.nombre}</strong>
          <small>📂 ${p.categoria}</small>
          <small>📦 ${p.cantidad}</small>
        </div>

        <div class="acciones">

          <button onclick="sumar('${p.id}', ${p.cantidad})">➕</button>
          <button onclick="restar('${p.id}', ${p.cantidad})">➖</button>
          <button onclick="sumar10('${p.id}', ${p.cantidad})">+10</button>
          <button onclick="restar10('${p.id}', ${p.cantidad})">-10</button>
          <button onclick="eliminar('${p.id}')">❌</button>

        </div>

      </div>
    `;
  });

  if (alertas.length > 0) {
    alerta.classList.remove("oculto");
    alerta.innerHTML = "⚠ Stock bajo: " + alertas.join(", ");
  } else {
    alerta.classList.add("oculto");
  }
}

/* ❌ ELIMINAR */
window.eliminar = async function (id) {
  await deleteDoc(doc(db, "stock", id));
};

/* ➕➖ STOCK */
window.sumar = async (id, c) =>
  updateDoc(doc(db, "stock", id), { cantidad: c + 1 });

window.restar = async (id, c) => {
  if (c <= 0) return;
  updateDoc(doc(db, "stock", id), { cantidad: c - 1 });
};

window.sumar10 = async (id, c) =>
  updateDoc(doc(db, "stock", id), { cantidad: c + 10 });

window.restar10 = async (id, c) => {
  if (c <= 0) return;
  updateDoc(doc(db, "stock", id), { cantidad: c - 10 });
};

/* 📊 EXCEL */
window.exportarExcel = function () {

  const data = productosGlobal.map(p => ({
    Producto: p.nombre,
    Categoria: p.categoria,
    Cantidad: p.cantidad
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Stock");

  XLSX.writeFile(wb, "stock.xlsx");
};

/* 📝 WORD */
window.exportarWord = function () {

  let html = `
  <html>
  <body>
  <h2>Stock</h2>
  <table border="1" style="border-collapse:collapse;">
  <tr>
    <th>Producto</th>
    <th>Categoría</th>
    <th>Cantidad</th>
  </tr>
  `;

  productosGlobal.forEach(p => {
    html += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td>${p.cantidad}</td>
      </tr>
    `;
  });

  html += "</table></body></html>";

  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "stock.doc";
  a.click();
};
