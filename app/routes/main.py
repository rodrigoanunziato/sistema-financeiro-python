from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from app.database.conexao import conectar
from app import bcrypt
from config import MODO_TESTE, EMAIL_SISTEMA, SENHA_PADRAO, NOME_SISTEMA, COR_PRIMARIA, COR_SECUNDARIA

main = Blueprint('main', __name__)

@main.route('/')
def index():
    if 'usuario_id' in session:
        return redirect(url_for('painel.index'))
    return render_template(
        "index.html",
        modo_teste = MODO_TESTE,
        email_padrao = EMAIL_SISTEMA,
        senha_padrao = SENHA_PADRAO.strip(),
        nome_sistema = NOME_SISTEMA,
        cor_primaria = COR_PRIMARIA,
        cor_secundaria = COR_SECUNDARIA,
        )

@main.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    senha = request.form.get('senha')
    lembrar = request.form.get('lembrar')

    if lembrar:
        session.permanent = True
    else:
        session.permanent = False

    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    if usuario and usuario['ativo'] != 'Sim':
            flash('Usuário inativo, contate o Administrador!', 'danger')
            return redirect(url_for('main.index'))


    if usuario and bcrypt.check_password_hash(usuario['senha'], senha):
        session['usuario_id'] = usuario['id']
        session['usuario_nome'] = usuario['nome']
        session['usuario_nivel'] = usuario['nivel']
        session['usuario_foto'] = usuario['foto']


        return redirect(url_for('painel.index'))
    flash('Email ou senha incorretos!', 'danger')
    return redirect(url_for('main.index'))