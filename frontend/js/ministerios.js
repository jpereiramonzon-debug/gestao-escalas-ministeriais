let todosMinisterios = [];
let todasFuncoes = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarFuncoes();
    carregarMinisterios();

    document.getElementById('form-ministerio').addEventListener('submit', salvarMinisterio);
    document.getElementById('pesquisa').addEventListener('input', filtrarMinisterios);
});

async function carregarFuncoes(funcoesSelecionadas = []) {
    const container = document.getElementById('container-funcoes');
    try {
        if(todasFuncoes.length === 0){
            const response = await fetch('/api/funcoes');
            todasFuncoes = await response.json();
        }
        
        container.innerHTML = ''; 

        if (todasFuncoes.length === 0) {
            container.innerHTML = '<em>Nenhuma função cadastrada ainda.</em>';
            return;
        }

        todasFuncoes.forEach(funcao => {
            const nomeFuncao = funcao.nome || funcao.Nome;
            const isChecked = funcoesSelecionadas.includes(nomeFuncao) ? 'checked' : '';
            
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `
                <input type="checkbox" name="funcao_obrigatoria" value="${nomeFuncao}" ${isChecked}>
                ${nomeFuncao}
            `;
            container.appendChild(label);
        });
    } catch (error) {
        console.error('Erro ao carregar funções:', error);
    }
}

async function carregarMinisterios() {
    const lista = document.getElementById('lista-ministerios');
    try {
        lista.innerHTML = '<em>Carregando ministérios...</em>';
        const response = await fetch('/api/ministerios');
        todosMinisterios = await response.json();
        renderizarMinisterios(todosMinisterios);
    } catch (error) {
        console.error('Erro ao carregar ministérios:', error);
    }
}

async function salvarMinisterio(event) {
    event.preventDefault();

    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('nome').value;
    const checkboxes = document.querySelectorAll('input[name="funcao_obrigatoria"]:checked');
    const funcoesSelecionadas = Array.from(checkboxes).map(cb => cb.value);

    if (funcoesSelecionadas.length === 0) {
        alert('Selecione pelo menos uma função obrigatória para este ministério.');
        return;
    }

    const ministerioData = {
        nome: nome,
        funcoes_obrigatorias: funcoesSelecionadas
    };

    try {
        const url = id ? `/api/ministerios/${id}` : '/api/ministerios';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ministerioData)
        });

        if (response.ok) {
            alert(id ? 'Ministério atualizado!' : 'Ministério cadastrado!');
            cancelarEdicao();
            carregarMinisterios(); 
        } else {
            const error = await response.json();
            alert(`Erro: ${error.error}`);
        }
    } catch (error) {
        console.error('Erro ao salvar ministério:', error);
        alert('Erro de conexão ao salvar ministério.');
    }
}

function renderizarMinisterios(ministerios) {
    const lista = document.getElementById('lista-ministerios');
    lista.innerHTML = '';

    if (ministerios.length === 0) {
        lista.innerHTML = '<em>Nenhum ministério encontrado.</em>';
        return;
    }

    ministerios.forEach(min => {
        const funcoesText = (min.funcoes_obrigatorias || []).join(', ');
        const nomeMin = min.nome || 'Sem nome';

        const div = document.createElement('div');
        div.className = 'item-lista';
        div.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${nomeMin}</div>
                <div class="item-detalhes"><strong>Funções:</strong> ${funcoesText || 'Nenhuma'}</div>
            </div>
            <div class="acoes">
                <button class="btn-acao" onclick="editarMinisterio('${min._id}')">Editar</button>
                <button class="btn-acao btn-excluir" onclick="excluirMinisterio('${min._id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function filtrarMinisterios(event) {
    const termo = event.target.value.toLowerCase();
    const filtrados = todosMinisterios.filter(min => {
        const nome = (min.nome || '').toLowerCase();
        const funcoes = (min.funcoes_obrigatorias || []).join(' ').toLowerCase();
        return nome.includes(termo) || funcoes.includes(termo);
    });
    renderizarMinisterios(filtrados);
}

function editarMinisterio(id) {
    const min = todosMinisterios.find(m => m._id === id);
    if (!min) return;

    document.getElementById('edit-id').value = min._id;
    document.getElementById('nome').value = min.nome;
    
    carregarFuncoes(min.funcoes_obrigatorias || []);

    document.getElementById('btn-submit').textContent = 'Atualizar Ministério';
    document.getElementById('btn-cancelar').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-ministerio').reset();
    document.getElementById('edit-id').value = '';
    carregarFuncoes([]); 
    document.getElementById('btn-submit').textContent = 'Salvar Ministério';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function excluirMinisterio(id) {
    if (!confirm('Tem certeza que deseja excluir este ministério?')) return;
    try {
        const response = await fetch(`/api/ministerios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Ministério excluído!');
            carregarMinisterios();
        } else {
            alert('Erro ao excluir ministério.');
        }
    } catch (error) {
        alert('Erro de conexão ao excluir.');
    }
}