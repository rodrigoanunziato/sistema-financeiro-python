
from flask import (
    Blueprint,
    render_template,
    request,
    session,
    redirect,
    url_for,
    flash,
    jsonify,
    current_app
)

from app.utils.auth import login_required
from app.database.conexao import conectar

import os
import uuid
import secrets

from werkzeug.utils import secure_filename


painel = Blueprint('painel', __name__)

# Configurações das fotos
EXTENSOES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp'}
TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024  # 2 MB


@painel.route('/painel')
@login_required
def index():
    usuario_id = session.get('usuario_id')

    conexao = None
    cursor = None

    try:
        conexao = conectar()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM usuarios WHERE id = %s",
            (usuario_id,)
        )

        usuario = cursor.fetchone()

    finally:
        if cursor:
            cursor.close()

        if conexao:
            conexao.close()

    if not usuario:
        flash('Usuário não encontrado.', 'error')
        return redirect(url_for('main.index'))

    # Recupera o nome e a foto diretamente do banco.
    session['usuario_nome'] = usuario.get('nome')

    foto_banco = usuario.get('foto')
    foto_nome = os.path.basename(str(foto_banco)) if foto_banco else ''

    if not foto_nome or foto_nome == 'sem_foto.webp':
        foto_nome = 'sem_foto.webp'

    session['usuario_foto'] = foto_nome
    session.modified = True

    return render_template(
        'painel/index.html',
        nome=session.get('usuario_nome'),
        nivel=session.get('usuario_nivel'),
        foto_usuario=session.get('usuario_foto'),
        usuario=usuario,
        usuario_perfil=usuario
    )


@painel.route('/logout', methods=['POST'])
def logout():
    session.clear()

    flash('Deslogado com Sucesso!', 'success')

    return redirect(url_for('main.index'))


@painel.app_context_processor
def gerar_token_csrf():
    token = session.get('_csrf_token')

    if not token:
        token = secrets.token_urlsafe(32)
        session['_csrf_token'] = token

    return {'csrf_token': token}


@painel.route('/painel/salvar-perfil', methods=['POST'])
@login_required
def salvar_perfil():
    conn = None
    cursor = None
    caminho_foto = None
    foto_url = None

    try:
        usuario_id = session.get('usuario_id')

        if not usuario_id:
            return jsonify({
                'status': 'erro',
                'mensagem': 'Usuário não autenticado.'
            }), 401

        # Dados pessoais
        nome = request.form.get('nome', '').strip()
        cpf = request.form.get('cpf', '').strip()
        email = request.form.get('email', '').strip()
        telefone = request.form.get('telefone', '').strip()

        # Endereço
        cep = request.form.get('cep', '').strip()
        endereco = request.form.get('endereco', '').strip()
        numero = request.form.get('numero', '').strip()
        complemento = request.form.get('complemento', '').strip()
        bairro = request.form.get('bairro', '').strip()
        cidade = request.form.get('cidade', '').strip()
        estado = request.form.get('estado', '').strip()

        if not nome:
            return jsonify({
                'status': 'erro',
                'mensagem': 'O nome é obrigatório.'
            }), 400

        if not email:
            return jsonify({
                'status': 'erro',
                'mensagem': 'O e-mail é obrigatório.'
            }), 400

        # Abre a conexão e recupera a foto atual.
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT foto FROM usuarios WHERE id = %s",
            (usuario_id,)
        )

        usuario_atual = cursor.fetchone()

        if not usuario_atual:
            return jsonify({
                'status': 'erro',
                'mensagem': 'Usuário não encontrado.'
            }), 404

        foto_anterior = usuario_atual.get('foto')
        foto_nome = (
            os.path.basename(str(foto_anterior))
            if foto_anterior else 'sem_foto.webp'
        )

        # Verifica se uma nova foto foi enviada.
        arquivo_foto = request.files.get('foto')

        if arquivo_foto and arquivo_foto.filename:
            nome_seguro = secure_filename(arquivo_foto.filename)
            extensao = os.path.splitext(nome_seguro)[1].lower()

            if extensao not in EXTENSOES_PERMITIDAS:
                return jsonify({
                    'status': 'erro',
                    'mensagem': 'Formato inválido. Use JPG, PNG ou WEBP.'
                }), 400

            # Confere o tamanho real do arquivo.
            conteudo = arquivo_foto.stream.read(
                TAMANHO_MAXIMO_FOTO + 1
            )
            arquivo_foto.stream.seek(0)

            if len(conteudo) > TAMANHO_MAXIMO_FOTO:
                return jsonify({
                    'status': 'erro',
                    'mensagem': 'A foto deve ter no máximo 2 MB.'
                }), 400

            # Pasta utilizada pelo seu HTML.
            pasta_fotos = os.path.join(
                current_app.static_folder,
                'img',
                'usuarios'
            )

            os.makedirs(pasta_fotos, exist_ok=True)

            # Gera um nome único para a nova imagem.
            foto_nome = f'{uuid.uuid4().hex}{extensao}'

            caminho_foto = os.path.join(
                pasta_fotos,
                foto_nome
            )

            # Salva a imagem no servidor.
            arquivo_foto.save(caminho_foto)

        # O banco armazena somente o nome do arquivo.
        # Se nenhuma foto nova foi enviada, preserva a anterior.
        foto_banco = (
            foto_nome if arquivo_foto and arquivo_foto.filename
            else foto_anterior
        )

        sql = """
            UPDATE usuarios
            SET
                nome = %s,
                cpf = %s,
                email = %s,
                telefone = %s,
                cep = %s,
                endereco = %s,
                numero = %s,
                complemento = %s,
                bairro = %s,
                cidade = %s,
                estado = %s,
                foto = %s
            WHERE id = %s
        """

        valores = (
            nome,
            cpf,
            email,
            telefone,
            cep,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            foto_banco,
            usuario_id
        )

        cursor.execute(sql, valores)
        conn.commit()

        # Atualiza a sessão imediatamente.
        session['usuario_nome'] = nome
        session['usuario_foto'] = (
            foto_banco or 'sem_foto.webp'
        )
        session.modified = True

        # URL que o JavaScript pode utilizar para atualizar a imagem.
        if foto_banco and foto_banco != 'sem_foto.webp':
            foto_url = url_for(
                'static',
                filename=f'img/usuarios/{foto_banco}'
            )
        else:
            foto_url = url_for(
                'static',
                filename='img/sem_foto.webp'
            )

        # Remove a foto anterior somente depois de salvar no banco.
        # Nunca remove a imagem padrão.
        if caminho_foto and foto_anterior:
            nome_antigo = os.path.basename(str(foto_anterior))

            pasta_fotos_real = os.path.realpath(
                os.path.join(
                    current_app.static_folder,
                    'img',
                    'usuarios'
                )
            )

            caminho_antigo = os.path.realpath(
                os.path.join(pasta_fotos_real, nome_antigo)
            )

            if (
                os.path.dirname(caminho_antigo) == pasta_fotos_real
                and nome_antigo != 'sem_foto.webp'
                and caminho_antigo != os.path.realpath(caminho_foto)
                and os.path.isfile(caminho_antigo)
            ):
                try:
                    os.remove(caminho_antigo)
                except OSError as erro:
                    print(
                        f'Não foi possível remover a foto antiga: {erro}'
                    )

        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Perfil atualizado com sucesso!',
            'nome': nome,
            'foto_url': foto_url
        })

    except Exception as erro:
        if conn:
            conn.rollback()

        # Remove a imagem recém-salva se ocorrer uma falha.
        if caminho_foto and os.path.isfile(caminho_foto):
            try:
                os.remove(caminho_foto)
            except OSError:
                pass

        print(f'Erro ao salvar perfil: {erro}')

        return jsonify({
            'status': 'erro',
            'mensagem': 'Não foi possível salvar os dados do perfil.'
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()
