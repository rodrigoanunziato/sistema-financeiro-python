from flask import Blueprint, render_template, request, session, redirect, url_for

painel = Blueprint('painel', __name__)

@painel.route('/painel')
def index():
    if 'usuario_id' not in session:
        return redirect(url_for('main.index'))

    nome = session.get('usuario_nome')
    nivel = session.get('usuario_nivel')
    return render_template('painel/index.html', nome=nome, nivel=nivel)

@painel.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.index'))