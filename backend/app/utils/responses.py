from flask import jsonify

def success_response(message="", data=None, status=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status

def error_response(message="", status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status