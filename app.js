const app = document.getElementById("app");
let S = null, size = 140;

// Sustituye {correcto|incorrecto} según la versión (true = verdadera)
const sub = (t, v) => t.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a, b) => (v ? a : b));
const shuffle = a => { for (let i = a.length; i > 1;) { const j = Math.random() * i-- | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const show = html => { app.innerHTML = html; window.scrollTo(0, 0); };

function build(items) {
  return shuffle(items.slice()).map(([t, x, note]) => {
    const a = Math.random() < 0.5;
    return { t, x, note, q: sub(x, a), a, ok: sub(x, true), r: null };
  });
}

function home() {
  const n = Math.min(size, BANK.length);
  show(`<section class="home">
    <div class="stain" aria-hidden="true"><i>V</i><i>F</i></div>
    <h1>Biologia Cel·lular</h1>
    <p class="lead">Simulacro de verdadero o falso con el temario completo.</p>
    <div class="sizes" role="group" aria-label="Número de preguntas">
      ${[140, 50, 20].map(s => `<button data-s="${s}" class="${s === size ? "on" : ""}">${s}</button>`).join("")}
    </div>
    <button class="go" id="go">Empezar simulacro</button>
    <p class="note">Este simulacro tendrá ${n} preguntas · banco de ${BANK.length} afirmaciones, cada una sale verdadera o falsa al azar</p>
  </section>`);
  app.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { size = +b.dataset.s; home(); });
  document.getElementById("go").onclick = () => start(build(BANK).slice(0, size));
}

function start(qs) { S = { qs, i: 0 }; quiz(); }

function quiz() {
  const { qs, i } = S, q = qs[i], n = qs.length, last = i === n - 1;
  show(`<header class="top">
      <div class="bar"><i style="width:${(i + 1) / n * 100}%"></i></div>
      <div class="meta"><span>${i + 1} / ${n}</span><span class="chip">${q.t}</span><button class="link" id="end">Terminar</button></div>
    </header>
    <main class="card"><p class="stmt" lang="ca">${q.q}</p></main>
    <footer class="dock">
      <div class="vf">
        <button class="v ${q.r === true ? "on" : ""}" data-a="1">Verdadero</button>
        <button class="f ${q.r === false ? "on" : ""}" data-a="0">Falso</button>
      </div>
      <div class="nav"><button class="link" id="prev" ${i ? "" : "disabled"}>Anterior</button>
      <button class="link" id="next">${last ? "Terminar" : "Saltar"}</button></div>
    </footer>`);
  app.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
    q.r = b.dataset.a === "1";
    if (last) return quiz();
    setTimeout(() => { S.i++; quiz(); }, 200);
  });
  document.getElementById("prev").onclick = () => { S.i--; quiz(); };
  document.getElementById("next").onclick = () => last ? finish() : (S.i++, quiz());
  document.getElementById("end").onclick = finish;
}

function finish() {
  const blank = S.qs.filter(q => q.r === null).length;
  if (blank && !confirm(`Te quedan ${blank} preguntas sin responder. ¿Terminar igualmente?`)) return;
  results("all");
}

function results(filter) {
  const qs = S.qs, n = qs.length;
  const st = q => q.r === q.a ? "ok" : q.r === null ? "nr" : "ko";
  const ok = qs.filter(q => st(q) === "ok").length, ko = qs.filter(q => st(q) === "ko").length, nr = n - ok - ko;
  const pct = ok / n * 100;
  const label = { ok: "Acertada", ko: "Fallada", nr: "Sin responder" };
  const word = v => v === null ? "—" : v ? "Verdadero" : "Falso";
  const list = qs.map((q, i) => ({ q, i, s: st(q) }))
    .filter(o => filter === "all" || (filter === "ok" ? o.s === "ok" : o.s !== "ok"))
    .map(({ q, i, s }) => `<article class="rv ${s}">
      <p lang="ca">${i + 1}. ${q.q}</p>
      <small>${label[s]} · Tu respuesta: ${word(q.r)} · Correcta: ${word(q.a)}</small>
      ${s === "ok" ? "" : `<div class="exp" lang="ca"><b>${q.a ? "Era verdadera:" : "Era falsa. Lo correcto:"}</b> ${q.ok}${q.note ? `<em>${q.note}</em>` : ""}</div>`}
    </article>`).join("") || `<p class="note" style="margin-top:20px">No hay preguntas en este filtro.</p>`;
  show(`<section class="res">
    <div class="ring" style="--p:${pct}"><b>${(pct / 10).toFixed(1)}</b><small>sobre 10</small></div>
    <div class="stats"><div class="a"><b>${ok}</b><span>acertadas</span></div><div class="b"><b>${ko}</b><span>falladas</span></div><div><b>${nr}</b><span>en blanco</span></div></div>
    <div class="tabs">${[["all", "Todas"], ["bad", "Falladas"], ["ok", "Acertadas"]].map(([k, t]) => `<button data-f="${k}" class="${k === filter ? "on" : ""}">${t}</button>`).join("")}</div>
    ${list}
    <div class="acts">
      ${ko + nr ? `<button class="alt" id="redo">Repetir las ${ko + nr} no acertadas</button>` : ""}
      <button class="go" id="new">Nuevo simulacro</button>
    </div>
  </section>`);
  app.querySelectorAll("[data-f]").forEach(b => b.onclick = () => results(b.dataset.f));
  document.getElementById("new").onclick = home;
  const redo = document.getElementById("redo");
  if (redo) redo.onclick = () => start(qs.filter(q => st(q) !== "ok").map(q => ({ ...q, r: null })));
}

home();
