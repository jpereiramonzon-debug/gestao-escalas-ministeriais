// Atende RF01 (CRUD Voluntários) e RF02 (CRUD Ministérios) via Fetch API
// Usado apenas na página index.html (tela de Cadastros)

const formMinisterio = document.getElementById('form-ministerio');
const formVoluntario = document.getElementById('form-voluntario');
const listaVoluntarios = document.getElementById('lista-voluntarios');
const listaMinisterios = document.getElementById('lista-ministerios');
const minCancelarBtn = document.getElementById('min-cancelar');
const volCancelarBtn = document.getElementById('vol-cancelar');

let ministeriosCache = [];

const parseCsv = (input) => {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

const carregarMinisterios = async () => {
  try {
    const ministerios = await fetchJson('/api/ministerios');
    ministeriosCache = ministerios;

    listaMinisterios.innerHTML = ministerios
      .map(
        (min) => `
          <li>
            <div>
              <strong>${min.nome}</strong><br>
              Funções obrigatórias: ${Array.isArray(min.funcoes_obrigatorias) ? min.funcoes_obrigatorias.join(', ') : ''}
            </div>
            <div>
              <button class="btn" data-editar-min="${min._id}" type="button">Editar</button>
              <button class="btn" data-excluir-min="${min._id}" type="button" style="background:#e74c3c; color:white;">Excluir</button>
            </div>
          </li>
        `
      )
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

const resetFormMinisterio = () => {
  formMinisterio.reset();
  document.getElementById('min-id').value = '';
  document.getElementById('titulo-form-ministerio').textContent = 'Cadastrar Ministério (UC02)';
  minCancelarBtn.style.display = 'none';
};

const handleMinisterioSubmit = async (event) => {
  event.preventDefault();

  const id = document.getElementById('min-id').value;
  const nome = document.getElementById('min-nome').value.trim();
  const funcoes_obrigatorias = parseCsv(document.getElementById('min-funcoes').value);

  if (!nome || funcoes_obrigatorias.length === 0) {
    return showError('Preencha o nome do ministério e pelo menos uma função.');
  }

  try {
    if (id) {
      await fetchJson(`/api/ministerios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, funcoes_obrigatorias }),
      });
      alert('Ministério atualizado com sucesso!');
    } else {
      await fetchJson('/api/ministerios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, funcoes_obrigatorias }),
      });
      alert('Ministério cadastrado com sucesso!');
    }

    resetFormMinisterio();
    await carregarMinisterios();
  } catch (error) {
    showError(error.message);
  }
};

const handleListaMinisteriosClick = async (event) => {
  const btnEditar = event.target.closest('button[data-editar-min]');
  const btnExcluir = event.target.closest('button[data-excluir-min]');

  if (btnEditar) {
    const id = btnEditar.dataset.editarMin;
    const ministerio = ministeriosCache.find((m) => m._id === id);
    if (!ministerio) return showError('Ministério não encontrado.');

    document.getElementById('min-id').value = ministerio._id;
    document.getElementById('min-nome').value = ministerio.nome;
    document.getElementById('min-funcoes').value = ministerio.funcoes_obrigatorias.join(', ');
    document.getElementById('titulo-form-ministerio').textContent = 'Editar Ministério';
    minCancelarBtn.style.display = 'inline-block';
    formMinisterio.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirMin;
    if (!confirm('Deseja remover este ministério?')) return;

    try {
      await fetchJson(`/api/ministerios/${id}`, { method: 'DELETE' });
      await carregarMinisterios();
    } catch (error) {
      showError(error.message);
    }
  }
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
              Restrições: ${Array.isArray(vol.restricoes) ? vol.restricoes.join(', ') : '-'}
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
};

const handleVoluntarioSubmit = async (event) => {
  event.preventDefault();

  const id = document.getElementById('vol-id').value;
  const nome = document.getElementById('vol-nome').value.trim();
  const ministerio = document.getElementById('vol-ministerio').value.trim();
  const funcoes = parseCsv(document.getElementById('vol-funcoes').value);
  const disponibilidades = parseCsv(document.getElementById('vol-disponibilidade').value);
  const restricoes = parseCsv(document.getElementById('vol-restricoes').value);

  if (!nome || !ministerio) {
    return showError('Preencha o nome do voluntário e o ministério.');
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
      document.getElementById('vol-ministerio').value = (voluntario.ministerios || [])[0] || '';
      document.getElementById('vol-funcoes').value = (voluntario.funcoes || []).join(', ');
      document.getElementById('vol-disponibilidade').value = (voluntario.disponibilidades || []).join(', ');
      document.getElementById('vol-restricoes').value = (voluntario.restricoes || []).join(', ');
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

formMinisterio.addEventListener('submit', handleMinisterioSubmit);
formVoluntario.addEventListener('submit', handleVoluntarioSubmit);
listaVoluntarios.addEventListener('click', handleListaVoluntariosClick);
listaMinisterios.addEventListener('click', handleListaMinisteriosClick);
minCancelarBtn.addEventListener('click', resetFormMinisterio);
volCancelarBtn.addEventListener('click', resetFormVoluntario);

window.addEventListener('load', () => {
  carregarVoluntarios();
  carregarMinisterios();
});