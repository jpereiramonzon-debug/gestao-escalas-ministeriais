// CRUD de Funções (ex.: Baixista, Baterista, Operador de Áudio).
// Usado apenas na página funcoes.html.
// As funções cadastradas aqui alimentam os checkboxes de "Funções
// Obrigatórias" na tela de Ministérios.

let todasFuncoes = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarFuncoes();

    document.getElementById('form-funcao').addEventListener('submit', salvarFuncao);
    document.getElementById('pesquisa').addEventListener('input', filtrarFuncoes);
});

async function carregarFuncoes() {
    const lista = document.getElementById('lista-funcoes');
    try {
        lista.innerHTML = '<em>Carregando funções...</em>';
        const response = await fetch('/api/funcoes');
        todasFuncoes = await response.json();
        renderizarFuncoes(todasFuncoes);
    } catch (error) {
        console.error('Erro ao carregar funções:', error);
        lista.innerHTML = '<em style="color: red;">Erro ao carregar funções.</em>';
    }
}

function renderizarFuncoes(funcoes) {
    const lista = document.getElementById('lista-funcoes');
    lista.innerHTML = '';

    if (funcoes.length === 0) {
        lista.innerHTML = '<em>Nenhuma função encontrada.</em>';
        return;
    }

    funcoes.forEach(funcao => {
        const div = document.createElement('div');
        div.className = 'item-lista';
        div.innerHTML = `
            <div class="item-info">${funcao.nome}</div>
            <div class="acoes">
                <button class="btn-acao" onclick="editarFuncao('${funcao._id}')">Editar</button>
                <button class="btn-acao btn-excluir" onclick="excluirFuncao('${funcao._id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function filtrarFuncoes(event) {
    const termo = event.target.value.toLowerCase();
    const filtradas = todasFuncoes.filter(f => (f.nome || '').toLowerCase().includes(termo));
    renderizarFuncoes(filtradas);
}

async function salvarFuncao(event) {
    event.preventDefault();

    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('nome').value.trim();

    if (!nome) {
        avisar('Preencha o nome da função.', 'aviso');
        return;
    }

    try {
        const url = id ? `/api/funcoes/${id}` : '/api/funcoes';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });

        if (response.ok) {
            avisar(id ? 'Função atualizada com sucesso!' : 'Função cadastrada com sucesso!', 'sucesso');
            cancelarEdicao();
            carregarFuncoes();
        } else {
            const data = await response.json().catch(() => ({}));
            avisar(data.error || 'Falha ao salvar a função.', 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar função:', error);
        avisar('Erro de conexão ao salvar função.', 'erro');
    }
}

function editarFuncao(id) {
    const funcao = todasFuncoes.find(f => f._id === id);
    if (!funcao) {
        avisar('Função não encontrada.', 'erro');
        return;
    }

    document.getElementById('edit-id').value = funcao._id;
    document.getElementById('nome').value = funcao.nome;
    document.getElementById('btn-submit').textContent = 'Atualizar Função';
    document.getElementById('btn-cancelar').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-funcao').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('btn-submit').textContent = 'Salvar Função';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function excluirFuncao(id) {
    if (!(await confirmar('Deseja remover esta função?', { titulo: 'Confirmar exclusão', textoConfirmar: 'Excluir', perigo: true }))) return;

    try {
        const response = await fetch(`/api/funcoes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            avisar('Função excluída!', 'sucesso');
            carregarFuncoes();
        } else {
            const data = await response.json().catch(() => ({}));
            avisar(data.error || 'Erro ao excluir função.', 'erro');
        }
    } catch (error) {
        avisar('Erro de conexão ao excluir.', 'erro');
    }
}