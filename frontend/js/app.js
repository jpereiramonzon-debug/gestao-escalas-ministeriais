const formMinisterio = document.getElementById('form-ministerio');
const formVoluntario = document.getElementById('form-voluntario');
const listaVoluntarios = document.getElementById('lista-voluntarios');

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
              Funções: ${Array.isArray(vol.funcoes) ? vol.funcoes.join(', ') : ''}
            </div>
            <button class="btn btn-primary" data-id="${vol._id}" type="button">Remover</button>
          </li>
        `
      )
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

const handleMinisterioSubmit = async (event) => {
  event.preventDefault();

  const nome = document.getElementById('min-nome').value.trim();
  const funcoes = parseCsv(document.getElementById('min-funcoes').value);

  if (!nome || funcoes.length === 0) {
    return showError('Preencha o nome do ministério e pelo menos uma função.');
  }

  try {
    await fetchJson('/api/ministerios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, funcoes_obrigatorias: funcoes }),
    });

    formMinisterio.reset();
    alert('Ministério cadastrado com sucesso!');
  } catch (error) {
    showError(error.message);
  }
};

const handleVoluntarioSubmit = async (event) => {
  event.preventDefault();

  const nome = document.getElementById('vol-nome').value.trim();
  const ministerio = document.getElementById('vol-ministerio').value.trim();
  const funcoes = parseCsv(document.getElementById('vol-funcoes').value);

  if (!nome || !ministerio) {
    return showError('Preencha o nome do voluntário e o ministério.');
  }

  try {
    await fetchJson('/api/voluntarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        ministerios: [ministerio],
        funcoes,
      }),
    });

    formVoluntario.reset();
    await carregarVoluntarios();
    alert('Voluntário cadastrado com sucesso!');
  } catch (error) {
    showError(error.message);
  }
};

const handleListaClick = async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const id = button.dataset.id;
  if (!id) return;

  if (!confirm('Deseja remover este voluntário?')) return;

  try {
    await fetchJson(`/api/voluntarios/${id}`, { method: 'DELETE' });
    await carregarVoluntarios();
  } catch (error) {
    showError(error.message);
  }
};

formMinisterio.addEventListener('submit', handleMinisterioSubmit);
formVoluntario.addEventListener('submit', handleVoluntarioSubmit);
listaVoluntarios.addEventListener('click', handleListaClick);

window.addEventListener('load', carregarVoluntarios);
