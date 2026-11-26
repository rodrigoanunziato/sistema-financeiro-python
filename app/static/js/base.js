document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // 1. MENU LATERAL (SIDEBAR)
    // =====================================================

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");

    function atualizarEstadoMenu() {
        if (!sidebar) return;

        if (window.innerWidth <= 768) {
            sidebar.classList.remove("sidebar-collapsed");
        } else {
            sidebar.classList.remove("sidebar-open");
        }

        if (sidebarToggle) {
            const aberto = window.innerWidth <= 768
                ? sidebar.classList.contains("sidebar-open")
                : !sidebar.classList.contains("sidebar-collapsed");

            sidebarToggle.setAttribute("aria-expanded", String(aberto));
        }
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", function () {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("sidebar-open");
            } else {
                sidebar.classList.toggle("sidebar-collapsed");
            }

            const aberto = window.innerWidth <= 768
                ? sidebar.classList.contains("sidebar-open")
                : !sidebar.classList.contains("sidebar-collapsed");

            sidebarToggle.setAttribute("aria-expanded", String(aberto));
            sidebarToggle.setAttribute(
                "aria-label",
                aberto ? "Fechar menu" : "Abrir menu"
            );
        });

        document.querySelectorAll(".sidebar-link").forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove("sidebar-open");

                    sidebarToggle.setAttribute("aria-expanded", "false");
                }
            });
        });

        window.addEventListener("resize", atualizarEstadoMenu);
    }


    // =====================================================
    // 2. ANIMAÇÃO DOS MENUS DROPDOWN
    // =====================================================

    const dropdownMenus = document.querySelectorAll(".user-dropdown-menu");

    dropdownMenus.forEach(function (menu) {
        const dropdown = menu.closest(".dropdown");

        if (!dropdown || typeof bootstrap === "undefined") {
            return;
        }

        const toggle = dropdown.querySelector(
            '[data-bs-toggle="dropdown"]'
        );

        if (!toggle) return;

        toggle.addEventListener("hide.bs.dropdown", function (event) {
            if (menu.dataset.animandoFechamento === "true") {
                return;
            }

            event.preventDefault();

            menu.dataset.animandoFechamento = "true";
            menu.classList.add("is-closing");

            window.setTimeout(function () {
                menu.classList.remove("is-closing");
                menu.dataset.animandoFechamento = "false";

                const instancia = bootstrap.Dropdown.getInstance(toggle);

                if (instancia) {
                    instancia.hide();
                }
            }, 180);
        });
    });


    // =====================================================
    // 3. ELEMENTOS DO FORMULÁRIO DE PERFIL
    // =====================================================

    const formPerfil = document.getElementById("formPerfil");
    const btnSalvar = document.getElementById("btnSalvarPerfil");
    const previewFoto = document.getElementById("previewFotoPerfil");
    const inputFoto = document.getElementById("fotoPerfil");


    // =====================================================
    // 4. PRÉ-VISUALIZAÇÃO DA FOTO DE PERFIL
    // =====================================================

    if (inputFoto && previewFoto) {
        inputFoto.addEventListener("change", function () {
            const arquivo = inputFoto.files && inputFoto.files[0];

            if (!arquivo) return;

            if (!arquivo.type.startsWith("image/")) {
                mostrarMensagem(
                    "Selecione um arquivo de imagem válido.",
                    "aviso"
                );

                inputFoto.value = "";
                return;
            }

            const leitor = new FileReader();

            leitor.onload = function (evento) {
                previewFoto.src = evento.target.result;
            };

            leitor.onerror = function () {
                mostrarMensagem(
                    "Não foi possível carregar a imagem selecionada.",
                    "erro"
                );
            };

            leitor.readAsDataURL(arquivo);
        });
    }


    // =====================================================
    // 5. SALVAR ALTERAÇÕES DO PERFIL
    // =====================================================

    if (formPerfil) {
        formPerfil.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (btnSalvar && btnSalvar.disabled) {
                return;
            }

            const textoOriginal = btnSalvar
                ? btnSalvar.textContent
                : "Salvar Alterações";

            const formData = new FormData(formPerfil);

            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "Salvando...";
            }

            mostrarLoading("Salvando dados...");

            try {
                const url = formPerfil.action ||
                    "/painel/salvar-perfil";

                const response = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                let data;

                try {
                    data = await response.json();
                } catch {
                    throw new Error(
                        `O servidor retornou uma resposta inválida (HTTP ${response.status}).`
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.mensagem ||
                        `Não foi possível salvar o perfil (HTTP ${response.status}).`
                    );
                }

                if (data.status === "sucesso") {
                    mostrarMensagem(
                        data.mensagem || "Perfil atualizado com sucesso!",
                        "sucesso"
                    );

                    // -------------------------------------
                    // ATUALIZAR O NOME NO CABEÇALHO
                    // -------------------------------------

                    if (data.nome) {
                        // Atualiza o nome do cabeçalho.
                        const nomeTopo = document.querySelector(
                            ".user-name, #nomeUsuarioTopo, #nomeUsuario"
                        );

                        if (nomeTopo) {
                            nomeTopo.textContent = data.nome;
                        }

                        // Atualiza outros elementos que exibem o nome.
                        document.querySelectorAll(".nome-usuario").forEach(function (elemento) {
                            elemento.textContent = data.nome;
                        });
                    }

                    // -------------------------------------
                    // ATUALIZAR A FOTO DE PERFIL
                    // -------------------------------------

                    if (data.foto_url) {
                        document.querySelectorAll(
                            ".foto-perfil, #fotoPerfilAtual"
                        ).forEach(function (imagem) {
                            imagem.src = data.foto_url;
                        });

                        if (previewFoto) {
                            previewFoto.src = data.foto_url;
                        }
                    }

                    // -------------------------------------
                    // FECHAR O MODAL DE EDIÇÃO
                    // -------------------------------------

                    const modalEl = document.getElementById(
                        "modalEditarPerfil"
                    );

                    if (
                        modalEl &&
                        typeof bootstrap !== "undefined"
                    ) {
                        const modal = bootstrap.Modal.getInstance(modalEl);

                        if (modal) {
                            modal.hide();
                        }
                    }

                    // Recarrega a página somente se solicitado
                    // pela resposta da rota Flask.
                    if (data.recarregar === true) {
                        window.location.reload();
                    }

                } else {
                    mostrarMensagem(
                        data.mensagem ||
                        "Não foi possível atualizar o perfil.",
                        "aviso"
                    );
                }

            } catch (error) {
                console.error("Erro ao salvar o perfil:", error);

                mostrarMensagem(
                    error.message ||
                    "Erro ao salvar os dados do perfil.",
                    "erro"
                );

            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = textoOriginal;
                }

                ocultarLoading();
            }
        });
    }


    // =====================================================
    // 6. CONSULTA DE CEP
    // =====================================================

    const campoCep = document.getElementById("cep");
    const campoRua = document.getElementById("rua");
    const campoBairro = document.getElementById("bairro");
    const campoCidade = document.getElementById("cidade");
    const campoEstado = document.getElementById("estado");

    if (campoCep) {
        campoCep.addEventListener("blur", async function () {
            const cep = campoCep.value.replace(/\D/g, "");

            if (cep.length === 0) return;

            if (cep.length !== 8) {
                mostrarMensagem("Informe um CEP válido.", "aviso");
                return;
            }

            try {
                const response = await fetch(
                    `https://viacep.com.br/ws/${cep}/json/`
                );

                if (!response.ok) {
                    throw new Error("Não foi possível consultar o CEP.");
                }

                const dados = await response.json();

                if (dados.erro) {
                    mostrarMensagem("CEP não encontrado.", "aviso");
                    return;
                }

                if (campoRua) {
                    campoRua.value = dados.logradouro || "";
                }

                if (campoBairro) {
                    campoBairro.value = dados.bairro || "";
                }

                if (campoCidade) {
                    campoCidade.value = dados.localidade || "";
                }

                if (campoEstado) {
                    campoEstado.value = dados.uf || "";
                }

            } catch (error) {
                console.error("Erro ao consultar CEP:", error);

                mostrarMensagem(
                    "Não foi possível consultar o CEP.",
                    "erro"
                );
            }
        });
    }


    // =====================================================
    // 7. FORMULÁRIO DE CONFIGURAÇÕES
    // =====================================================

    const formConfiguracoes = document.getElementById(
        "formConfiguracoes"
    );

    if (formConfiguracoes) {
        formConfiguracoes.addEventListener("submit", async function (event) {
            event.preventDefault();

            const botao = formConfiguracoes.querySelector(
                'button[type="submit"]'
            );

            const textoOriginal = botao
                ? botao.textContent
                : "";

            if (botao) {
                botao.disabled = true;
                botao.textContent = "Salvando...";
            }

            try {
                const response = await fetch(
                    formConfiguracoes.action || window.location.href,
                    {
                        method: "POST",
                        body: new FormData(formConfiguracoes),
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                let data;

                try {
                    data = await response.json();
                } catch {
                    throw new Error(
                        "O servidor retornou uma resposta inválida."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.mensagem ||
                        "Não foi possível salvar as configurações."
                    );
                }

                if (data.status === "sucesso") {
                    mostrarMensagem(
                        data.mensagem ||
                        "Configurações salvas com sucesso!",
                        "sucesso"
                    );
                } else {
                    mostrarMensagem(
                        data.mensagem ||
                        "Não foi possível salvar as configurações.",
                        "aviso"
                    );
                }

            } catch (error) {
                console.error(
                    "Erro ao salvar configurações:",
                    error
                );

                mostrarMensagem(
                    error.message ||
                    "Erro ao salvar as configurações.",
                    "erro"
                );

            } finally {
                if (botao) {
                    botao.disabled = false;
                    botao.textContent = textoOriginal;
                }
            }
        });
    }


    // =====================================================
    // 8. CONTROLES DE COR
    // =====================================================

    const controlesCor = document.querySelectorAll(
        'input[type="color"][data-color-target]'
    );

    controlesCor.forEach(function (controle) {
        controle.addEventListener("input", function () {
            const seletor = controle.dataset.colorTarget;

            if (!seletor) return;

            const elemento = document.querySelector(seletor);

            if (elemento) {
                elemento.style.backgroundColor = controle.value;
            }
        });
    });


    // =====================================================
    // 9. EXIBIR MENSAGENS
    // =====================================================

    function mostrarMensagem(mensagem, tipo = "info") {
        const funcoesMensagem = {
            sucesso: "mensagemSucesso",
            aviso: "mensagemAviso",
            erro: "mensagemErro"
        };

        const nomeFuncao = funcoesMensagem[tipo];

        if (
            nomeFuncao &&
            typeof window[nomeFuncao] === "function"
        ) {
            window[nomeFuncao](mensagem);
            return;
        }

        const classe = {
            sucesso: "success",
            aviso: "warning",
            erro: "danger",
            info: "info"
        }[tipo] || "info";

        const alerta = document.createElement("div");

        alerta.className =
            `alert alert-${classe} alert-dismissible fade show`;

        alerta.setAttribute("role", "alert");
        alerta.style.position = "fixed";
        alerta.style.top = "20px";
        alerta.style.right = "20px";
        alerta.style.zIndex = "20000";
        alerta.style.maxWidth = "90vw";
        alerta.style.width = "400px";

        const texto = document.createElement("span");
        texto.textContent = mensagem;

        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "btn-close";
        fechar.setAttribute("aria-label", "Fechar");

        fechar.addEventListener("click", function () {
            alerta.remove();
        });

        alerta.appendChild(texto);
        alerta.appendChild(fechar);

        document.body.appendChild(alerta);

        window.setTimeout(function () {
            if (alerta.isConnected) {
                alerta.remove();
            }
        }, 5000);
    }


    // =====================================================
    // 10. INDICADOR DE CARREGAMENTO
    // =====================================================

    function mostrarLoading(mensagem = "Carregando...") {
        if (typeof window.mostrarLoading === "function") {
            window.mostrarLoading(mensagem);
            return;
        }

        const loading = document.getElementById("loadingOverlay");

        if (loading) {
            loading.classList.remove("d-none");
            loading.setAttribute("aria-hidden", "false");

            const texto = loading.querySelector(
                ".loading-text, .loading-mensagem"
            );

            if (texto) {
                texto.textContent = mensagem;
            }
        }
    }

    function ocultarLoading() {
        if (typeof window.ocultarLoading === "function") {
            window.ocultarLoading();
            return;
        }

        const loading = document.getElementById("loadingOverlay");

        if (loading) {
            loading.classList.add("d-none");
            loading.setAttribute("aria-hidden", "true");
        }
    }

});
