from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from app.utils.auth import login_required

painel = Blueprint('painel', __name__)

@painel.route('/painel')
@login_required
def index():
    if 'usuario_id' not in session:
        flash('Sem Acesso!', 'danger')
        return redirect(url_for('main.index'))

    nome = session.get('usuario_nome')
    nivel = session.get('usuario_nivel')
    return render_template('painel/index.html', nome=nome, nivel=nivel)

@painel.route('/logout')
def logout():
    session.clear()
    flash('Deslogado com Sucesso!', 'success')
    return redirect(url_for('main.index'))