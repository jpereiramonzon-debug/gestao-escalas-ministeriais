// CRUD de Funções (ex.: Baixista, Baterista, Operador de Áudio).
// Usado apenas na página funcoes.html.
// Essas funções cadastradas aqui são a fonte que alimenta os checkboxes
// de "Funções Obrigatórias" na tela de Ministérios.

const formFuncao = document.getElementById('form-funcao');
const listaFuncoes = document.getElementById('lista-funcoes');
const funcCancelarBtn = document.getElementById('func-cancelar');

let funcoesCache = [];

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

const carregarFuncoes = async () => {
  try {
    const funcoes = await fetchJson('/api/funcoes');
    funcoesCache = funcoes;

    listaFuncoes.innerHTML = funcoes
      .map(
        (funcao) => `
          <li>
            <div><strong>${funcao.nome}</strong></div>
            <div>
              <button class="btn" data-editar-func="${funcao._id}" type="button">Editar</button>
              <button class="btn" data-excluir-func="${funcao._id}" type="button" style="background:#e74c3c; color:white;">Excluir</button>
            </div>
          </li>
        `
      )
      .join('');
  } catch (error) {
    showError(error.message);
  }
};

const resetFormFuncao = () => {
  formFuncao.reset();
  document.getElementById('func-id').value = '';
  document.getElementById('titulo-form-funcao').textContent = 'Cadastrar Função';
  funcCancelarBtn.style.display = 'none';
};

const handleFuncaoSubmit = async (event) => {
  event.preventDefault();

  const id = document.getElementById('func-id').value;
  const nome = document.getElementById('func-nome').value.trim();

  if (!nome) {
    return showError('Preencha o nome da função.');
  }

  try {
    if (id) {
      await fetchJson(`/api/funcoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      alert('Função atualizada com sucesso!');
    } else {
      await fetchJson('/api/funcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      alert('Função cadastrada com sucesso!');
    }

    resetFormFuncao();
    await carregarFuncoes();
  } catch (error) {
    showError(error.message);
  }
};

const handleListaFuncoesClick = async (event) => {
  const btnEditar = event.target.closest('button[data-editar-func]');
  const btnExcluir = event.target.closest('button[data-excluir-func]');

  if (btnEditar) {
    const id = btnEditar.dataset.editarFunc;
    const funcao = funcoesCache.find((f) => f._id === id);
    if (!funcao) return showError('Função não encontrada.');

    document.getElementById('func-id').value = funcao._id;
    document.getElementById('func-nome').value = funcao.nome;
    document.getElementById('titulo-form-funcao').textContent = 'Editar Função';
    funcCancelarBtn.style.display = 'inline-block';
    formFuncao.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirFunc;
    if (!confirm('Deseja remover esta função?')) return;

    try {
      await fetchJson(`/api/funcoes/${id}`, { method: 'DELETE' });
      await carregarFuncoes();
    } catch (error) {
      showError(error.message);
    }
  }
};

formFuncao.addEventListener('submit', handleFuncaoSubmit);
listaFuncoes.addEventListener('click', handleListaFuncoesClick);
funcCancelarBtn.addEventListener('click', resetFormFuncao);

window.addEventListener('load', carregarFuncoes);
