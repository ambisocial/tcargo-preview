const $ = (sel, el = document) => el.querySelector(sel);
const STATUS = ["aberta", "na rua", "emitida", "não emitida", "recebida"];
const money = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PREVIEW = /github\.io$/.test(location.hostname) || location.protocol === "file:";

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem("tcargo-preview") || "null");
  } catch {
    return null;
  }
}

function saveStore(s) {
  localStorage.setItem("tcargo-preview", JSON.stringify(s));
}

function seedStore() {
  const s = loadStore() || {
    auth: false,
    frota: [{ id: "p1", placa: "ABC1D23" }],
    cargas: [],
    dia: { cobrado: 0, recebido: 0, fechado: false },
    seq: 1,
  };
  saveStore(s);
  return s;
}

function numeros(s) {
  const hoje = s.cargas;
  return {
    cargas_do_dia: hoje.length,
    caminhoes_na_rua: hoje.filter((c) => c.status === "na rua").length,
    o_que_ja_caiu: Number(s.dia.recebido || 0),
  };
}

function previewApi(path, opts = {}) {
  const s = seedStore();
  const method = (opts.method || "GET").toUpperCase();
  const body = opts.body || {};

  if (path === "/api/me") return { autenticado: s.auth };
  if (path === "/api/login" && method === "POST") {
    s.auth = true;
    saveStore(s);
    return { ok: true };
  }
  if (path === "/api/logout" && method === "POST") {
    s.auth = false;
    saveStore(s);
    return { ok: true };
  }
  if (path === "/api/dia") {
    s.dia.cobrado = s.cargas.reduce((a, c) => a + Number(c.valor || 0), 0);
    saveStore(s);
    return {
      homologacao: true,
      numeros: numeros(s),
      frota: s.frota,
      cargas: s.cargas,
      dia: s.dia,
    };
  }
  if (path === "/api/cargas" && method === "POST") {
    const id = "c" + s.seq++;
    s.cargas.unshift({
      id,
      origem: body.origem,
      destino: body.destino,
      valor: Number(String(body.valor).replace(",", ".")),
      status: body.status || "aberta",
      placa: body.placa || "",
      cte_xml: "",
      cte_erro: "",
    });
    saveStore(s);
    return { ok: true };
  }
  if (path.endsWith("/emitir") && method === "POST") {
    const id = path.split("/")[3];
    const c = s.cargas.find((x) => x.id === id);
    if (!c) {
      const err = new Error("Carga não encontrada.");
      err.status = 404;
      throw err;
    }
    c.status = "não emitida";
    c.cte_erro = "Preview. Sem emissor. No Hostinger a nota volta aqui.";
    c.cte_xml = "";
    saveStore(s);
    const err = new Error(c.cte_erro);
    err.status = 422;
    throw err;
  }
  if (path === "/api/frota" && method === "POST") {
    const placa = String(body.placa || "").toUpperCase().replace(/\s/g, "");
    if (!placa) throw new Error("Placa vazia.");
    if (s.frota.length >= 5) throw new Error("No máximo 5 placas.");
    s.frota.push({ id: "p" + s.seq++, placa });
    saveStore(s);
    return { ok: true };
  }
  if (path.startsWith("/api/frota/") && method === "DELETE") {
    const id = path.split("/")[3];
    s.frota = s.frota.filter((f) => f.id !== id);
    saveStore(s);
    return { ok: true };
  }
  if (path === "/api/dia/fechar" && method === "POST") {
    s.dia.recebido = Number(String(body.recebido || 0).replace(",", "."));
    s.dia.fechado = true;
    saveStore(s);
    return { ok: true };
  }
  throw new Error("Rota não existe no preview.");
}

async function api(path, opts = {}) {
  if (PREVIEW) return previewApi(path, opts);
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { erro: text || "Falha de rede." };
  }
  if (!res.ok) {
    const err = new Error(data?.erro || "Algo deu errado.");
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function landing(state) {
  return `
    <div class="wrap">
      <div class="brand"><i></i> Tcargo</div>
      <section class="hero">
        <h1>Carga, placa, nota, dinheiro.</h1>
        <p>sábado você sabe se a semana pagou.</p>
        <button class="cta" id="abrir">Abrir o Tcargo</button>
        <div class="price">R$ 197 / mês. Uma fatura.</div>
      </section>
      <form id="login" class="card ${state.showLogin ? "" : "hidden"}">
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" name="email" type="email" autocomplete="username" />
        </div>
        <div class="field">
          <label for="senha">Senha</label>
          <input id="senha" name="senha" type="password" autocomplete="current-password" />
        </div>
        <button class="cta" type="submit">Entrar</button>
        <p class="err" id="login-erro"></p>
      </form>
    </div>
  `;
}

function appScreen(dia) {
  const frotaOpts = dia.frota.map((f) => `<option value="${f.placa}">${f.placa}</option>`).join("");
  const statusOpts = STATUS.map((s) => `<option value="${s}">${s}</option>`).join("");
  const cargas = dia.cargas.length
    ? dia.cargas.map(cargaCard).join("")
    : `<p class="price">Nenhuma carga hoje.</p>`;
  const chips = dia.frota.length
    ? dia.frota
        .map(
          (f) =>
            `<span class="chip">${f.placa}<button type="button" data-del-placa="${f.id}" aria-label="Tirar placa">×</button></span>`,
        )
        .join("")
    : `<p class="price">Cadastre até 5 placas.</p>`;

  return `
    <div class="wrap">
      <div class="top">
        <div class="brand"><i></i> Tcargo</div>
        <button class="linkish" id="sair">Sair</button>
      </div>
      <div class="banner">Preview — sem nota fiscal. Hostinger é o ar de produto.</div>
      <div class="nums">
        <div class="num"><strong>${dia.numeros.cargas_do_dia}</strong><span>cargas do dia</span></div>
        <div class="num"><strong>${dia.numeros.caminhoes_na_rua}</strong><span>caminhões na rua</span></div>
        <div class="num"><strong>${money(dia.numeros.o_que_ja_caiu)}</strong><span>o que já caiu</span></div>
      </div>
      <h2>Nova carga</h2>
      <form id="nova" class="card">
        <div class="row">
          <div class="field"><label for="origem">Origem</label><input id="origem" name="origem" placeholder="Campinas/SP" required /></div>
          <div class="field"><label for="destino">Destino</label><input id="destino" name="destino" placeholder="Santos/SP" required /></div>
        </div>
        <div class="row">
          <div class="field"><label for="valor">Valor</label><input id="valor" name="valor" inputmode="decimal" placeholder="2400" required /></div>
          <div class="field"><label for="status">Status</label><select id="status" name="status">${statusOpts}</select></div>
        </div>
        <div class="field">
          <label for="placa">Placa</label>
          <select id="placa" name="placa"><option value="">sem placa</option>${frotaOpts}</select>
        </div>
        <button class="btn orange full" type="submit">Salvar carga</button>
        <p class="err" id="carga-erro"></p>
      </form>
      <h2>Cargas</h2>
      ${cargas}
      <h2>Frota · 1 a 5 placas</h2>
      <form id="frota" class="card">
        <div class="chips">${chips}</div>
        ${
          dia.frota.length < 5
            ? `<div class="field" style="margin-top:14px"><label for="nova-placa">Nova placa</label><input id="nova-placa" name="placa" maxlength="8" placeholder="ABC1D23" /></div><button class="btn full" type="submit">Incluir placa</button>`
            : ""
        }
        <p class="err" id="frota-erro"></p>
      </form>
      <h2>Fechar o dia</h2>
      <form id="fechar" class="card">
        <p class="meta">Cobrado hoje: <strong>${money(dia.dia.cobrado)}</strong></p>
        <div class="field"><label for="recebido">Recebido</label><input id="recebido" name="recebido" inputmode="decimal" value="${dia.dia.recebido || ""}" /></div>
        <button class="btn orange full" type="submit">${dia.dia.fechado ? "Atualizar fechamento" : "Fechar o dia"}</button>
        <p class="okmsg">${dia.dia.fechado ? "Dia fechado." : ""}</p>
        <p class="err" id="dia-erro"></p>
      </form>
    </div>
  `;
}

function cargaCard(c) {
  const fail = c.status === "não emitida";
  return `
    <article class="card carga">
      <div class="route">${escapeHtml(c.origem)} → ${escapeHtml(c.destino)}</div>
      <div class="meta">
        ${money(c.valor)}
        ${c.placa ? ` · ${escapeHtml(c.placa)}` : ""}
        · <span class="badge ${fail ? "fail" : ""}">${escapeHtml(c.status)}</span>
      </div>
      <div class="actions">
        <button class="btn orange" data-emitir="${c.id}">Emitir</button>
      </div>
      ${c.cte_erro && fail ? `<p class="err">${escapeHtml(c.cte_erro)}</p>` : ""}
    </article>
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
const ui = { showLogin: false };

async function paint() {
  const me = await api("/api/me");
  if (!me.autenticado) {
    root.innerHTML = landing(ui);
    $("#abrir")?.addEventListener("click", async () => {
      if (PREVIEW) {
        await api("/api/login", { method: "POST", body: {} });
        await paint();
        return;
      }
      ui.showLogin = true;
      paint();
    });
    $("#login")?.addEventListener("submit", onLogin);
    return;
  }
  const dia = await api("/api/dia");
  root.innerHTML = appScreen(dia);
  $("#sair").addEventListener("click", onSair);
  $("#nova").addEventListener("submit", onNova);
  $("#frota")?.addEventListener("submit", onFrota);
  $("#fechar").addEventListener("submit", onFechar);
  root.querySelectorAll("[data-emitir]").forEach((btn) => {
    btn.addEventListener("click", () => onEmitir(btn));
  });
  root.querySelectorAll("[data-del-placa]").forEach((btn) => {
    btn.addEventListener("click", () => onDelPlaca(btn.dataset.delPlaca));
  });
}

async function onLogin(ev) {
  ev.preventDefault();
  const erro = $("#login-erro");
  erro.textContent = "";
  try {
    await api("/api/login", {
      method: "POST",
      body: { email: $("#email").value, senha: $("#senha").value },
    });
    await paint();
  } catch (e) {
    erro.textContent = e.message;
  }
}

async function onSair() {
  await api("/api/logout", { method: "POST" });
  ui.showLogin = false;
  await paint();
}

async function onNova(ev) {
  ev.preventDefault();
  const erro = $("#carga-erro");
  erro.textContent = "";
  try {
    await api("/api/cargas", {
      method: "POST",
      body: {
        origem: $("#origem").value,
        destino: $("#destino").value,
        valor: $("#valor").value,
        status: $("#status").value,
        placa: $("#placa").value,
      },
    });
    await paint();
  } catch (e) {
    erro.textContent = e.message;
  }
}

async function onEmitir(btn) {
  btn.disabled = true;
  btn.textContent = "Emitindo…";
  try {
    await api(`/api/cargas/${btn.dataset.emitir}/emitir`, { method: "POST" });
  } catch (e) {
    if (e.status !== 422) alert(e.message);
  }
  await paint();
}

async function onFrota(ev) {
  ev.preventDefault();
  const erro = $("#frota-erro");
  erro.textContent = "";
  try {
    await api("/api/frota", { method: "POST", body: { placa: $("#nova-placa").value } });
    await paint();
  } catch (e) {
    erro.textContent = e.message;
  }
}

async function onDelPlaca(id) {
  await api(`/api/frota/${id}`, { method: "DELETE" });
  await paint();
}

async function onFechar(ev) {
  ev.preventDefault();
  const erro = $("#dia-erro");
  erro.textContent = "";
  try {
    await api("/api/dia/fechar", { method: "POST", body: { recebido: $("#recebido").value } });
    await paint();
  } catch (e) {
    erro.textContent = e.message;
  }
}

paint().catch((err) => {
  root.innerHTML = `<div class="wrap"><p class="err">${escapeHtml(err.message)}</p></div>`;
});
