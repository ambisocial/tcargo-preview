const ui = { tela: "historico", periodo: "semana", tab: "cte", mais: false };

function $(sel, el) { return (el || document).querySelector(sel); }

function periodBox() {
  return `<div class="period">
    <div style="flex:1">
      <label>Período</label>
      <select id="periodo">
        <option value="hoje" ${ui.periodo === "hoje" ? "selected" : ""}>Hoje</option>
        <option value="semana" ${ui.periodo === "semana" ? "selected" : ""}>18 ago — 23 ago</option>
        <option value="mes" ${ui.periodo === "mes" ? "selected" : ""}>Mês</option>
      </select>
    </div>
  </div>`;
}

function stamp() {
  return `<div class="stamp">AMOSTRA</div>`;
}

function shell(title, inner, opts) {
  const back = opts && opts.back ? `<button type="button" class="back" id="voltar">‹</button>` : `<span class="word"><b>T</b>cargo</span>`;
  return `
    <div class="app">
      <header class="head">${back}<h1>${title}</h1></header>
      ${opts && opts.tabs ? opts.tabs : ""}
      ${periodBox()}
      <main class="main">${inner}${stamp()}</main>
      <nav class="nav">
        <button type="button" class="${ui.tela === "historico" ? "on" : ""}" data-tela="historico"><span class="ico">◷</span>Histórico</button>
        <button type="button" class="${ui.tela === "viagem" || ui.tela === "viagens" ? "on" : ""}" data-tela="viagens"><span class="ico">⛟</span>Viagens</button>
        <button type="button" class="${ui.tela === "notas" ? "on" : ""}" data-tela="notas"><span class="ico">▤</span>Notas</button>
        <button type="button" class="${ui.tela === "financeiro" ? "on" : ""}" data-tela="financeiro"><span class="ico">$</span>Financeiro</button>
        <button type="button" class="${ui.tela === "acerto" || ui.tela === "frota" ? "on" : ""}" id="mais"><span class="ico">•••</span>Mais</button>
      </nav>
      <div class="sheet ${ui.mais ? "open" : ""}" id="sheet">
        <div class="sheet-in">
          <button type="button" data-tela="acerto">Acerto</button>
          <button type="button" data-tela="frota">Frota</button>
          <button type="button" id="fecha-mais">Fechar</button>
        </div>
      </div>
    </div>`;
}

function amostraRows(n, cols) {
  return Array.from({ length: n }, () => `<tr>${cols.map(() => "<td>AMOSTRA</td>").join("")}</tr>`).join("");
}

function historico() {
  const inner = `
    <div class="nums">
      <div class="num"><span>Viagens</span><strong>—</strong></div>
      <div class="num"><span>Cobrado</span><strong>—</strong></div>
      <div class="num"><span>Caiu</span><strong>—</strong></div>
      <div class="num"><span>Deve</span><strong>—</strong></div>
    </div>
    <h2 style="margin-top:16px">Viagens</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Origem</th><th>Destino</th><th>Valor</th><th>Placa</th></tr></thead>
        <tbody>${amostraRows(3, [1, 1, 1, 1])}</tbody>
      </table>
    </div>`;
  return shell("Histórico", inner);
}

function viagens() {
  const inner = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Origem</th><th>Destino</th><th>Valor</th><th>Placa</th><th>Motorista</th></tr></thead>
        <tbody>
          <tr class="tap" data-abrir-viagem="1"><td>AMOSTRA</td><td>AMOSTRA</td><td>—</td><td>AMOSTRA</td><td>AMOSTRA</td></tr>
          <tr class="tap" data-abrir-viagem="1"><td>AMOSTRA</td><td>AMOSTRA</td><td>—</td><td>AMOSTRA</td><td>AMOSTRA</td></tr>
        </tbody>
      </table>
    </div>`;
  return shell("Viagens", inner);
}

function viagem() {
  const inner = `
    <div class="fields">
      <div class="field"><label>Origem</label><p>AMOSTRA</p></div>
      <div class="field"><label>Destino</label><p>AMOSTRA</p></div>
      <div class="field"><label>Valor</label><p>—</p></div>
      <div class="field"><label>Placa</label><p>AMOSTRA</p></div>
      <div class="field"><label>Motorista</label><p>AMOSTRA</p></div>
    </div>
    <button type="button" class="cta" id="emitir">Emitir nota</button>
    <p class="note">Não emite. Amostra.</p>
    <div class="toast" id="toast">Não emitiu. Amostra.</div>`;
  return shell("Viagem", inner, { back: true });
}

function notas() {
  const tabs = `<div class="tabs">
    <button type="button" class="${ui.tab === "cte" ? "on" : ""}" data-tab="cte">CT-e</button>
    <button type="button" class="${ui.tab === "mdfe" ? "on" : ""}" data-tab="mdfe">MDF-e</button>
  </div>`;
  const inner = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Número</th><th>Placa</th><th>Tipo</th><th>Situação</th></tr></thead>
        <tbody>${amostraRows(4, [1, 1, 1, 1])}</tbody>
      </table>
    </div>
    <button type="button" class="cta" id="emitir">Emitir nota</button>
    <p class="note">Não emite. Sem portal. Amostra.</p>
    <div class="toast" id="toast">Não emitiu. Amostra.</div>`;
  return shell("Notas", inner, { tabs });
}

function financeiro() {
  const inner = `
    <div class="nums">
      <div class="num"><span>Cobrado</span><strong>—</strong></div>
      <div class="num"><span>Caiu</span><strong>—</strong></div>
    </div>
    <h2 style="margin-top:16px">Movimento</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Viagem</th><th>Cobrado</th><th>Caiu</th></tr></thead>
        <tbody>${amostraRows(3, [1, 1, 1])}</tbody>
      </table>
    </div>`;
  return shell("Financeiro", inner);
}

function acerto() {
  const inner = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Motorista</th><th>Viagens</th><th>Deve</th></tr></thead>
        <tbody>${amostraRows(2, [1, 1, 1])}</tbody>
      </table>
    </div>`;
  return shell("Acerto", inner);
}

function frota() {
  const inner = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Placa</th><th>Tipo</th><th>Situação</th></tr></thead>
        <tbody>${amostraRows(3, [1, 1, 1])}</tbody>
      </table>
    </div>
    <p class="note">1 a 5 placas. Amostra.</p>`;
  return shell("Frota", inner);
}

function paint() {
  const root = document.getElementById("app");
  const view = { historico, viagens, viagem, notas, financeiro, acerto, frota }[ui.tela];
  root.innerHTML = view();

  $("#periodo").onchange = (e) => { ui.periodo = e.target.value; paint(); };
  root.querySelectorAll("[data-tela]").forEach((b) => {
    b.onclick = () => { ui.tela = b.dataset.tela; ui.mais = false; paint(); };
  });
  $("#mais") && ($("#mais").onclick = () => { ui.mais = !ui.mais; paint(); });
  $("#fecha-mais") && ($("#fecha-mais").onclick = () => { ui.mais = false; paint(); });
  $("#voltar") && ($("#voltar").onclick = () => { ui.tela = "viagens"; paint(); });
  root.querySelectorAll("[data-abrir-viagem]").forEach((row) => {
    row.onclick = () => { ui.tela = "viagem"; paint(); };
  });
  root.querySelectorAll("[data-tab]").forEach((b) => {
    b.onclick = () => { ui.tab = b.dataset.tab; paint(); });
  });
  const emitir = $("#emitir");
  if (emitir) {
    emitir.onclick = () => {
      const t = $("#toast");
      if (t) t.classList.add("show");
    };
  }
}

paint();
