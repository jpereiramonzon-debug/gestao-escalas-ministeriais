// Gera automaticamente as datas de culto do mês, conforme calendário fixo:
// Terças, Sextas e Domingos às 19:30, mais um culto extra às 10:00
// no primeiro Domingo de cada mês.

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function formatarData(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function gerarCultosDoMes(ano, mes) {
  const cultos = [];
  const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
  let primeiroDomingoEncontrado = false;

  for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
    const dataAtual = new Date(ano, mes - 1, dia);
    const diaSemanaIndex = dataAtual.getDay();
    const diaSemanaNome = DIAS_SEMANA[diaSemanaIndex];

    if (diaSemanaIndex === 2 || diaSemanaIndex === 5) {
      cultos.push({ data: formatarData(dataAtual), diaSemana: diaSemanaNome, horario: '19:30' });
    }

    if (diaSemanaIndex === 0) {
      cultos.push({ data: formatarData(dataAtual), diaSemana: diaSemanaNome, horario: '19:30' });
      if (!primeiroDomingoEncontrado) {
        cultos.push({ data: formatarData(dataAtual), diaSemana: diaSemanaNome, horario: '10:00' });
        primeiroDomingoEncontrado = true;
      }
    }
  }

  cultos.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  return cultos;
}

export function identificadorDisponibilidade(culto) {
  if (culto.diaSemana === 'Domingo' && culto.horario === '10:00') {
    return 'Domingo 10h';
  }
  return culto.diaSemana;
}