from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from app.database.conexao import conectar
from app import bcrypt

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template("index.html")

@main.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    senha = request.form.get('senha')

    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    if usuario and bcrypt.check_password_hash(usuario['senha'], senha):
        session['usuario_id'] = usuario['id']
        session['usuario_nome'] = usuario['nome']
        session['usuario_nivel'] = usuario['nivel']

        return redirect(url_for('painel.index'))
    flash('Email ou senha incorretos!', 'danger')
    return redirect(url_for('main.index'))