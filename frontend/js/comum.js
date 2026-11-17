    // Mensagens do próprio sistema, no lugar dos pop-ups do navegador
// ("localhost:3000 diz..."). Este arquivo é carregado em todas as telas,
// antes do script de cada página.
//
//   avisar('Texto', 'sucesso' | 'erro' | 'aviso')   -> aviso que some sozinho (toast)
//   await confirmar('Pergunta?', { perigo: true })  -> true se o usuário confirmou

// ---------- Avisos (substituem o alert) ----------
const DURACAO_AVISO = { sucesso: 3500, aviso: 5000, erro: 6500 };
const ICONE_AVISO = { sucesso: '✔', aviso: '!', erro: '✖' };

function pegarContainerDeAvisos() {
  let container = document.getElementById('avisos');
  if (!container) {
    container = document.createElement('div');
    container.id = 'avisos';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

function avisar(texto, tipo = 'aviso') {
  if (!DURACAO_AVISO[tipo]) tipo = 'aviso';

  const aviso = document.createElement('div');
  aviso.className = `aviso aviso-${tipo}`;
  aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');

  const icone = document.createElement('span');
  icone.className = 'aviso-icone';
  icone.textContent = ICONE_AVISO[tipo];

  // textContent (e não innerHTML): o texto pode vir do servidor ou do
  // usuário, e assim nunca é interpretado como HTML.
  const mensagem = document.createElement('span');
  mensagem.className = 'aviso-texto';
  mensagem.textContent = texto;

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'aviso-fechar';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.textContent = '×';

  aviso.append(icone, mensagem, fechar);
  pegarContainerDeAvisos().appendChild(aviso);

  const remover = () => {
    aviso.classList.add('aviso-saindo');
    setTimeout(() => aviso.remove(), 200);
  };
  fechar.addEventListener('click', remover);
  setTimeout(remover, DURACAO_AVISO[tipo]);
}

// ---------- Confirmação (substitui o confirm) ----------
// Devolve uma Promise: quem chama usa "await" e recebe true ou false.
function confirmar(pergunta, { titulo = 'Confirmar ação', textoConfirmar = 'Confirmar', perigo = false } = {}) {
  return new Promise((resolve) => {
    const fundo = document.createElement('div');
    fundo.className = 'dialogo-fundo';

    const caixa = document.createElement('div');
    caixa.className = 'dialogo';
    caixa.setAttribute('role', 'alertdialog');
    caixa.setAttribute('aria-modal', 'true');

    const h = document.createElement('h3');
    h.textContent = titulo;

    const p = document.createElement('p');
    p.textContent = pergunta;

    const acoes = document.createElement('div');
    acoes.className = 'dialogo-acoes';

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.className = 'dialogo-btn dialogo-cancelar';
    btnCancelar.textContent = 'Cancelar';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'dialogo-btn ' + (perigo ? 'dialogo-perigo' : 'dialogo-ok');
    btnOk.textContent = textoConfirmar;

    acoes.append(btnCancelar, btnOk);
    caixa.append(h, p, acoes);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);

    const encerrar = (resposta) => {
      document.removeEventListener('keydown', teclado);
      fundo.remove();
      resolve(resposta);
    };
    const teclado = (e) => {
      if (e.key === 'Escape') encerrar(false);
    };

    btnCancelar.addEventListener('click', () => encerrar(false));
    btnOk.addEventListener('click', () => encerrar(true));
    fundo.addEventListener('click', (e) => { if (e.target === fundo) encerrar(false); });
    document.addEventListener('keydown', teclado);

    // Em ação destrutiva o foco começa em "Cancelar": um Enter sem querer não apaga nada.
    (perigo ? btnCancelar : btnOk).focus();
  });
}

// ---------- Ponte para qualquer alert() que ainda exista ----------
// alert('texto') passa a aparecer como aviso do sistema. A cor é escolhida
// pelo conteúdo da mensagem.
function tipoDoAviso(texto) {
  if (/erro|falha|não foi possível/i.test(texto)) return 'erro';
  if (/sucesso|atualizad[oa]!|cadastrad[oa]!|exclu[ií]d[oa]!|removid[oa]!/i.test(texto)) return 'sucesso';
  return 'aviso';
}

window.alert = (texto) => avisar(String(texto), tipoDoAviso(String(texto)));