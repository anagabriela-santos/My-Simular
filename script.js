const SUPABASE_URL = "https://dwncardrgxpkzmpcqnyr.supabase.co";
const SUPABASE_KEY = "sb_publishable_z164SvM5IhyZGgOzgmrT7w_ojMFZNxo";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase conectado!");

let usuarioAtual = null;
let simuladoAtual = null;
let questoesAtuais = [];
let respostas = [];
let questaoAtual = 0;


async function iniciarSistema() {

    const { data } = await supabaseClient.auth.getSession();

    const parametros =
        new URLSearchParams(window.location.search);

    const idCompartilhado =
        parametros.get("simulado");

    if (idCompartilhado) {

        await abrirSimuladoCompartilhado(idCompartilhado);

        return;
    }

    if (data.session) {

        usuarioAtual = data.session.user;

        atualizarUsuario();

        mostrarTela("inicio");

        carregarSimulados();

    } else {

        mostrarTela("login");

    }
}


function atualizarUsuario() {

    if (!usuarioAtual) return;

    const email = usuarioAtual.email || "USUÁRIO";

    document.getElementById("usuarioNome").textContent =
        email;

    document.getElementById("nomeDashboard").textContent =
        email.split("@")[0].toUpperCase();

    document.getElementById("avatarUsuario").textContent =
        email.charAt(0).toUpperCase();

}


function mostrarTela(nome) {

    document.querySelectorAll(".tela").forEach(function(tela) {

        tela.classList.remove("ativa");

    });

    const tela =
        document.getElementById(nome);

    if (tela) {

        tela.classList.add("ativa");

    }

}


async function entrar() {

    const email =
        document.getElementById("email").value.trim();

    const senha =
        document.getElementById("senha").value;

    const mensagem =
        document.getElementById("mensagemLogin");

    if (!email || !senha) {

        mensagem.textContent =
            "Preencha o e-mail e a senha.";

        return;
    }

    mensagem.textContent =
        "ENTRANDO NO SISTEMA...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: senha

        });

    if (error) {

        mensagem.textContent =
            "Erro: " + error.message;

        return;
    }

    usuarioAtual =
        data.user;

    atualizarUsuario();

    mensagem.textContent = "";

    mostrarTela("inicio");

    carregarSimulados();

}


async function cadastrar() {

    const email =
        document.getElementById("email").value.trim();

    const senha =
        document.getElementById("senha").value;

    const mensagem =
        document.getElementById("mensagemLogin");

    if (!email || !senha) {

        mensagem.textContent =
            "Digite um e-mail e uma senha.";

        return;
    }

    if (senha.length < 6) {

        mensagem.textContent =
            "A senha precisa ter pelo menos 6 caracteres.";

        return;
    }

    mensagem.textContent =
        "CRIANDO CONTA...";

    const { error } =
        await supabaseClient.auth.signUp({

            email: email,
            password: senha

        });

    if (error) {

        mensagem.textContent =
            "Erro: " + error.message;

        return;
    }

    mensagem.textContent =
        "Conta criada! Verifique seu e-mail.";

}


async function sair() {

    await supabaseClient.auth.signOut();

    usuarioAtual = null;

    mostrarTela("login");

}


async function carregarSimulados() {

    if (!usuarioAtual) return;

    const { data, error } =
        await supabaseClient
            .from("simulados")
            .select("*")
            .eq("usuario_id", usuarioAtual.id)
            .order("criado_em", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;
    }

    const lista =
        document.getElementById("listaSimulados");

    const listaPagina =
        document.getElementById("listaSimuladosPagina");

    lista.innerHTML = "";

    listaPagina.innerHTML = "";

    document.getElementById("totalSimulados").textContent =
        data.length;

    let totalQuestoes = 0;

    data.forEach(function(simulado) {

        totalQuestoes +=
            Number(simulado.quantidade_questoes || 0);

    });

    document.getElementById("totalQuestoes").textContent =
        totalQuestoes;

    if (data.length === 0) {

        const vazio = `

            <div class="sem-simulados">

                <div class="sem-icone">
                    ◈
                </div>

                <h3>
                    NENHUM SIMULADO ENCONTRADO
                </h3>

                <p>
                    Crie seu primeiro desafio.
                </p>

                <button
                    class="botao-criar"
                    onclick="mostrarTela('criar')"
                >
                    CRIAR SIMULADO
                </button>

            </div>

        `;

        lista.innerHTML = vazio;

        listaPagina.innerHTML = vazio;

        return;
    }

    data.forEach(function(simulado) {

        const card =
            criarCardSimulado(simulado);

        lista.innerHTML += card;

        listaPagina.innerHTML += card;

    });

}


function criarCardSimulado(simulado) {

    return `

        <div class="card-simulado">

            <div class="simulado-card-icon">
                ?
            </div>

            <div class="simulado-card-info">

                <span>
                    ${simulado.materia || "MATÉRIA"}
                </span>

                <h3>
                    ${escaparHTML(simulado.titulo)}
                </h3>

                <p>
                    ${simulado.quantidade_questoes}
                    QUESTÕES
                </p>

            </div>

            <div class="simulado-card-acoes">

                <button
                    class="btn-fazer"
                    onclick="abrirSimulado(${simulado.id})"
                >
                    FAZER
                </button>

                <button
                    class="btn-compartilhar"
                    onclick="compartilharSimulado(${simulado.id})"
                >
                    COMPARTILHAR
                </button>

                <button
                    class="btn-excluir"
                    onclick="excluirSimulado(${simulado.id})"
                >
                    EXCLUIR
                </button>

            </div>

        </div>

    `;
}


function criarCamposQuestoes() {

    const titulo =
        document.getElementById("tituloSimulado").value.trim();

    const materia =
        document.getElementById("materiaSimulado").value.trim();

    const quantidade =
        Number(
            document.getElementById("quantidadeQuestoes").value
        );

    if (!titulo || !materia || quantidade < 1) {

        alert(
            "Preencha título, matéria e quantidade de questões."
        );

        return;
    }

    if (quantidade > 50) {

        alert(
            "O máximo é 50 questões."
        );

        return;
    }

    const area =
        document.getElementById("areaPerguntas");

    area.innerHTML = "";

    for (let i = 1; i <= quantidade; i++) {

        area.innerHTML += `

            <div class="bloco-pergunta">

                <div class="pergunta-topo">

                    <div class="numero-pergunta">
                        ${String(i).padStart(2, "0")}
                    </div>

                    <div>

                        <span>
                            QUESTION // ${i}
                        </span>

                        <h2>
                            QUESTÃO ${i}
                        </h2>

                    </div>

                </div>

                <label>
                    PERGUNTA
                </label>

                <textarea
                    id="pergunta_${i}"
                    placeholder="Digite a pergunta..."
                    rows="3"
                ></textarea>

                <div class="alternativas-grid">

                    <div>

                        <label>
                            ALTERNATIVA A
                        </label>

                        <input
                            id="a_${i}"
                            type="text"
                            placeholder="Digite a alternativa A"
                        >

                    </div>

                    <div>

                        <label>
                            ALTERNATIVA B
                        </label>

                        <input
                            id="b_${i}"
                            type="text"
                            placeholder="Digite a alternativa B"
                        >

                    </div>

                    <div>

                        <label>
                            ALTERNATIVA C
                        </label>

                        <input
                            id="c_${i}"
                            type="text"
                            placeholder="Digite a alternativa C"
                        >

                    </div>

                    <div>

                        <label>
                            ALTERNATIVA D
                        </label>

                        <input
                            id="d_${i}"
                            type="text"
                            placeholder="Digite a alternativa D"
                        >

                    </div>

                </div>

                <label>
                    RESPOSTA CORRETA
                </label>

                <select id="resposta_${i}">

                    <option value="">
                        Selecione a resposta
                    </option>

                    <option value="A">
                        A
                    </option>

                    <option value="B">
                        B
                    </option>

                    <option value="C">
                        C
                    </option>

                    <option value="D">
                        D
                    </option>

                </select>

            </div>

        `;
    }

    area.innerHTML += `

        <button
            class="botao-principal botao-salvar"
            onclick="salvarSimulado()"
        >
            SALVAR SIMULADO
        </button>

    `;

    area.scrollIntoView({
        behavior: "smooth"
    });

}


async function salvarSimulado() {

    if (!usuarioAtual) {

        alert(
            "Você precisa estar logado."
        );

        return;
    }

    const titulo =
        document.getElementById("tituloSimulado").value.trim();

    const materia =
        document.getElementById("materiaSimulado").value.trim();

    const quantidade =
        Number(
            document.getElementById("quantidadeQuestoes").value
        );

    const questoes = [];

    for (let i = 1; i <= quantidade; i++) {

        const pergunta =
            document.getElementById(`pergunta_${i}`).value.trim();

        const a =
            document.getElementById(`a_${i}`).value.trim();

        const b =
            document.getElementById(`b_${i}`).value.trim();

        const c =
            document.getElementById(`c_${i}`).value.trim();

        const d =
            document.getElementById(`d_${i}`).value.trim();

        const resposta =
            document.getElementById(`resposta_${i}`).value;

        if (
            !pergunta ||
            !a ||
            !b ||
            !c ||
            !d ||
            !resposta
        ) {

            alert(
                `Preencha todos os campos da questão ${i}.`
            );

            return;
        }

        questoes.push({

            pergunta: pergunta,
            alternativa_a: a,
            alternativa_b: b,
            alternativa_c: c,
            alternativa_d: d,
            resposta_correta: resposta

        });

    }

    const { data: simulado, error } =
        await supabaseClient
            .from("simulados")
            .insert({

                usuario_id: usuarioAtual.id,
                titulo: titulo,
                materia: materia,
                quantidade_questoes: quantidade

            })
            .select()
            .single();

    if (error) {

        alert(
            "Erro ao salvar o simulado: " +
            error.message
        );

        return;
    }

    const questoesBanco =
        questoes.map(function(questao) {

            return {

                simulado_id: simulado.id,
                pergunta: questao.pergunta,
                alternativa_a: questao.alternativa_a,
                alternativa_b: questao.alternativa_b,
                alternativa_c: questao.alternativa_c,
                alternativa_d: questao.alternativa_d,
                resposta_correta: questao.resposta_correta

            };

        });

    const { error: erroQuestoes } =
        await supabaseClient
            .from("questoes")
            .insert(questoesBanco);

    if (erroQuestoes) {

        await supabaseClient
            .from("simulados")
            .delete()
            .eq("id", simulado.id);

        alert(
            "Erro ao salvar as questões: " +
            erroQuestoes.message
        );

        return;
    }

    alert(
        "SIMULADO SALVO COM SUCESSO!"
    );

    document.getElementById("tituloSimulado").value = "";
    document.getElementById("materiaSimulado").value = "";
    document.getElementById("quantidadeQuestoes").value = "";
    document.getElementById("areaPerguntas").innerHTML = "";

    mostrarTela("simulados");

    carregarSimulados();

}


async function abrirSimulado(id) {

    const { data: simulado, error } =
        await supabaseClient
            .from("simulados")
            .select("*")
            .eq("id", id)
            .single();

    if (error || !simulado) {

        alert(
            "Não foi possível encontrar o simulado."
        );

        return;
    }

    const { data: questoes, error: erroQuestoes } =
        await supabaseClient
            .from("questoes")
            .select("*")
            .eq("simulado_id", id)
            .order("id");

    if (erroQuestoes) {

        alert(
            "Erro ao carregar as questões: " +
            erroQuestoes.message
        );

        return;
    }

    if (!questoes || questoes.length === 0) {

        alert(
            "Este simulado ainda não possui questões."
        );

        return;
    }

    simuladoAtual = simulado;

    questoesAtuais = questoes;

    respostas = [];

    questaoAtual = 0;

    document.getElementById("tituloRealizar").textContent =
        simulado.titulo;

    document.getElementById("totalQuestoesRealizar").textContent =
        questoes.length;

    mostrarTela("realizar");

    mostrarQuestao();

}


function mostrarQuestao() {

    const questao =
        questoesAtuais[questaoAtual];

    if (!questao) return;

    document.getElementById("numeroQuestao").textContent =
        questaoAtual + 1;

    const progresso =
        ((questaoAtual + 1) / questoesAtuais.length) * 100;

    document.getElementById("barraProgresso").style.width =
        progresso + "%";

    const area =
        document.getElementById("areaRealizar");

    area.innerHTML = `

        <span class="questao-label">
            QUESTION // ${String(questaoAtual + 1).padStart(2, "0")}
        </span>

        <h2>
            ${escaparHTML(questao.pergunta)}
        </h2>

        <button
            class="alternativa ${respostas[questaoAtual] === "A" ? "selecionada" : ""}"
            onclick="selecionarResposta('A')"
        >

            <span class="letra">
                A
            </span>

            ${escaparHTML(questao.alternativa_a)}

        </button>


        <button
            class="alternativa ${respostas[questaoAtual] === "B" ? "selecionada" : ""}"
            onclick="selecionarResposta('B')"
        >

            <span class="letra">
                B
            </span>

            ${escaparHTML(questao.alternativa_b)}

        </button>


        <button
            class="alternativa ${respostas[questaoAtual] === "C" ? "selecionada" : ""}"
            onclick="selecionarResposta('C')"
        >

            <span class="letra">
                C
            </span>

            ${escaparHTML(questao.alternativa_c)}

        </button>


        <button
            class="alternativa ${respostas[questaoAtual] === "D" ? "selecionada" : ""}"
            onclick="selecionarResposta('D')"
        >

            <span class="letra">
                D
            </span>

            ${escaparHTML(questao.alternativa_d)}

        </button>


        <div style="margin-top:25px; display:flex; justify-content:space-between; gap:15px;">

            <button
                class="botao-voltar"
                onclick="questaoAnterior()"
                ${questaoAtual === 0 ? "disabled" : ""}
            >
                ← ANTERIOR
            </button>

            ${
                questaoAtual < questoesAtuais.length - 1
                ?
                `
                <button
                    class="botao-principal"
                    onclick="proximaQuestao()"
                >
                    PRÓXIMA →
                </button>
                `
                :
                `
                <button
                    class="botao-principal"
                    onclick="finalizarSimulado()"
                >
                    FINALIZAR
                </button>
                `
            }

        </div>

    `;

}


function selecionarResposta(resposta) {

    respostas[questaoAtual] =
        resposta;

    mostrarQuestao();

}


function proximaQuestao() {

    if (!respostas[questaoAtual]) {

        alert(
            "Selecione uma alternativa."
        );

        return;
    }

    if (
        questaoAtual <
        questoesAtuais.length - 1
    ) {

        questaoAtual++;

        mostrarQuestao();

    }

}


function questaoAnterior() {

    if (questaoAtual > 0) {

        questaoAtual--;

        mostrarQuestao();

    }

}


function finalizarSimulado() {

    if (!respostas[questaoAtual]) {

        alert(
            "Selecione uma alternativa."
        );

        return;
    }

    let acertos = 0;

    const resultados = [];

    questoesAtuais.forEach(function(questao, index) {

        const acertou =
            respostas[index] ===
            questao.resposta_correta;

        if (acertou) {

            acertos++;

        }

        resultados.push({

            questao: questao,
            respostaUsuario: respostas[index],
            acertou: acertou

        });

    });

    const porcentagem =
        Math.round(
            (acertos / questoesAtuais.length) * 100
        );

    document.getElementById("notaFinal").textContent =
        porcentagem + "%";

    document.getElementById("acertosFinal").textContent =
        `${acertos} de ${questoesAtuais.length}`;

    const lista =
        document.getElementById("listaResultados");

    lista.innerHTML = "";

    resultados.forEach(function(item, index) {

        const classe =
            item.acertou
            ? "correta"
            : "errada";

        const status =
            item.acertou
            ? "CORRETA"
            : "INCORRETA";

        lista.innerHTML += `

            <div class="resultado-questao ${classe}">

                <div class="resultado-questao-topo">

                    <strong>
                        QUESTÃO ${index + 1}
                    </strong>

                    <strong>
                        ${status}
                    </strong>

                </div>

                <h3>
                    ${escaparHTML(item.questao.pergunta)}
                </h3>

                <p>
                    Sua resposta:
                    ${item.respostaUsuario || "Não respondida"}
                </p>

                <p>
                    Resposta correta:
                    ${item.questao.resposta_correta}
                </p>

            </div>

        `;

    });

    mostrarTela("resultado");

}


async function excluirSimulado(id) {

    const confirmar =
        confirm(
            "Deseja realmente excluir este simulado?"
        );

    if (!confirmar) return;

    const { error } =
        await supabaseClient
            .from("simulados")
            .delete()
            .eq("id", id)
            .eq("usuario_id", usuarioAtual.id);

    if (error) {

        alert(
            "Erro ao excluir: " +
            error.message
        );

        return;
    }

    carregarSimulados();

}


async function compartilharSimulado(id) {

    const link =
        window.location.origin +
        window.location.pathname +
        "?simulado=" +
        id;

    try {

        await navigator.clipboard.writeText(link);

        alert(
            "LINK COPIADO!\n\n" +
            "Agora você pode enviar esse link para outra pessoa."
        );

    } catch {

        prompt(
            "Copie o link do simulado:",
            link
        );

    }

}


async function abrirSimuladoCompartilhado(id) {

    const { data: simulado, error } =
        await supabaseClient
            .from("simulados")
            .select("*")
            .eq("id", id)
            .single();

    if (error || !simulado) {

        mostrarTela("login");

        alert(
            "Simulado compartilhado não encontrado."
        );

        return;
    }

    const { data: questoes, error: erroQuestoes } =
        await supabaseClient
            .from("questoes")
            .select("*")
            .eq("simulado_id", id)
            .order("id");

    if (erroQuestoes || !questoes || questoes.length === 0) {

        mostrarTela("login");

        alert(
            "Não foi possível carregar este simulado."
        );

        return;
    }

    simuladoAtual =
        simulado;

    questoesAtuais =
        questoes;

    respostas = [];

    questaoAtual = 0;

    document.getElementById("tituloCompartilhado").textContent =
        simulado.titulo;

    mostrarTela("compartilhado");

    mostrarQuestaoCompartilhada();

}


function mostrarQuestaoCompartilhada() {

    const questao =
        questoesAtuais[questaoAtual];

    const area =
        document.getElementById("areaCompartilhado");

    area.innerHTML = `

        <span class="questao-label">
            SHARED // QUESTION ${questaoAtual + 1}
        </span>

        <h2>
            ${escaparHTML(questao.pergunta)}
        </h2>

        <button
            class="alternativa"
            onclick="responderCompartilhado('A')"
        >
            <span class="letra">A</span>
            ${escaparHTML(questao.alternativa_a)}
        </button>

        <button
            class="alternativa"
            onclick="responderCompartilhado('B')"
        >
            <span class="letra">B</span>
            ${escaparHTML(questao.alternativa_b)}
        </button>

        <button
            class="alternativa"
            onclick="responderCompartilhado('C')"
        >
            <span class="letra">C</span>
            ${escaparHTML(questao.alternativa_c)}
        </button>

        <button
            class="alternativa"
            onclick="responderCompartilhado('D')"
        >
            <span class="letra">D</span>
            ${escaparHTML(questao.alternativa_d)}
        </button>

    `;

}


function responderCompartilhado(resposta) {

    respostas[questaoAtual] =
        resposta;

    if (
        questaoAtual <
        questoesAtuais.length - 1
    ) {

        questaoAtual++;

        mostrarQuestaoCompartilhada();

    } else {

        finalizarSimulado();

    }

}


function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto || "";

    return div.innerHTML;

}


iniciarSistema();