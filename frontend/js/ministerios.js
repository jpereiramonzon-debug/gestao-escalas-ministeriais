// Atende RF02 (CRUD de Ministérios) via Fetch API
// Usado apenas na página ministerios.html

const formMinisterio = document.getElementById('form-ministerio');
const listaMinisterios = document.getElementById('lista-ministerios');
const minCancelarBtn = document.getElementById('min-cancelar');

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

formMinisterio.addEventListener('submit', handleMinisterioSubmit);
listaMinisterios.addEventListener('click', handleListaMinisteriosClick);
minCancelarBtn.addEventListener('click', resetFormMinisterio);

window.addEventListener('load', carregarMinisterios);