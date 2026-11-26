
document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // SELECIONAR OS INPUTS COM MÁSCARA
    // ========================================

    const campos = document.querySelectorAll('input[data-mask]');


    // ========================================
    // FUNÇÃO AUXILIAR
    // ========================================

    function somenteNumeros(valor) {
        return valor.replace(/\D/g, '');
    }


    // ========================================
    // MÁSCARA CPF
    // Formato: 000.000.000-00
    // ========================================

    function mascaraCPF(valor) {
        const numeros = somenteNumeros(valor).slice(0, 11);

        return numeros
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }


    // ========================================
    // MÁSCARA CNPJ
    // Formato: 00.000.000/0000-00
    // ========================================

    function mascaraCNPJ(valor) {
        const numeros = somenteNumeros(valor).slice(0, 14);

        return numeros
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }


    // ========================================
    // MÁSCARA TELEFONE
    // Celular: (21) 99999-9999
    // Fixo:    (21) 3333-3333
    // ========================================

    function mascaraTelefone(valor) {
        const numeros = somenteNumeros(valor).slice(0, 11);

        if (!numeros) {
            return '';
        }

        if (numeros.length <= 2) {
            return '(' + numeros;
        }

        const ddd = numeros.slice(0, 2);
        const numero = numeros.slice(2);

        const celular = numeros.length > 2 && numeros[2] === '9';
        const tamanho = celular ? 5 : 4;

        let resultado = '(' + ddd + ') ';

        if (numero.length <= tamanho) {
            resultado += numero;
        } else {
            resultado += numero.slice(0, tamanho)
                + '-'
                + numero.slice(tamanho);
        }

        return resultado;
    }


    // ========================================
    // MÁSCARA CEP
    // Formato: 00000-000
    // ========================================

    function mascaraCEP(valor) {
        const numeros = somenteNumeros(valor).slice(0, 8);

        if (numeros.length <= 5) {
            return numeros;
        }

        return numeros.slice(0, 5) + '-' + numeros.slice(5);
    }


    // ========================================
    // MÁSCARA ESTADO
    // Formato: RJ, SP, MG...
    // ========================================

    function mascaraEstado(valor) {
        return valor
            .replace(/[^a-zA-Z]/g, '')
            .toUpperCase()
            .slice(0, 2);
    }


    // ========================================
    // ASSOCIAR CADA MÁSCARA AO SEU INPUT
    // ========================================

    const mascaras = {
        cpf: mascaraCPF,
        cnpj: mascaraCNPJ,
        telefone: mascaraTelefone,
        cep: mascaraCEP,
        estado: mascaraEstado
    };

    const tamanhosMaximos = {
        cpf: 14,
        cnpj: 18,
        telefone: 15,
        cep: 9,
        estado: 2
    };


    // ========================================
    // APLICAR A MÁSCARA EM CADA INPUT
    // ========================================

    campos.forEach(function (campo) {

        const tipo = campo.dataset.mask.toLowerCase();
        const formatar = mascaras[tipo];

        if (!formatar) {
            return;
        }

        campo.maxLength = tamanhosMaximos[tipo];

        campo.addEventListener('input', function () {

            const inicio = campo.selectionStart;
            const valorAnterior = campo.value.slice(0, inicio ?? 0);

            const quantidadeNumeros = tipo === 'estado'
                ? valorAnterior.replace(/[^a-zA-Z]/g, '').length
                : somenteNumeros(valorAnterior).length;

            campo.value = formatar(campo.value);

            // Restaurar a posição do cursor
            let posicao = 0;
            let encontrados = 0;

            while (
                posicao < campo.value.length &&
                encontrados < quantidadeNumeros
            ) {
                const caractere = campo.value[posicao];

                const valido = tipo === 'estado'
                    ? /[a-zA-Z]/.test(caractere)
                    : /\d/.test(caractere);

                if (valido) {
                    encontrados++;
                }

                posicao++;
            }

            campo.setSelectionRange(posicao, posicao);

        });

        // Formatar valores já preenchidos
        campo.value = formatar(campo.value);

    });

});
