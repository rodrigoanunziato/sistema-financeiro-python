from flask import Flask
from flask_bcrypt import Bcrypt
from app.database.conexao import conectar
from config import EMAIL_SISTEMA, NOME_SISTEMA, SENHA_PADRAO

bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'passar uma chave'

    bcrypt.init_app(app)

    from app.routes.main import main
    app.register_blueprint(main)

    from app.routes.painel.routes import painel
    app.register_blueprint(painel)

    from datetime import timedelta
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    criar_admin_padrao()

    return app

def criar_admin_padrao():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM usuarios WHERE nivel = 'Administrador'")
    usuario = cursor.fetchone()

    if not usuario:
        senha_crip = bcrypt.generate_password_hash(SENHA_PADRAO).decode('utf-8')
        cursor.execute("INSERT INTO usuarios SET nome = %s, email = %s, senha = %s,nivel = 'Administrador', ativo = 'Sim', data_cadastro = curDate(), foto = 'sem_foto.webp'", (NOME_SISTEMA, EMAIL_SISTEMA, senha_crip))
        conexao.commit()

    cursor.close()
    conexao.close()

