const money = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const VIAGENS = [
  { id: 1, origem: "Americana", destino: "Campinas", valor: 2400, placa: "RTA1A23", motorista: "José Silva" },
  { id: 2, origem: "Limeira", destino: "Santos", valor: 3800, placa: "QWE4B56", motorista: "Ana Costa" },
  { id: 3, origem: "Piracicaba", destino: "Jundiaí", valor: 1900, placa: "FGH7C89", motorista: "José Silva" },
];

const NOTAS = [
  { tipo: "CT-e", chave: "352608...", viagem: "Americana → Campinas", status: "não emitida" },
  { tipo: "MDF-e", chave: "352608...", viagem: "Americana → Campinas", status: "não emitida" },
];

const FROTAS = [
  { placa: "RTA1A23" },
  { placa: "QWE4B56" },
  { placa: "FGH7C89" },
];

const ui = { tela: "historico", periodo: "hoje", menu: false, viagemId: null, de: "", ate: "" };

function $(sel, el) { return (el || document).querySelector(sel); }

function periodBar() {
  const chips = [
    ["hoje", "Hoje"],
    ["semana", "Semana"],
    ["mes", "Mês"],
    ["periodo", "Período"],
  ]
    .map(([id, label]) => `<button type="button" class="chip ${ui.periodo === id ? "on" : ""}" data-periodo="${id}">${label}</button>`)
    .join("");
  const dates =
    ui.periodo === "periodo"
      ? `<div class="dates"><input id="de" type="date" value="${ui.de}" /><input id="ate" type="date" value="${ui.ate}" /></div>`
      : "";
  return `<div class="period">${chips}</div>${dates}`;
}

function menu() {
  const items = [
    ["historico", "Histórico"],
    ["viagens", "Viagens"],
    ["notas", "Notas"],
    ["financeiro", "Financeiro"],
    ["acerto", "Acerto"],
    ["frota", "Frota"],
  ];
  return `<nav class="nav ${ui.menu ? "open" : ""}">${items
    .map(([id, label]) => `<button type="button" class="${ui.tela === id || (ui.tela === "viagem" && id === "viagens") ? "on" : ""}" data-tela="${id}">${label}</button>`)
    .join("")}</nav>`;
}

function shell(name, body) {
  return `
    <header class="top">
      <button type="button" class="burger" id="menu" aria-label="Menu">☰</button>
      <div class="brand"><i></i>Tcargo</div>
      <div class="screen-name">${name}</div>
    </header>
    ${menu()}
    ${periodBar()}
    <p class="amostra">Amostra</p>
    <main class="main">${body}</main>
    <div class="toast" id="toast"></div>
  `;
}

function empty() {
  return `<p class="empty">Nada nesse período.</p>`;
}

function filtered() {
  if (ui.periodo === "periodo" && ui.de && ui.ate && ui.de > ui.ate) return [];
  return VIAGENS;
}

function historico() {
  const rows = filtered();
  if (!rows.length) return shell("Histórico", empty());
  const cobrado = rows.reduce((a, v) => a + v.valor, 0);
  const body = `
    <div class="nums">
      <div class="num"><strong>${rows.length}</strong><span>viagens</span></div>
      <div class="num"><strong>${money(cobrado)}</strong><span>cobrado</span></div>
      <div class="num"><strong>${money(2400)}</strong><span>caiu</span></div>
      <div class="num"><strong>${money(800)}</strong><span>deve</span></div>
    </div>
    <h1>Viagens</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Origem</th><th>Destino</th><th>Valor</th><th>Placa</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (v) =>
                `<tr class="tap" data-viagem="${v.id}"><td>${v.origem}</td><td>${v.destino}</td><td>${money(v.valor)}</td><td>${v.placa}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  return shell("Histórico", body);
}

function viagens() {
  const rows = filtered();
  if (!rows.length) return shell("Viagens", empty());
  const body = `
    <h1>Viagens</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Origem</th><th>Destino</th><th>Valor</th><th>Placa</th><th>Motorista</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (v) =>
                `<tr class="tap" data-viagem="${v.id}"><td>${v.origem}</td><td>${v.destino}</td><td>${money(v.valor)}</td><td>${v.placa}</td><td>${v.motorista}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  return shell("Viagens", body);
}

function viagem() {
  const v = VIAGENS.find((x) => x.id === ui.viagemId) || VIAGENS[0];
  const body = `
    <h1>Viagem</h1>
    <article class="card">
      <div class="field"><label>Origem</label><p>${v.origem}</p></div>
      <div class="field"><label>Destino</label><p>${v.destino}</p></div>
      <div class="field"><label>Valor</label><p>${money(v.valor)}</p></div>
      <div class="field"><label>Placa</label><p>${v.placa}</p></div>
      <div class="field"><label>Motorista</label><p>${v.motorista}</p></div>
    </article>
    <button type="button" class="btn" id="emitir">Emitir nota</button>
    <p class="note">Mock. Não emite.</p>
  `;
  return shell("Viagem", body);
}

function notas() {
  const body = `
    <h1>Notas</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Tipo</th><th>Viagem</th><th>Status</th></tr></thead>
        <tbody>
          ${NOTAS.map((n) => `<tr><td>${n.tipo}</td><td>${n.viagem}</td><td>${n.status}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <button type="button" class="btn" id="emitir">Emitir nota</button>
    <p class="note">Mock. Não emite. Sem portal.</p>
  `;
  return shell("Notas", body);
}

function financeiro() {
  const body = `
    <div class="nums">
      <div class="num"><strong>${money(8100)}</strong><span>cobrado</span></div>
      <div class="num"><strong>${money(2400)}</strong><span>caiu</span></div>
    </div>
    <h1>Financeiro</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Viagem</th><th>Cobrado</th><th>Caiu</th></tr></thead>
        <tbody>
          <tr><td>Americana → Campinas</td><td>${money(2400)}</td><td>${money(2400)}</td></tr>
          <tr><td>Limeira → Santos</td><td>${money(3800)}</td><td>${money(0)}</td></tr>
          <tr><td>Piracicaba → Jundiaí</td><td>${money(1900)}</td><td>${money(0)}</td></tr>
        </tbody>
      </table>
    </div>
  `;
  return shell("Financeiro", body);
}

function acerto() {
  const body = `
    <h1>Acerto</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Motorista</th><th>Viagens</th><th>Deve</th></tr></thead>
        <tbody>
          <tr><td>José Silva</td><td>2</td><td>${money(500)}</td></tr>
          <tr><td>Ana Costa</td><td>1</td><td>${money(300)}</td></tr>
        </tbody>
      </table>
    </div>
  `;
  return shell("Acerto", body);
}

function frota() {
  const body = `
    <h1>Frota</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Placa</th></tr></thead>
        <tbody>
          ${FROTAS.map((f) => `<tr><td>${f.placa}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="note">1 a 5 placas.</p>
  `;
  return shell("Frota", body);
}

function paint() {
  const root = document.getElementById("app");
  const view = {
    historico,
    viagens,
    viagem,
    notas,
    financeiro,
    acerto,
    frota,
  }[ui.tela];
  root.innerHTML = view();

  $("#menu").onclick = () => {
    ui.menu = !ui.menu;
    paint();
  };
  root.querySelectorAll("[data-tela]").forEach((btn) => {
    btn.onclick = () => {
      ui.tela = btn.dataset.tela;
      ui.menu = false;
      ui.viagemId = null;
      paint();
    };
  });
  root.querySelectorAll("[data-periodo]").forEach((btn) => {
    btn.onclick = () => {
      ui.periodo = btn.dataset.periodo;
      paint();
    };
  });
  $("#de") && ($("#de").onchange = (e) => { ui.de = e.target.value; paint(); });
  $("#ate") && ($("#ate").onchange = (e) => { ui.ate = e.target.value; paint(); });
  root.querySelectorAll("[data-viagem]").forEach((row) => {
    row.onclick = () => {
      ui.viagemId = Number(row.dataset.viagem);
      ui.tela = "viagem";
      ui.menu = false;
      paint();
    };
  });
  const emitir = $("#emitir");
  if (emitir) {
    emitir.onclick = () => {
      const t = $("#toast");
      t.textContent = "Não emitiu. Mock.";
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2200);
    };
  }
}

paint();
