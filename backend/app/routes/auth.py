from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models import User
from app.utils.responses import success_response, error_response

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return error_response("Nome, email e senha são obrigatórios.", 400)

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response("Email já cadastrado.", 409)

    password_hash = generate_password_hash(password)

    user = User(
        name=name,
        email=email,
        password_hash=password_hash
    )

    db.session.add(user)
    db.session.commit()

    return success_response("Usuário cadastrado com sucesso.", {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }, 201)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return error_response("Email e senha são obrigatórios.", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Usuário não encontrado.", 404)

    if not check_password_hash(user.password_hash, password):
        return error_response("Senha inválida.", 401)

    return success_response("Login realizado com sucesso.", {
        "id": user.id,
        "name": user.name,
        "email": user.email
    })