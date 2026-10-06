// Atende RF03 (Geração Automática), RF04 (Manipulação Manual - UC "Editar
// Escala Manualmente"), RF05/RF06 (Formatação e Envio WhatsApp) e
// RN04 (Restrição de Finalização).

const escalaAnoInput = document.getElementById('escala-ano');
const escalaMesSelect = document.getElementById('escala-mes');
const carregarStatusBtn = document.getElementById('carregar-status-btn');
const listaStatusMinisterios = document.getElementById('lista-status-ministerios');
const visualizacaoEscala = document.getElementById('visualizacao-escala');
const enviarWhatsappBtn = document.getElementById('enviar-whatsapp-btn');
const copiarTextoBtn = document.getElementById('copiar-texto-btn');

let escalaDoMesCache = [];
let voluntariosCache = [];

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatarDataBR = (dataISO) => {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

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

const carregarVoluntariosCache = async () => {
  try {
    voluntariosCache = await fetchJson('/api/voluntarios');
  } catch (error) {
    showError(error.message);
  }
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

    await carregarVoluntariosCache();
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

function candidatosParaVaga(ministerioNome, funcao) {
  return voluntariosCache.filter(
    (v) => (v.ministerios || []).includes(ministerioNome) && (v.funcoes || []).includes(funcao)
  );
}

function renderizarVaga(culto, ministerioBloco, vaga) {
  const candidatos = candidatosParaVaga(ministerioBloco.ministerio_nome, vaga.funcao);
  const opcoes = [`<option value="">VAGO</option>`]
    .concat(
      candidatos.map(
        (v) =>
          `<option value="${v._id}" ${String(v._id) === String(vaga.voluntario_id) ? 'selected' : ''}>${v.nome}</option>`
      )
    )
    .join('');

  return `
    <li style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; padding:0.35rem 0; background:none; border:none;">
      <span style="flex-shrink:0; font-weight:600;">${vaga.funcao}:</span>
      <select
        data-select-substituto
        data-escala-id="${culto._id}"
        data-ministerio-id="${ministerioBloco.ministerio_id}"
        data-funcao="${vaga.funcao}"
        style="flex:1; padding:0.45rem 0.6rem; border-radius:8px; border:1px solid var(--cor-borda); ${vaga.nome === 'VAGO' ? 'color:#b3261e;' : ''}">
        ${opcoes}
      </select>
    </li>
  `;
}

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
        const temVagaAberta = culto.ministerios.some((min) =>
          min.vagas_preenchidas.some((vaga) => vaga.nome === 'VAGO')
        );
        const temMinisterios = culto.ministerios.length > 0;

        const blocosMinisterios = temMinisterios
          ? culto.ministerios
              .map(
                (min) => `
                  <div style="margin-top:0.5rem;">
                    <strong>${min.ministerio_nome}</strong>
                    <ul style="margin:0.25rem 0 0; padding-left:0; list-style:none;">
                      ${min.vagas_preenchidas.map((vaga) => renderizarVaga(culto, min, vaga)).join('')}
                    </ul>
                  </div>
                `
              )
              .join('')
          : '<p style="color:#6b6579;">Nenhum ministério gerado ainda para este culto.</p>';

        const botaoFinalizar =
          culto.status === 'finalizada'
            ? `<span style="color:#1e7d4b; font-weight:600;">✅ Escala finalizada</span>`
            : `<button class="btn btn-primary" type="button" data-finalizar-culto="${culto._id}" ${
                !temMinisterios || temVagaAberta ? 'disabled title="Preencha todas as vagas (sem VAGO) antes de finalizar"' : ''
              }>Finalizar Escala Deste Culto</button>`;

        return `
          <li style="flex-direction:column; align-items:stretch;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <strong>${culto.dia_semana}, ${formatarDataBR(culto.data_culto)} às ${culto.horario}</strong>
              ${botaoFinalizar}
            </div>
            ${blocosMinisterios}
          </li>
        `;
      })
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

const handleSelectSubstitutoChange = async (event) => {
  const select = event.target.closest('select[data-select-substituto]');
  if (!select) return;

  const { escalaId, ministerioId, funcao } = select.dataset;
  const novoVoluntarioId = select.value || null;
  const novoNome = novoVoluntarioId
    ? select.options[select.selectedIndex].textContent
    : 'VAGO';

  try {
    await fetchJson(`/api/escalas/${escalaId}/ministerio/${ministerioId}/funcao/${encodeURIComponent(funcao)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novo_voluntario_id: novoVoluntarioId, novo_nome: novoNome }),
    });

    await visualizarEscalaDoMes();
  } catch (error) {
    if (confirm(`${error.message}\n\nDeseja confirmar mesmo assim?`)) {
      try {
        await fetchJson(`/api/escalas/${escalaId}/ministerio/${ministerioId}/funcao/${encodeURIComponent(funcao)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novo_voluntario_id: novoVoluntarioId, novo_nome: novoNome, forcar: true }),
        });
        await visualizarEscalaDoMes();
      } catch (error2) {
        showError(error2.message);
      }
    } else {
      await visualizarEscalaDoMes();
    }
  }
};

const handleVisualizacaoClick = async (event) => {
  const btnFinalizar = event.target.closest('button[data-finalizar-culto]');
  if (!btnFinalizar) return;

  const escalaId = btnFinalizar.dataset.finalizarCulto;
  if (!confirm('Finalizar esta escala? Depois de finalizada, edições exigirão confirmação extra.')) return;

  try {
    await fetchJson(`/api/escalas/${escalaId}/finalizar`, { method: 'POST' });
    await visualizarEscalaDoMes();
  } catch (error) {
    showError(error.message);
  }
};

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
    texto += `*${culto.dia_semana}, ${formatarDataBR(culto.data_culto)} às ${culto.horario}*\n`;

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

function enviarParaWhatsapp() {
  const texto = formatarEscalaParaTexto();

  if (!texto) {
    return showError('Carregue a escala do mês antes de enviar para o WhatsApp.');
  }

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

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
visualizacaoEscala.addEventListener('click', handleVisualizacaoClick);
visualizacaoEscala.addEventListener('change', handleSelectSubstitutoChange);
enviarWhatsappBtn.addEventListener('click', enviarParaWhatsapp);
copiarTextoBtn.addEventListener('click', copiarTextoDaEscala);