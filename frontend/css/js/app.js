// Atende RF01 (CRUD Voluntários) e RF02 (CRUD Ministérios) via Fetch API
document.addEventListener('DOMContentLoaded', () => {
  carregarVoluntarios();

  const formVoluntario = document.getElementById('form-voluntario');
  const formMinisterio = document.getElementById('form-ministerio');

  if (formVoluntario) {
    formVoluntario.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('vol-nome').value;
      const ministerio = document.getElementById('vol-ministerio').value;
      const funcoes = document.getElementById('vol-funcoes').value.split(',').map(f => f.trim());

      const resposta = await fetch('/api/voluntarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ministerios: [ministerio], funcoes })
      });

      if (resposta.ok) {
        alert('Voluntário cadastrado com sucesso!');
        formVoluntario.reset();
        carregarVoluntarios();
      }
    });
  }

  if (formMinisterio) {
    formMinisterio.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('min-nome').value;
      const funcoes_obrigatorias = document.getElementById('min-funcoes').value.split(',').map(f => f.trim());

      const resposta = await fetch('/api/ministerios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, funcoes_obrigatorias })
      });

      if (resposta.ok) {
        alert('Ministério cadastrado com sucesso!');
        formMinisterio.reset();
      }
    });
  }
});

async function carregarVoluntarios() {
  const lista = document.getElementById('lista-voluntarios');
  if (!lista) return;

  try {
    const resposta = await fetch('/api/voluntarios');
    const voluntarios = await resposta.json();

    lista.innerHTML = '';
    voluntarios.forEach(vol => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span><strong>${vol.nome}</strong> (${vol.ministerios.join(', ')}) - Funções: ${vol.funcoes.join(', ')}</span>
        <button onclick="deletarVoluntario('${vol._id}')" class="btn" style="background:#e74c3c; color:white;">Excluir</button>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error('Erro ao carregar voluntários:', error);
  }
}

async function deletarVoluntario(id) {
  if (confirm('Deseja realmente excluir este voluntário?')) {
    await fetch(`/api/voluntarios/${id}`, { method: 'DELETE' });
    carregarVoluntarios();
  }
}