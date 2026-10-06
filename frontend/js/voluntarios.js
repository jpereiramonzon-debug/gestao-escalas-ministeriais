// Atende RF01 (CRUD de Voluntários) via Fetch API
// Usado apenas na página voluntarios.html
// Inclui: select de ministério (puxado do banco) e calendário visual
// para seleção de datas de restrição (RN05).

const formVoluntario = document.getElementById('form-voluntario');
const listaVoluntarios = document.getElementById('lista-voluntarios');
const volCancelarBtn = document.getElementById('vol-cancelar');
const volMinisterioSelect = document.getElementById('vol-ministerio');

const calMesAnteriorBtn = document.getElementById('cal-mes-anterior');
const calMesSeguinteBtn = document.getElementById('cal-mes-seguinte');
const calMesAnoLabel = document.getElementById('cal-mes-ano-label');
const calendarioGrid = document.getElementById('calendario-grid');
const restricoesSelecionadasDiv = document.getElementById('restricoes-selecionadas');

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

let ministeriosCache = [];

const hoje = new Date();
let calendarioAno = hoje.getFullYear();
let calendarioMes = hoje.getMonth();
let datasSelecionadas = new Set();

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

const parseCsv = (input) => {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const formatarDataISO = (ano, mes, dia) => {
  const mesStr = String(mes + 1).padStart(2, '0');
  const diaStr = String(dia).padStart(2, '0');
  return `${ano}-${mesStr}-${diaStr}`;
};

const carregarMinisteriosParaSelect = async () => {
  try {
    ministeriosCache = await fetchJson('/api/ministerios');

    volMinisterioSelect.innerHTML =
      '<option value="">-- Selecione um ministério --</option>' +
      ministeriosCache.map((min) => `<option value="${min.nome}">${min.nome}</option>`).join('');
  } catch (error) {
    showError(error.message);
  }
};

function renderizarCalendario() {
  calMesAnoLabel.textContent = `${NOMES_MES[calendarioMes]} de ${calendarioAno}`;

  const primeiroDiaSemana = new Date(calendarioAno, calendarioMes, 1).getDay();
  const totalDiasNoMes = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  let celulas = '';

  for (let i = 0; i < primeiroDiaSemana; i++) {
    celulas += `<span class="calendario-dia calendario-dia-vazio"></span>`;
  }

  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    const dataISO = formatarDataISO(calendarioAno, calendarioMes, dia);
    const selecionado = datasSelecionadas.has(dataISO) ? 'calendario-dia-selecionado' : '';
    celulas += `<button type="button" class="calendario-dia ${selecionado}" data-data="${dataISO}">${dia}</button>`;
  }

  calendarioGrid.innerHTML = celulas;
  renderizarListaDeSelecionadas();
}

function renderizarListaDeSelecionadas() {
  if (datasSelecionadas.size === 0) {
    restricoesSelecionadasDiv.innerHTML = '<em>Nenhuma data de restrição selecionada.</em>';
    return;
  }

  const datasOrdenadas = Array.from(datasSelecionadas).sort();

  restricoesSelecionadasDiv.innerHTML = datasOrdenadas
    .map(
      (data) => `
        <span class="chip-restricao" data-remover="${data}">
          ${formatarDataBR(data)} ✕
        </span>
      `
    )
    .join('');
}

function handleCalendarioClick(event) {
  const botaoDia = event.target.closest('button[data-data]');
  if (!botaoDia) return;

  const data = botaoDia.dataset.data;

  if (datasSelecionadas.has(data)) {
    datasSelecionadas.delete(data);
  } else {
    datasSelecionadas.add(data);
  }

  renderizarCalendario();
}

function handleRemoverChipClick(event) {
  const chip = event.target.closest('span[data-remover]');
  if (!chip) return;

  datasSelecionadas.delete(chip.dataset.remover);
  renderizarCalendario();
}

calMesAnteriorBtn.addEventListener('click', () => {
  calendarioMes -= 1;
  if (calendarioMes < 0) {
    calendarioMes = 11;
    calendarioAno -= 1;
  }
  renderizarCalendario();
});

calMesSeguinteBtn.addEventListener('click', () => {
  calendarioMes += 1;
  if (calendarioMes > 11) {
    calendarioMes = 0;
    calendarioAno += 1;
  }
  renderizarCalendario();
});

calendarioGrid.addEventListener('click', handleCalendarioClick);
restricoesSelecionadasDiv.addEventListener('click', handleRemoverChipClick);

// Converte "AAAA-MM-DD" (formato de armazenamento) para "DD/MM/AAAA" (exibição)
const formatarDataBR = (dataISO) => {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

const carregarVoluntarios = async () => {
  try {
    const voluntarios = await fetchJson('/api/voluntarios');
    listaVoluntarios.innerHTML = voluntarios
      .map(
        (vol) => `
          <li>
            <div>
              <strong>${vol.nome}</strong><br>
              Ministério: ${Array.isArray(vol.ministerios) ? vol.ministerios.join(', ') : vol.ministerios}<br>
              Funções: ${Array.isArray(vol.funcoes) ? vol.funcoes.join(', ') : ''}<br>
              Disponibilidade: ${Array.isArray(vol.disponibilidades) ? vol.disponibilidades.join(', ') : '-'}<br>
              Restrições: ${Array.isArray(vol.restricoes) && vol.restricoes.length ? vol.restricoes.map(formatarDataBR).join(', ') : '-'}
            </div>
            <div>
              <button class="btn" data-editar-vol="${vol._id}" type="button">Editar</button>
              <button class="btn" data-excluir-vol="${vol._id}" type="button" style="background:#e74c3c; color:white;">Excluir</button>
            </div>
          </li>
        `
      )
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

const resetFormVoluntario = () => {
  formVoluntario.reset();
  document.getElementById('vol-id').value = '';
  document.getElementById('titulo-form-voluntario').textContent = 'Cadastrar Voluntário (UC01)';
  volCancelarBtn.style.display = 'none';
  datasSelecionadas = new Set();
  calendarioAno = hoje.getFullYear();
  calendarioMes = hoje.getMonth();
  renderizarCalendario();
};

const handleVoluntarioSubmit = async (event) => {
  event.preventDefault();

  const id = document.getElementById('vol-id').value;
  const nome = document.getElementById('vol-nome').value.trim();
  const ministerio = volMinisterioSelect.value;
  const funcoes = parseCsv(document.getElementById('vol-funcoes').value);
  const disponibilidades = parseCsv(document.getElementById('vol-disponibilidade').value);
  const restricoes = Array.from(datasSelecionadas).sort();

  if (!nome || !ministerio) {
    return showError('Preencha o nome do voluntário e selecione um ministério.');
  }

  const payload = {
    nome,
    ministerios: [ministerio],
    funcoes,
    disponibilidades,
    restricoes,
  };

  try {
    if (id) {
      await fetchJson(`/api/voluntarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Voluntário atualizado com sucesso!');
    } else {
      await fetchJson('/api/voluntarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Voluntário cadastrado com sucesso!');
    }

    resetFormVoluntario();
    await carregarVoluntarios();
  } catch (error) {
    showError(error.message);
  }
};

const handleListaVoluntariosClick = async (event) => {
  const btnEditar = event.target.closest('button[data-editar-vol]');
  const btnExcluir = event.target.closest('button[data-excluir-vol]');

  if (btnEditar) {
    const id = btnEditar.dataset.editarVol;
    try {
      const voluntarios = await fetchJson('/api/voluntarios');
      const voluntario = voluntarios.find((v) => v._id === id);
      if (!voluntario) return showError('Voluntário não encontrado.');

      document.getElementById('vol-id').value = voluntario._id;
      document.getElementById('vol-nome').value = voluntario.nome;
      volMinisterioSelect.value = (voluntario.ministerios || [])[0] || '';
      document.getElementById('vol-funcoes').value = (voluntario.funcoes || []).join(', ');
      document.getElementById('vol-disponibilidade').value = (voluntario.disponibilidades || []).join(', ');

      datasSelecionadas = new Set(voluntario.restricoes || []);
      if (datasSelecionadas.size > 0) {
        const primeiraData = Array.from(datasSelecionadas).sort()[0];
        const [anoStr, mesStr] = primeiraData.split('-');
        calendarioAno = Number(anoStr);
        calendarioMes = Number(mesStr) - 1;
      }
      renderizarCalendario();

      document.getElementById('titulo-form-voluntario').textContent = 'Editar Voluntário';
      volCancelarBtn.style.display = 'inline-block';
      formVoluntario.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showError(error.message);
    }
    return;
  }

  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirVol;
    if (!confirm('Deseja remover este voluntário?')) return;

    try {
      await fetchJson(`/api/voluntarios/${id}`, { method: 'DELETE' });
      await carregarVoluntarios();
    } catch (error) {
      showError(error.message);
    }
  }
};

formVoluntario.addEventListener('submit', handleVoluntarioSubmit);
listaVoluntarios.addEventListener('click', handleListaVoluntariosClick);
volCancelarBtn.addEventListener('click', resetFormVoluntario);

window.addEventListener('load', () => {
  carregarMinisteriosParaSelect();
  carregarVoluntarios();
  renderizarCalendario();
});