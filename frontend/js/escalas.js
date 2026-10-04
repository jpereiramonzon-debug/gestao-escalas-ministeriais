// Atende RF03 (Geração Automática de Escala), RF05 (Formatação de Texto)
// e RF06 (Redirecionamento Nativo via Protocolo URL do WhatsApp)

const escalaAnoInput = document.getElementById('escala-ano');
const escalaMesSelect = document.getElementById('escala-mes');
const carregarStatusBtn = document.getElementById('carregar-status-btn');
const listaStatusMinisterios = document.getElementById('lista-status-ministerios');
const visualizacaoEscala = document.getElementById('visualizacao-escala');
const enviarWhatsappBtn = document.getElementById('enviar-whatsapp-btn');
const copiarTextoBtn = document.getElementById('copiar-texto-btn');

// Guarda em memória a última escala carregada, para poder formatar e
// enviar para o WhatsApp sem precisar buscar tudo de novo no servidor.
let escalaDoMesCache = [];

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const showError = (message) => {
  alert(message);
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição.');
  }
  return data;
};

const carregarStatusDoMes = async () => {
  const ano = escalaAnoInput.value;
  const mes = escalaMesSelect.value;

  if (!ano || !mes) {
    return showError('Informe o ano e o mês.');
  }

  try {
    const status = await fetchJson(`/api/escalas/mes/${ano}/${mes}/status`);

    listaStatusMinisterios.innerHTML = status.ministerios
      .map((min) => {
        if (min.processado) {
          return `
            <li>
              <div><strong>${min.nome}</strong> — ✅ Escala gerada</div>
              <div>
                <button class="btn" data-desfazer-min="${min._id}" type="button">Desfazer</button>
              </div>
            </li>
          `;
        }
        return `
          <li>
            <div><strong>${min.nome}</strong> — ⏳ Pendente</div>
            <div>
              <button class="btn btn-primary" data-gerar-min="${min._id}" type="button">Gerar Escala Deste Ministério</button>
            </div>
          </li>
        `;
      })
      .join('');

    await visualizarEscalaDoMes();
  } catch (error) {
    showError(error.message);
  }
};

const gerarEscalaDoMinisterio = async (ministerioId) => {
  const ano = escalaAnoInput.value;
  const mes = escalaMesSelect.value;

  try {
    await fetchJson('/api/escalas/gerar-ministerio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: Number(ano), mes: Number(mes), ministerio_id: ministerioId }),
    });

    await carregarStatusDoMes();
  } catch (error) {
    showError(error.message);
  }
};

const desfazerEscalaDoMinisterio = async (ministerioId) => {
  const ano = escalaAnoInput.value;
  const mes = escalaMesSelect.value;

  if (!confirm('Isso vai apagar as vagas geradas deste ministério neste mês. Continuar?')) return;

  try {
    await fetchJson(`/api/escalas/mes/${ano}/${mes}/ministerio/${ministerioId}`, { method: 'DELETE' });
    await carregarStatusDoMes();
  } catch (error) {
    showError(error.message);
  }
};

const handleListaStatusClick = (event) => {
  const btnGerar = event.target.closest('button[data-gerar-min]');
  const btnDesfazer = event.target.closest('button[data-desfazer-min]');

  if (btnGerar) {
    gerarEscalaDoMinisterio(btnGerar.dataset.gerarMin);
  }
  if (btnDesfazer) {
    desfazerEscalaDoMinisterio(btnDesfazer.dataset.desfazerMin);
  }
};

const visualizarEscalaDoMes = async () => {
  const ano = escalaAnoInput.value;
  const mes = escalaMesSelect.value;

  try {
    const escalas = await fetchJson(`/api/escalas?ano=${ano}&mes=${mes}`);
    escalaDoMesCache = escalas;

    if (escalas.length === 0) {
      visualizacaoEscala.innerHTML = '<p>Nenhum culto gerado ainda para este mês.</p>';
      return;
    }

    visualizacaoEscala.innerHTML = escalas
      .map((culto) => {
        const blocosMinisterios = culto.ministerios.length
          ? culto.ministerios
              .map(
                (min) => `
                  <div style="margin-top:0.5rem;">
                    <strong>${min.ministerio_nome}</strong>
                    <ul style="margin:0.25rem 0 0; padding-left:1.2rem;">
                      ${min.vagas_preenchidas
                        .map(
                          (vaga) =>
                            `<li style="${vaga.nome === 'VAGO' ? 'color:#b3261e;font-weight:600;' : ''}">${vaga.funcao}: ${vaga.nome}</li>`
                        )
                        .join('')}
                    </ul>
                  </div>
                `
              )
              .join('')
          : '<p style="color:#6b6579;">Nenhum ministério gerado ainda para este culto.</p>';

        return `
          <li style="flex-direction:column; align-items:stretch;">
            <div><strong>${culto.dia_semana}, ${culto.data_culto} às ${culto.horario}</strong> — status: ${culto.status}</div>
            ${blocosMinisterios}
          </li>
        `;
      })
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

// RF05 - Formatação Estruturada de Texto: converte a escala em memória
// numa string limpa, com negrito e quebras de linha no padrão do WhatsApp
// (asterisco = negrito no WhatsApp).
function formatarEscalaParaTexto() {
  const ano = escalaAnoInput.value;
  const mes = Number(escalaMesSelect.value);
  const nomeMes = NOMES_MES[mes - 1];

  if (escalaDoMesCache.length === 0) {
    return null;
  }

  let texto = `*Escala Ministerial - ${nomeMes}/${ano}*\n`;
  texto += `_Portal IEQ - Gestão de Escalas_\n\n`;

  escalaDoMesCache.forEach((culto) => {
    texto += `*${culto.dia_semana}, ${culto.data_culto} às ${culto.horario}*\n`;

    if (culto.ministerios.length === 0) {
      texto += `_(nenhum ministério gerado ainda)_\n`;
    } else {
      culto.ministerios.forEach((min) => {
        texto += `_${min.ministerio_nome}_\n`;
        min.vagas_preenchidas.forEach((vaga) => {
          texto += `• ${vaga.funcao}: ${vaga.nome}\n`;
        });
      });
    }

    texto += `\n`;
  });

  return texto;
}

// RF06 - Redirecionamento Nativo via Protocolo URL: abre o WhatsApp com o
// texto já preenchido, deixando o coordenador escolher manualmente o
// contato ou grupo de destino (Deep Link, sem custo de API paga).
function enviarParaWhatsapp() {
  const texto = formatarEscalaParaTexto();

  if (!texto) {
    return showError('Carregue a escala do mês antes de enviar para o WhatsApp.');
  }

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

// Fluxo alternativo do UC "Emitir Escala Para WhatsApp": caso o
// redirecionamento não funcione (ex: navegador bloqueando pop-up),
// o coordenador pode copiar o texto manualmente.
async function copiarTextoDaEscala() {
  const texto = formatarEscalaParaTexto();

  if (!texto) {
    return showError('Carregue a escala do mês antes de copiar o texto.');
  }

  try {
    await navigator.clipboard.writeText(texto);
    alert('Texto da escala copiado! Já pode colar no WhatsApp.');
  } catch (error) {
    showError('Não foi possível copiar automaticamente. Copie manualmente o texto exibido no console (F12).');
    console.log(texto);
  }
}

carregarStatusBtn.addEventListener('click', carregarStatusDoMes);
listaStatusMinisterios.addEventListener('click', handleListaStatusClick);
enviarWhatsappBtn.addEventListener('click', enviarParaWhatsapp);
copiarTextoBtn.addEventListener('click', copiarTextoDaEscala);