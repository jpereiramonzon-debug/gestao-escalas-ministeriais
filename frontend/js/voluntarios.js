let todosMinisterios = [];
let todosVoluntarios = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarMinisterios();
    carregarVoluntarios();

    document.getElementById('form-voluntario').addEventListener('submit', salvarVoluntario);
    document.getElementById('ministerio').addEventListener('change', () => atualizarFuncoesNaTela());
    document.getElementById('pesquisa').addEventListener('input', filtrarVoluntarios);
});

async function carregarMinisterios() {
    try {
        const response = await fetch('/api/ministerios');
        todosMinisterios = await response.json();
        
        const select = document.getElementById('ministerio');
        select.innerHTML = '<option value="">-- Selecione um ministério --</option>';
        
        todosMinisterios.forEach(min => {
            const option = document.createElement('option');
            option.value = min.nome; 
            option.textContent = min.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar ministérios:', error);
    }
}

function atualizarFuncoesNaTela(funcoesPreSelecionadas = []) {
    const nomeMinisterioSelecionado = document.getElementById('ministerio').value;
    const container = document.getElementById('container-funcoes-voluntario');
    
    container.innerHTML = '';

    if (!nomeMinisterioSelecionado) {
        container.innerHTML = '<em style="color: #888;">Selecione um ministério acima para carregar as funções...</em>';
        return;
    }

    const ministerio = todosMinisterios.find(m => m.nome === nomeMinisterioSelecionado);
    
    if (ministerio && ministerio.funcoes_obrigatorias && ministerio.funcoes_obrigatorias.length > 0) {
        ministerio.funcoes_obrigatorias.forEach(funcao => {
            const isChecked = funcoesPreSelecionadas.includes(funcao) ? 'checked' : '';
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `
                <input type="checkbox" name="funcao_apta" value="${funcao}" ${isChecked}>
                ${funcao}
            `;
            container.appendChild(label);
        });
    } else {
        container.innerHTML = '<em style="color: red;">Este ministério não possui funções cadastradas. Vá em Cadastrar Ministérios primeiro.</em>';
    }
}

async function salvarVoluntario(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('nome').value;
    const ministerio = document.getElementById('ministerio').value;
    
    // Captura as funções marcadas
    const checkboxesFuncoes = document.querySelectorAll('input[name="funcao_apta"]:checked');
    const funcoesSelecionadas = Array.from(checkboxesFuncoes).map(cb => cb.value);

    // Captura os dias da semana marcados
    const checkboxesDias = document.querySelectorAll('input[name="disponibilidade"]:checked');
    const diasSelecionados = Array.from(checkboxesDias).map(cb => cb.value);

    if (!ministerio) {
        alert('Selecione um ministério.'); return;
    }
    if (funcoesSelecionadas.length === 0) {
        alert('Selecione pelo menos uma função apta para o voluntário.'); return;
    }

    const voluntarioData = {
        nome: nome,
        ministerios: [ministerio], // Salva como array para compatibilidade com o backend
        funcoes: funcoesSelecionadas,
        disponibilidades: diasSelecionados, 
        restricoes: []
    };

    try {
        const url = id ? `/api/voluntarios/${id}` : '/api/voluntarios';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voluntarioData)
        });

        if (response.ok) {
            alert(id ? 'Voluntário atualizado!' : 'Voluntário cadastrado!');
            cancelarEdicao();
            carregarVoluntarios(); 
        } else {
            const data = await response.json();
            alert(`Erro: ${data.error || 'Falha ao salvar.'}`);
        }
    } catch (error) {
        console.error('Erro ao salvar voluntário:', error);
        alert('Erro de conexão ao salvar voluntário.');
    }
}

async function carregarVoluntarios() {
    const lista = document.getElementById('lista-voluntarios');
    try {
        lista.innerHTML = '<em>Carregando voluntários...</em>';
        const response = await fetch('/api/voluntarios');
        todosVoluntarios = await response.json();
        renderizarVoluntarios(todosVoluntarios);
    } catch (error) {
        console.error('Erro ao carregar voluntários:', error);
        lista.innerHTML = '<em style="color: red;">Erro ao carregar voluntários.</em>';
    }
}

function renderizarVoluntarios(voluntarios) {
    const lista = document.getElementById('lista-voluntarios');
    lista.innerHTML = '';

    if (voluntarios.length === 0) {
        lista.innerHTML = '<em>Nenhum voluntário encontrado.</em>';
        return;
    }

    voluntarios.forEach(vol => {
        const minText = (vol.ministerios || []).join(', ');
        const funcText = (vol.funcoes || []).join(', ');
        
        // Se a lista estiver vazia, escreve "Sempre Disponível", se não, junta os dias com vírgula
        let dispText = (vol.disponibilidades && vol.disponibilidades.length > 0) 
            ? vol.disponibilidades.join(', ') 
            : 'Sempre Disponível';

        const div = document.createElement('div');
        div.className = 'item-lista';
        div.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${vol.nome}</div>
                <div class="item-detalhes">
                    <strong>Ministério(s):</strong> ${minText || 'Nenhum'}<br>
                    <strong>Funções Aptas:</strong> ${funcText || 'Nenhuma'}<br>
                    <strong>Disponibilidade:</strong> <span style="color:#27ae60;">${dispText}</span>
                </div>
            </div>
            <div class="acoes">
                <button class="btn-acao" onclick="editarVoluntario('${vol._id}')">Editar</button>
                <button class="btn-acao btn-excluir" onclick="excluirVoluntario('${vol._id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function filtrarVoluntarios(event) {
    const termo = event.target.value.toLowerCase();
    const filtrados = todosVoluntarios.filter(vol => {
        const nome = (vol.nome || '').toLowerCase();
        const ministerios = (vol.ministerios || []).join(' ').toLowerCase();
        const funcoes = (vol.funcoes || []).join(' ').toLowerCase();
        return nome.includes(termo) || ministerios.includes(termo) || funcoes.includes(termo);
    });
    renderizarVoluntarios(filtrados);
}

function editarVoluntario(id) {
    const vol = todosVoluntarios.find(v => v._id === id);
    if (!vol) return;

    document.getElementById('edit-id').value = vol._id;
    document.getElementById('nome').value = vol.nome;
    
    const minSelect = document.getElementById('ministerio');
    if (vol.ministerios && vol.ministerios.length > 0) {
        minSelect.value = vol.ministerios[0];
    }

    // Carrega as funções na tela e já marca as que o voluntário possui
    atualizarFuncoesNaTela(vol.funcoes || []);

    // Marca os dias da semana corretos
    const checkboxesDias = document.querySelectorAll('input[name="disponibilidade"]');
    checkboxesDias.forEach(cb => {
        cb.checked = vol.disponibilidades && vol.disponibilidades.includes(cb.value);
    });

    document.getElementById('btn-submit').textContent = 'Atualizar Voluntário';
    document.getElementById('btn-cancelar').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-voluntario').reset();
    document.getElementById('edit-id').value = '';
    
    // Limpa a tela de funções
    document.getElementById('container-funcoes-voluntario').innerHTML = '<em style="color: #888;">Selecione um ministério acima para carregar as funções...</em>';
    
    // Desmarca todos os dias
    const checkboxesDias = document.querySelectorAll('input[name="disponibilidade"]');
    checkboxesDias.forEach(cb => cb.checked = false);

    document.getElementById('btn-submit').textContent = 'Salvar Voluntário';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function excluirVoluntario(id) {
    if (!confirm('Tem certeza que deseja excluir este voluntário?')) return;

    try {
        const response = await fetch(`/api/voluntarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Voluntário excluído!');
            carregarVoluntarios();
        } else {
            alert('Erro ao excluir voluntário.');
        }
    } catch (error) {
        alert('Erro de conexão ao excluir.');
    }
}