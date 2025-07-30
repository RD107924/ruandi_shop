import sqlite3, json
from flask import Flask, jsonify, request, g
from flask_cors import CORS

DATABASE = 'database.db' # 在本地開發時使用
app = Flask(__name__)
CORS(app)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row 
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- 商品 API ---
@app.route('/api/products', methods=['GET'])
def get_products():
    cursor = get_db().execute('SELECT * FROM products ORDER BY id DESC')
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/products', methods=['POST'])
def add_product():
    new_product = request.json
    db = get_db()
    db.execute('INSERT INTO products (name, image_url, base_price, service_fee) VALUES (?, ?, ?, ?)',
               [new_product['name'], new_product['imageUrl'], new_product['basePrice'], new_product['serviceFee']])
    db.commit()
    return jsonify({'status': 'success', 'message': '商品新增成功'}), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product_data = request.json
    db = get_db()
    db.execute('UPDATE products SET name = ?, image_url = ?, base_price = ?, service_fee = ? WHERE id = ?',
               [product_data['name'], product_data['imageUrl'], product_data['basePrice'], product_data['serviceFee'], product_id])
    db.commit()
    return jsonify({'status': 'success', 'message': '商品更新成功'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', [product_id])
    db.commit()
    return jsonify({'status': 'success', 'message': '商品刪除成功'})

# --- 訂單 API ---
@app.route('/api/orders', methods=['GET'])
def get_orders():
    cursor = get_db().execute('SELECT * FROM orders ORDER BY created_at DESC')
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/orders', methods=['POST'])
def add_order():
    order_data = request.json
    try:
        db = get_db()
        db.execute('INSERT INTO orders (paopaohu_id, payment_code, total_amount, items_json) VALUES (?, ?, ?, ?)',
                   [order_data['paopaohuId'], order_data['paymentCode'], order_data['totalAmount'], json.dumps(order_data['items'])])
        db.commit()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)