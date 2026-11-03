let todosVoluntarios = [];
let cultosAtuais = []; 

document.addEventListener('DOMContentLoaded', () => {
    carregarMinisteriosParaEscala();
    carregarVoluntarios(); 
    carregarEscalas();

    document.getElementById('select-ministerio-gerar').addEventListener('change', renderizarTabelaEscalas);
    document.getElementById('input-ano').addEventListener('change', carregarEscalas);
    document.getElementById('input-mes').addEventListener('change', carregarEscalas);
});

async function carregarVoluntarios() {
    try {
        const response = await fetch('/api/voluntarios');
        if (response.ok) {
            todosVoluntarios = await response.json();
        }
    } catch (error) {
        console.error('Erro ao carregar voluntários:', error);
    }
}

async function carregarMinisteriosParaEscala() {
    try {
        const response = await fetch('/api/ministerios');
        const ministerios = await response.json();
        const select = document.getElementById('select-ministerio-gerar');
        
        select.innerHTML = '<option value="">-- Todos os Ministérios --</option>';
        
        ministerios.forEach(min => {
            const option = document.createElement('option');
            option.value = min._id; 
            option.textContent = min.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar ministérios:', error);
    }
}

async function gerarEscala() {
    const ministerioId = document.getElementById('select-ministerio-gerar').value;
    const ano = document.getElementById('input-ano').value;
    const mes = document.getElementById('input-mes').value;
    
    if (!ministerioId || !ano || !mes) {
        alert('Por favor, preencha o ano, mês e selecione um ministério.');
        return;
    }

    try {
        const response = await fetch('/api/escalas/gerar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ano: Number(ano), mes: Number(mes), ministerio_id: ministerioId })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Escala gerada com sucesso!');
            carregarEscalas(); 
        } else {
            alert(`Erro: ${data.error || 'Não foi possível gerar'}`);
        }
    } catch (error) {
        console.error('Erro ao gerar escala:', error);
        alert(`Erro de conexão ao tentar gerar a escala.`);
    }
}

function formatarDataParaExtenso(dataString) {
    if (!dataString) return '';
    const partes = dataString.split('-'); 
    if (partes.length !== 3) return dataString;

    const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const mes = meses[dataObj.getMonth()];
    const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    const diaSemana = diasSemana[dataObj.getDay()];

    return `${dia} ${mes} ${diaSemana}`;
}

async function carregarEscalas() {
    try {
        const ano = document.getElementById('input-ano').value;
        const mes = document.getElementById('input-mes').value;
        
        const response = await fetch(`/api/escalas?ano=${ano}&mes=${mes}`);
        cultosAtuais = await response.json(); 
        
        renderizarTabelaEscalas(); 
    } catch (error) {
        console.error('Erro ao carregar escalas:', error);
    }
}

function renderizarTabelaEscalas() {
    const tbody = document.getElementById('tbody-escalas');
    tbody.innerHTML = '';
    
    const ministerioSelecionado = document.getElementById('select-ministerio-gerar').value;
    const ministeriosDoMes = new Map();

    cultosAtuais.forEach(culto => {
        const dataFormatada = formatarDataParaExtenso(culto.data_culto);
        const dataHorario = `${dataFormatada} às ${culto.horario}`;

        if (culto.ministerios && culto.ministerios.length > 0) {
            culto.ministerios.forEach(min => {
                
                if (ministerioSelecionado && min.ministerio_id !== ministerioSelecionado) {
                    return; 
                }
                
                if (!ministeriosDoMes.has(min.ministerio_id)) {
                    ministeriosDoMes.set(min.ministerio_id, {
                        nome: min.ministerio_nome,
                        finalizado: min.finalizado
                    });
                }

                const tr = document.createElement('tr');
                let htmlVagas = '<div style="display:flex; flex-direction:column;">';
                
                min.vagas_preenchidas.forEach(vaga => {
                    const styleVago = vaga.nome === 'VAGO' ? 'color: red; font-weight: bold;' : '';
                    
                    let btnEditarHtml = '';
                    if (!min.finalizado) {
                        btnEditarHtml = `<button class="btn-editar" onclick="abrirModalEditar('${culto._id}', '${min.ministerio_id}', '${vaga.funcao}', '${vaga.nome}', '${dataHorario}')">✏️ Editar</button>`;
                    }
                    
                    htmlVagas += `
                        <div class="vaga-item">
                            <span><strong>${vaga.funcao}:</strong> <span style="${styleVago}">${vaga.nome}</span></span>
                            ${btnEditarHtml}
                        </div>
                    `;
                });
                htmlVagas += '</div>';

                const statusTxt = min.finalizado 
                    ? '<span style="color:green; font-weight:bold;">✅ Salva</span>' 
                    : '<span style="color:#f39c12; font-weight:bold;">⚠️ Rascunho</span>';

                tr.innerHTML = `
                    <td style="vertical-align: middle; text-align: center;">${dataHorario}</td>
                    <td style="vertical-align: middle; text-align: center;"><strong>${min.ministerio_nome}</strong></td>
                    <td>${htmlVagas}</td>
                    <td style="vertical-align: middle; text-align: center;">${statusTxt}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    });

    renderizarPainelAcoes(ministeriosDoMes);
}

function renderizarPainelAcoes(ministeriosDoMes) {
    const painel = document.getElementById('painel-acoes');
    const listaAcoes = document.getElementById('lista-acoes-mes');
    listaAcoes.innerHTML = '';

    if (ministeriosDoMes.size === 0) {
        painel.style.display = 'none';
        return;
    }

    painel.style.display = 'block';

    ministeriosDoMes.forEach((dados, id) => {
        const div = document.createElement('div');
        div.className = 'linha-acao';
        
        let statusHtml = dados.finalizado 
            ? '<span style="color:green; font-weight:bold; margin-right:15px;">Status: ✅ Salva</span>' 
            : '<span style="color:#f39c12; font-weight:bold; margin-right:15px;">Status: ⚠️ Rascunho</span>';
        
        // MODIFICADO: Chama o Modal para escolher o voluntário
        let botaoHtml = dados.finalizado
            ? `<button style="background-color:#25D366; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:13px;" onclick="abrirModalWhatsApp('${id}', '${dados.nome}')">📲 WhatsApp (Individual)</button>`
            : `<button class="btn-salvar-mes" onclick="finalizarMinisterioEscala('${id}')">💾 Salvar Escala do Mês</button>`;

        div.innerHTML = `
            <div style="font-size: 16px;"><strong>${dados.nome}</strong></div>
            <div>${statusHtml} ${botaoHtml}</div>
        `;
        listaAcoes.appendChild(div);
    });
}

// === LÓGICA DO WHATSAPP INDIVIDUAL ===
function abrirModalWhatsApp(ministerioId, nomeMinisterio) {
    document.getElementById('zap-ministerio-id').value = ministerioId;
    document.getElementById('zap-ministerio-nome').value = nomeMinisterio;
    
    const select = document.getElementById('select-voluntario-whatsapp');
    select.innerHTML = '<option value="">-- Selecione o Voluntário --</option>';
    
    // Busca na memória quais voluntários realmente têm vaga neste ministério
    const voluntariosEscalados = new Map();
    
    cultosAtuais.forEach(culto => {
        const bloco = culto.ministerios.find(m => String(m.ministerio_id) === String(ministerioId));
        if (bloco) {
            bloco.vagas_preenchidas.forEach(vaga => {
                if (vaga.voluntario_id && vaga.nome !== 'VAGO') {
                    voluntariosEscalados.set(String(vaga.voluntario_id), vaga.nome);
                }
            });
        }
    });
    
    if (voluntariosEscalados.size === 0) {
        alert('Nenhum voluntário escalado neste ministério (todas as vagas estão livres).');
        return;
    }
    
    // Popula o dropdown apenas com as pessoas que tiraram escala
    voluntariosEscalados.forEach((nome, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = nome;
        select.appendChild(option);
    });
    
    document.getElementById('modal-whatsapp').style.display = 'flex';
}

function fecharModalWhatsApp() {
    document.getElementById('modal-whatsapp').style.display = 'none';
}

function gerarMensagemWhatsApp() {
    const select = document.getElementById('select-voluntario-whatsapp');
    const voluntarioId = select.value;
    const voluntarioNome = select.options[select.selectedIndex]?.textContent;
    const ministerioId = document.getElementById('zap-ministerio-id').value;
    const nomeMinisterio = document.getElementById('zap-ministerio-nome').value;
    const mesAtual = document.getElementById('input-mes').value;
    const anoAtual = document.getElementById('input-ano').value;
    
    if (!voluntarioId) {
        alert('Por favor, selecione um voluntário na lista.');
        return;
    }
    
    let mensagem = `Olá *${voluntarioNome}*! 👋\n\nSegue a sua escala exclusiva para o ministério *${nomeMinisterio.toUpperCase()}* (${mesAtual}/${anoAtual}):\n\n`;
    
    let encontrouVagas = false;
    
    cultosAtuais.forEach(culto => {
        const bloco = culto.ministerios.find(m => String(m.ministerio_id) === String(ministerioId));
        if (bloco) {
            // Procura se ESSE voluntário foi escalado neste culto específico
            const vagasDoVoluntario = bloco.vagas_preenchidas.filter(v => String(v.voluntario_id) === String(voluntarioId));
            
            if (vagasDoVoluntario.length > 0) {
                encontrouVagas = true;
                const dataFormatada = formatarDataParaExtenso(culto.data_culto);
                mensagem += `🗓️ *${dataFormatada} às ${culto.horario}*\n`;
                vagasDoVoluntario.forEach(v => {
                    mensagem += `   🔹 Função: ${v.funcao}\n`;
                });
                mensagem += `\n`; // Quebra de linha entre os dias
            }
        }
    });
    
    mensagem += `Deus te abençoe! 🙏`;
    
    // Abre o zap zap
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    
    fecharModalWhatsApp();
}
// =====================================

async function finalizarMinisterioEscala(ministerioId) {
    const ano = document.getElementById('input-ano').value;
    const mes = document.getElementById('input-mes').value;
    
    try {
        const response = await fetch(`/api/escalas/mes/${ano}/${mes}/ministerio/${ministerioId}/finalizar`, {
            method: 'POST'
        });
        
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            alert(`ERRO ${response.status}: A rota de salvar não foi encontrada. REINICIE o seu servidor Node.js (CTRL+C e npm start).`);
            return;
        }
        
        if (response.ok) {
            alert('Escala do ministério salva com sucesso para este mês!');
            carregarEscalas();
        } else {
            alert(`Atenção: ${data.error}`);
        }
    } catch (error) {
        alert(`Erro de conexão ao tentar salvar: ${error.message}`);
    }
}

function abrirModalEditar(escalaId, ministerioId, funcao, nomeAtual, dataHorario) {
    document.getElementById('edit-escala-id').value = escalaId;
    document.getElementById('edit-ministerio-id').value = ministerioId;
    document.getElementById('edit-funcao').value = funcao;
    
    document.getElementById('edit-info').innerHTML = 
        `<strong>Data:</strong> ${dataHorario}<br>
         <strong>Função:</strong> ${funcao}<br>
         <strong>Escalado Atual:</strong> <span style="color:blue;">${nomeAtual}</span>`;
    
    const select = document.getElementById('select-novo-voluntario');
    select.innerHTML = ''; 
    
    const voluntariosAptos = todosVoluntarios.filter(vol => {
        return vol.funcoes && vol.funcoes.includes(funcao);
    });

    if (voluntariosAptos.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhum voluntário apto para esta função";
        select.appendChild(option);
    } else {
        voluntariosAptos.forEach(vol => {
            const option = document.createElement('option');
            option.value = vol._id;
            option.textContent = vol.nome;
            select.appendChild(option);
        });
    }

    document.getElementById('modal-editar').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-editar').style.display = 'none';
}

async function salvarEdicaoVaga() {
    const escalaId = document.getElementById('edit-escala-id').value;
    const ministerioId = document.getElementById('edit-ministerio-id').value;
    const funcao = document.getElementById('edit-funcao').value;
    const voluntarioIdSelecionado = document.getElementById('select-novo-voluntario').value;
    
    if (!voluntarioIdSelecionado) {
        alert('É obrigatório selecionar um voluntário. A escala não pode ficar vaga.');
        return;
    }
    
    let novo_nome = 'VAGO';
    const volEncontrado = todosVoluntarios.find(v => v._id === voluntarioIdSelecionado);
    if (volEncontrado) {
        novo_nome = volEncontrado.nome;
    }

    try {
        const response = await fetch(`/api/escalas/${escalaId}/ministerio/${ministerioId}/funcao/${funcao}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                novo_voluntario_id: voluntarioIdSelecionado, 
                novo_nome: novo_nome, 
                forcar: true 
            })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            alert(`Erro ${response.status}: A rota não foi encontrada.`);
            return;
        }

        if (response.ok) {
            alert('Voluntário atualizado com sucesso!');
            fecharModal();
            carregarEscalas(); 
        } else {
            alert(`Erro: ${data.error}`);
        }
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        alert('Erro de conexão ao salvar a edição.');
    }
}