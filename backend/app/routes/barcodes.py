import hashlib
from flask import Blueprint, request
from app.extensions import db
from app.models import ProdutoBarcode, Product
from app.utils.responses import success_response, error_response

barcodes_bp = Blueprint("barcodes", __name__)


# ── Helpers ────────────────────────────────────────────────────────────────────
def gerar_ean13(product_id: int, size: str) -> str:
    """Gera código EAN-13 determinístico e único para produto + tamanho."""
    seed = f"ESTOQUE_{product_id}_{size}"
    hash_val = int(hashlib.sha256(seed.encode()).hexdigest()[:11], 16) % 10**12
    code12 = str(hash_val).zfill(12)
    digits = [int(d) for d in code12]
    total  = sum(d * (3 if i % 2 else 1) for i, d in enumerate(digits))
    check  = (10 - total % 10) % 10
    return code12 + str(check)


def gerar_barcodes_produto(product: Product) -> list:
    """Gera barcodes para todos os tamanhos de um produto."""
    tamanhos = product.tamanhos or {}
    criados  = []

    for size in tamanhos.keys():
        existente = ProdutoBarcode.query.filter_by(
            product_id=product.id, size=str(size)
        ).first()
        if existente:
            criados.append(existente)
            continue

        barcode = gerar_ean13(product.id, str(size))

        # Garante unicidade (colisão muito improvável, mas seguro)
        tentativas = 0
        while ProdutoBarcode.query.filter_by(barcode=barcode).first():
            barcode = gerar_ean13(product.id, f"{size}_{tentativas}")
            tentativas += 1

        pb = ProdutoBarcode(product_id=product.id, size=str(size), barcode=barcode)
        db.session.add(pb)
        criados.append(pb)

    db.session.commit()
    return criados


# ── GET /api/barcodes/produto/<id> ─────────────────────────────────────────────
@barcodes_bp.route("/produto/<int:product_id>", methods=["GET"])
def listar_barcodes_produto(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return error_response("Produto não encontrado.", 404)

        barcodes = ProdutoBarcode.query.filter_by(product_id=product_id).all()

        # Gera os que ainda não existem
        tamanhos = product.tamanhos or {}
        sizes_com_barcode = {b.size for b in barcodes}
        faltando = [s for s in tamanhos.keys() if str(s) not in sizes_com_barcode]

        if faltando:
            gerar_barcodes_produto(product)
            barcodes = ProdutoBarcode.query.filter_by(product_id=product_id).all()

        data = [
            {
                "id":         b.id,
                "product_id": b.product_id,
                "size":       b.size,
                "barcode":    b.barcode,
                "estoque":    int((tamanhos or {}).get(b.size, 0) or 0),
            }
            for b in sorted(barcodes, key=lambda x: x.size)
        ]

        return success_response("Barcodes listados.", data)
    except Exception as e:
        return error_response(str(e), 500)


# ── GET /api/barcodes/scan/<barcode> ──────────────────────────────────────────
# Identifica produto + tamanho a partir de um código escaneado
@barcodes_bp.route("/scan/<string:barcode>", methods=["GET"])
def scan_barcode(barcode):
    try:
        pb = ProdutoBarcode.query.filter_by(barcode=barcode.strip()).first()
        if not pb:
            return error_response("Código de barras não encontrado.", 404)

        product = pb.product
        tamanhos = product.tamanhos or {}
        estoque  = int(tamanhos.get(pb.size, 0) or 0)

        return success_response("Barcode identificado.", {
            "barcode":    pb.barcode,
            "product_id": pb.product_id,
            "product_name": product.name,
            "size":       pb.size,
            "estoque":    estoque,
            "price":      float(product.price or 0),
        })
    except Exception as e:
        return error_response(str(e), 500)


# ── POST /api/barcodes/gerar/<product_id> ─────────────────────────────────────
# (Re)gera barcodes para todos os tamanhos de um produto
@barcodes_bp.route("/gerar/<int:product_id>", methods=["POST"])
def gerar_para_produto(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return error_response("Produto não encontrado.", 404)

        barcodes = gerar_barcodes_produto(product)
        data = [{"size": b.size, "barcode": b.barcode} for b in barcodes]
        return success_response(f"{len(data)} barcodes gerados.", data)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)