from flask import Blueprint
from app.models import User
from app.utils.responses import success_response

users_bp = Blueprint("users", __name__)

@users_bp.route("/", methods=["GET"])
def list_users():
    users = User.query.all()

    data = []
    for user in users:
        data.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        })

    return success_response("Usuários listados com sucesso.", data)