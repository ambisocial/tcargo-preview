const BASE = "/tcargo";

const $ = (sel, el = document) => el.querySelector(sel);

const money = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: "same-origin" });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { erro: text || "Falha de rede." };
  }
  if (!res.ok) {
    const err = new Error(data?.erro || "Algo deu errado.");
    err.status = res.status;
    throw err;
  }
  return data;
}

const ui = {
  tela: "landing",
  periodo: "hoje",
  de: "",
  ate: "",
  viagemId: null,
};

function qs() {
  const p = new URLSearchParams({ periodo: ui.periodo });
  if (ui.periodo === "periodo") {
    if (ui.de) p.set("de", ui.de);
    if (ui.ate) p.set("ate", ui.ate);
  }
  return `?${p.toString()}`;
}

function landing() {
  return `
    <div class="wrap">
      <div class="brand"><i></i> Tcargo</div>
      <section class="hero">
        <h1>Sábado você sabe se a semana pagou.</h1>
        <p>qualquer período. Viagem, nota, acerto, dinheiro. Uma fatura.</p>
        <p class="not">Não: CIOT, armazém, EDI, SPED, outro sistema.</p>
        <button class="cta" id="abrir">Abrir o Tcargo</button>
      </section>
    </div>
  `;
}

function periodBar() {
  const chips = [
    ["hoje", "Hoje"],
    ["semana", "Semana"],
    ["mes", "Mês"],
    ["periodo", "Período"],
  ]
    .map(
      ([id, label]) =>
        `<button type="button" class="chip-btn ${ui.periodo === id ? "on" : ""}" data-periodo="${id}">${label}</button>`,
    )
    .join("");
  const range =
    ui.periodo === "periodo"
      ? `<div class="row" style="margin-top:10px">
           <div class="field"><label for="de">De</label><input id="de" type="date" value="${ui.de}" /></div>
           <div class="field"><label for="ate">Até</label><input id="ate" type="date" value="${ui.ate}" /></div>
         </div>`
      : "";
  return `<div class="chips">${chips}</div>${range}`;
}

function historicoScreen(data) {
  const lista = data.viagens.length
    ? data.viagens.map(viagemCard).join("")
    : `<p class="empty">Nada nesse período.</p>`;
  return `
    <div class="wrap wrap-app">
      <div class="top">
        <div class="brand"><i></i> Tcargo</div>
        <button class="linkish" id="voltar-landing">Início</button>
      </div>
      <h1 class="page">Histórico</h1>
      ${periodBar()}
      <div class="nums">
        <div class="num"><strong>${data.numeros.viagens}</strong><span>viagens</span></div>
        <div class="num"><strong>${money(data.numeros.cobrado)}</strong><span>cobrado</span></div>
        <div class="num"><strong>${money(data.numeros.caiu)}</strong><span>caiu</span></div>
        <div class="num"><strong>${money(data.numeros.deve_pro_motorista)}</strong><span>deve pro motorista</span></div>
      </div>
      <h2>Viagens</h2>
      ${lista}
    </div>
  `;
}

function viagemCard(v) {
  return `
    <button type="button" class="card carga tap" data-abrir-viagem="${v.id}">
      <div class="route">${escapeHtml(v.origem)} → ${escapeHtml(v.destino)}</div>
      <div class="meta">
        ${money(v.valor)} · ${escapeHtml(v.placa)}
        ${v.amostra ? `<span class="badge">amostra</span>` : ""}
      </div>
    </button>
  `;
}

function detalheScreen(v) {
  return `
    <div class="wrap wrap-app">
      <div class="top">
        <button class="linkish" id="voltar-historico">Histórico</button>
        <div class="brand"><i></i> Tcargo</div>
      </div>
      <h1 class="page">Viagem</h1>
      ${v.amostra ? `<p class="badge">amostra</p>` : ""}
      <article class="card carga">
        <div class="field"><label>Origem</label><p class="readonly">${escapeHtml(v.origem)}</p></div>
        <div class="field"><label>Destino</label><p class="readonly">${escapeHtml(v.destino)}</p></div>
        <div class="field"><label>Valor</label><p class="readonly">${money(v.valor)}</p></div>
        <div class="field"><label>Placa</label><p class="readonly">${escapeHtml(v.placa)}</p></div>
      </article>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const root = document.getElementById("app");

function bindPeriod() {
  root.querySelectorAll("[data-periodo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ui.periodo = btn.dataset.periodo;
      paint();
    });
  });
  $("#de")?.addEventListener("change", (ev) => {
    ui.de = ev.target.value;
    paint();
  });
  $("#ate")?.addEventListener("change", (ev) => {
    ui.ate = ev.target.value;
    paint();
  });
}

async function paint() {
  if (ui.tela === "landing") {
    root.innerHTML = landing();
    $("#abrir").addEventListener("click", () => {
      ui.tela = "historico";
      paint();
    });
    return;
  }

  if (ui.tela === "viagem") {
    const v = await api(`/api/viagens/${ui.viagemId}`);
    root.innerHTML = detalheScreen(v);
    $("#voltar-historico").addEventListener("click", () => {
      ui.tela = "historico";
      ui.viagemId = null;
      paint();
    });
    return;
  }

  const data = await api(`/api/historico${qs()}`);
  root.innerHTML = historicoScreen(data);
  $("#voltar-landing").addEventListener("click", () => {
    ui.tela = "landing";
    paint();
  });
  bindPeriod();
  root.querySelectorAll("[data-abrir-viagem]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ui.viagemId = Number(btn.dataset.abrirViagem);
      ui.tela = "viagem";
      paint();
    });
  });
}

paint().catch((err) => {
  root.innerHTML = `<div class="wrap"><p class="err">${escapeHtml(err.message)}</p></div>`;
});
