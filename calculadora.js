(function () {
  const OPS = "+−×÷";
  const fmt = n => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 10 });

  function avaliar(texto) {
    const bruto = texto.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".");
    const t = bruto.match(/\d+\.?\d*|\.\d+|[-+*/()%]/g);
    let i = 0;
    if (!t || t.join("") !== bruto) throw new Error("sintaxe");

    const expressao = () => {
      let v = termo();
      while (t[i] === "+" || t[i] === "-") {
        const o = t[i++];
        const r = termo();
        v = o === "+" ? v + r : v - r;
      }
      return v;
    };

    const termo = () => {
      let v = fator();
      while (t[i] === "*" || t[i] === "/") {
        const o = t[i++];
        const r = fator();
        if (o === "/" && r === 0) throw new Error("div0");
        v = o === "*" ? v * r : v / r;
      }
      return v;
    };

    const fator = () => {
      if (t[i] === "-") { i++; return -fator(); }
      if (t[i] === "+") { i++; return fator(); }
      let v;
      if (t[i] === "(") {
        i++;
        v = expressao();
        if (t[i] !== ")") throw new Error("sintaxe");
        i++;
      } else {
        if (t[i] === undefined || !/^[\d.]/.test(t[i])) throw new Error("sintaxe");
        v = parseFloat(t[i++]);
      }
      while (t[i] === "%") { i++; v /= 100; }
      return v;
    };

    const resultado = expressao();
    if (i < t.length) throw new Error("sintaxe");
    return parseFloat(resultado.toPrecision(12));
  }

  function iniciar(raiz) {
    if (raiz.dataset.pronta) return;
    raiz.dataset.pronta = "1";
    const elExpr = raiz.querySelector(".calc-expr");
    const elRes = raiz.querySelector(".calc-res");
    let expr = "";
    let fim = false;
    let timer = null;

    const abertos = () => (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
    const ultimo = () => expr.slice(-1);
    const fechamentos = () => ")".repeat(Math.max(0, abertos()));

    function previa() {
      if (!expr) return "0";
      try { return fmt(avaliar(expr + fechamentos())); } catch { return null; }
    }

    function ajustar() {
      elRes.style.fontSize = "";
      let tam = parseFloat(getComputedStyle(elRes).fontSize);
      while (elRes.scrollWidth > elRes.clientWidth && tam > 20) {
        tam -= 2;
        elRes.style.fontSize = tam + "px";
      }
    }

    function mostrar() {
      elExpr.textContent = expr;
      const p = previa();
      if (p !== null) {
        elRes.textContent = p;
        ajustar();
      }
    }

    function erro(msg) {
      clearTimeout(timer);
      elRes.textContent = msg;
      elRes.style.fontSize = "1.4rem";
      raiz.classList.remove("calc-erro");
      void raiz.offsetWidth;
      raiz.classList.add("calc-erro");
      timer = setTimeout(() => {
        elRes.style.fontSize = "";
        raiz.classList.remove("calc-erro");
        mostrar();
      }, 1100);
    }

    function igual() {
      if (!expr || OPS.includes(ultimo())) return;
      try {
        const completo = expr + fechamentos();
        const v = avaliar(completo);
        elExpr.textContent = completo + " =";
        elRes.textContent = fmt(v);
        ajustar();
        expr = /e/i.test(String(v)) ? "" : String(v).replace(".", ",");
        fim = true;
      } catch (e) {
        erro(e.message === "div0" ? "Divisão por zero" : "Conta inválida");
      }
    }

    function digitar(k) {
      if (k === "C") { expr = ""; fim = false; return mostrar(); }
      if (k === "⌫") { expr = expr.slice(0, -1); fim = false; return mostrar(); }
      if (k === "=") return igual();

      if (fim) {
        if (/[\d,(]/.test(k) || k === "()") expr = "";
        fim = false;
      }

      if (k === "()") k = abertos() > 0 && /[\d)%]/.test(ultimo()) ? ")" : "(";
      if (k === ")" && !(abertos() > 0 && /[\d)%]/.test(ultimo()))) return;

      if (OPS.includes(k)) {
        if (!expr || ultimo() === "(") {
          if (k !== "−") return;
        } else if (OPS.includes(ultimo())) {
          expr = expr.slice(0, -1);
        }
      }

      if (k === "%" && !/[\d)]/.test(ultimo())) return;

      if (k === ",") {
        if (expr.split(/[^\d,]/).pop().includes(",")) return;
        if (!/\d/.test(ultimo())) k = "0,";
      }

      if ((/\d/.test(k) || k === "(") && /[)%]/.test(ultimo())) expr += "×";
      if (k === "(" && /\d/.test(ultimo())) expr += "×";

      expr += k;
      mostrar();
    }

    function pulsar(k) {
      const alvo = k === "(" || k === ")" ? "()" : k;
      const botao = raiz.querySelector('[data-k="' + CSS.escape(alvo) + '"]');
      if (!botao) return;
      botao.classList.add("calc-press");
      setTimeout(() => botao.classList.remove("calc-press"), 110);
    }

    raiz.addEventListener("click", e => {
      const botao = e.target.closest("button[data-k]");
      if (botao) digitar(botao.dataset.k);
    });

    raiz.addEventListener("keydown", e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const mapa = { "-": "−", "*": "×", x: "×", X: "×", "/": "÷", ".": ",", Enter: "=", Backspace: "⌫", Escape: "C", Delete: "C", c: "C", C: "C" };
      const k = mapa[e.key] || e.key;
      if (!/^[\d+−×÷,()%=⌫C]$/.test(k)) return;
      e.preventDefault();
      pulsar(k);
      digitar(k);
    });

    mostrar();
  }

  const iniciarTodas = () => document.querySelectorAll("[data-calc]").forEach(iniciar);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciarTodas);
  else iniciarTodas();
})();
