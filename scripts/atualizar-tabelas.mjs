// Atualiza simulador-salario/tabelas.json com as tabelas de retenção na fonte de IRS
// (trabalho dependente, continente) publicadas no pacote npm "salario-pt".
// Não executa código do pacote: só lê os CSV das tabelas e o texto de constants.js.
// Valida cada tabela antes de gravar e termina com erro se algo não bater certo,
// para que um ficheiro estranho nunca chegue à app.
import {execFileSync} from "node:child_process";
import {mkdtempSync, readFileSync, writeFileSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";

const DESTINO = join(dirname(fileURLToPath(import.meta.url)), "..", "simulador-salario", "tabelas.json");
const PACOTE = "salario-pt";
const DESDE_MINIMO = "2026-01-01";  // períodos anteriores não interessam à app
const TIPOS = {I: "SOLCAS2", II: "SOLD", III: "CAS1", IV: "SOLCAS2+DEF", V: "SOLD+DEF", VI: "CAS2D+DEF", VII: "CAS1+DEF"};

function descarregarPacote() {
  const dir = mkdtempSync(join(tmpdir(), "tabelas-"));
  const tgz = execFileSync("npm", ["pack", `${PACOTE}@latest`, "--silent", "--pack-destination", dir], {encoding: "utf8"}).trim().split("\n").pop();
  execFileSync("tar", ["xzf", join(dir, tgz), "-C", dir]);
  return join(dir, "package");
}

const num = s => parseFloat(String(s).replace("%", "").replace(",", "."));

function lerTabelas(csv) {
  const [cab, ...linhas] = csv.trim().split(/\r?\n/).map(l => l.split(";"));
  const col = Object.fromEntries(cab.map((c, i) => [c.trim(), i]));
  const porTipo = {};
  for (const l of linhas) {
    const v = k => l[col[k]].trim();
    const parcela = v("parcela_abater").includes("%")
      ? [num(v("parcela_abater")) / 100, num(v("var1")), num(v("var2"))]
      : num(v("parcela_abater"));
    (porTipo[v("tipo")] ??= []).push([
      v("sinal") === "min" ? null : num(v("limite")),
      Math.round(num(v("maximo")) * 100) / 10000,
      parcela,
      num(v("adicional")),
    ]);
  }
  const tabelas = {};
  for (const [nome, tipo] of Object.entries(TIPOS)) {
    if (!porTipo[tipo]) throw new Error(`falta a tabela ${nome} (${tipo})`);
    tabelas[nome] = porTipo[tipo];
  }
  return tabelas;
}

// Retenção antes de dependentes, para validar a continuidade entre escalões.
function retencao(linha, R) {
  const [, taxa, p] = linha;
  return R * taxa - (Array.isArray(p) ? p[0] * p[1] * (p[2] - R) : p);
}

function validar(id, tabelas) {
  for (const [nome, linhas] of Object.entries(tabelas)) {
    const erro = m => { throw new Error(`período ${id}, tabela ${nome}: ${m}`); };
    if (linhas.length < 4) erro("tem poucos escalões");
    if (linhas[0][1] !== 0) erro("o 1.º escalão devia ter taxa 0%");
    if (linhas.at(-1)[0] !== null) erro("o último escalão devia ser sem limite");
    linhas.forEach(([lim, taxa, , dep], i) => {
      if (!(taxa >= 0 && taxa < 0.6)) erro(`taxa inválida no escalão ${i + 1}`);
      if (!(dep >= 0 && dep < 200)) erro(`parcela por dependente inválida no escalão ${i + 1}`);
      if (i < linhas.length - 1 && !(lim > 0)) erro(`limite inválido no escalão ${i + 1}`);
      if (i > 0 && lim !== null && !(lim > linhas[i - 1][0])) erro(`limites fora de ordem no escalão ${i + 1}`);
    });
    for (let i = 0; i < linhas.length - 1; i++) {
      const L = linhas[i][0], a = retencao(linhas[i], L), b = retencao(linhas[i + 1], L);
      if (Math.abs(a - b) > 0.6) erro(`salto de ${(b - a).toFixed(2)} € no limite ${L} €`);
    }
  }
}

// Parâmetros anuais (IAS, subsídio de alimentação isento, IRS Jovem) lidos do texto de constants.js.
function lerParametros(texto, id) {
  const bloco = texto.match(new RegExp(`'${id}':\\s*(\\w+|\\{[^}]*\\})`));
  if (!bloco) return null;
  let corpo = bloco[1];
  if (!corpo.startsWith("{")) {  // ex.: '2024_03': CONSTANTS_2024
    const m = texto.match(new RegExp(`const ${corpo}\\s*=\\s*(\\{[^}]*\\})`));
    if (!m) return null;
    corpo = m[1];
  }
  const sa = corpo.match(/mealAllowanceLimits\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  const jv = corpo.match(/irsJovem:\s*(\w+)/);
  if (!sa || !jv) return null;
  const def = texto.match(new RegExp(`const ${jv[1]}\\s*=\\s*irsJovem\\(\\s*([\\d.]+)\\s*,\\s*\\[([^\\]]+)\\]\\s*,\\s*(?:Array\\((\\d+)\\)\\.fill\\(([\\d.]+)\\)|\\[([^\\]]+)\\])`));
  if (!def) return null;
  const isencao = def[2].split(",").map(Number);
  const tetos = def[5] ? def[5].split(",").map(Number) : Array(+def[3]).fill(+def[4]);
  if (isencao.some(isNaN) || tetos.some(isNaN) || isencao.length !== tetos.length) return null;
  const p = {ias: +def[1], saDinheiro: +sa[1], saCartao: Math.round(+sa[1] * +sa[2] * 100) / 100, jovemIsencao: isencao, jovemTetoIas: tetos};
  if (!(p.ias > 400 && p.ias < 1500 && p.saDinheiro > 3 && p.saDinheiro < 20)) return null;
  return p;
}

const pkg = descarregarPacote();
const manifesto = JSON.parse(readFileSync(join(pkg, "data", "manifest.json"), "utf8"));
const constantes = readFileSync(join(pkg, "src", "constants.js"), "utf8");
const versao = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).version;
const anterior = existsSync(DESTINO) ? JSON.parse(readFileSync(DESTINO, "utf8")) : {periodos: []};

const periodos = [];
for (const t of manifesto.tables
  .filter(t => t.location === "continente" && t.validFrom >= DESDE_MINIMO)
  .sort((a, b) => a.validFrom.localeCompare(b.validFrom))) {
  const tabelas = lerTabelas(readFileSync(join(pkg, "data", t.file), "utf8"));
  validar(t.year, tabelas);
  const antes = anterior.periodos.find(p => p.id === t.year);
  let parametros = lerParametros(constantes, t.year), herdados = false;
  if (!parametros) {
    parametros = antes?.parametros ?? periodos.at(-1)?.parametros ?? anterior.periodos.at(-1)?.parametros;
    herdados = true;
    if (!parametros) throw new Error(`sem parâmetros para o período ${t.year}`);
    console.warn(`Aviso: parâmetros de ${t.year} não encontrados; a usar os do período anterior.`);
  }
  periodos.push({
    id: t.year, nome: t.label, desde: t.validFrom,
    ...(antes?.diploma ? {diploma: antes.diploma} : {}),
    parametros, ...(herdados ? {parametrosHerdados: true} : {}),
    tabelas,
  });
}
if (!periodos.length) throw new Error("o pacote não tem tabelas do continente a partir de 2026");

const igual = JSON.stringify(periodos) === JSON.stringify(anterior.periodos);
if (igual) {
  console.log(`Sem alterações (${periodos.map(p => p.nome).join(", ")}).`);
} else {
  const hoje = new Date().toISOString().slice(0, 10);
  writeFileSync(DESTINO, JSON.stringify({fonte: `${PACOTE}@${versao}`, atualizado: hoje, periodos}, null, 1) + "\n");
  console.log(`Tabelas atualizadas: ${periodos.map(p => `${p.nome} (desde ${p.desde})`).join(", ")}.`);
}
