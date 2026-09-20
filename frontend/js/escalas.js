// Atende RF03 (Geração Automática de Escala) via Fetch API
// Usado apenas na página escalas.html (tela de Geração de Escalas)

const escalaAnoInput = document.getElementById('escala-ano');
const escalaMesSelect = document.getElementById('escala-mes');
const carregarStatusBtn = document.getElementById('carregar-status-btn');
const listaStatusMinisterios = document.getElementById('lista-status-ministerios');
const visualizacaoEscala = document.getElementById('visualizacao-escala');

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

carregarStatusBtn.addEventListener('click', carregarStatusDoMes);
listaStatusMinisterios.addEventListener('click', handleListaStatusClick);       