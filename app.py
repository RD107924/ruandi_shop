import sqlite3
import json
from flask import Flask, jsonify, request, g
from flask_cors import CORS

# --- 設定 ---
# 這個路徑是針對 Render.com 的永久硬碟設定
DATABASE = '/data/database.db' 

app = Flask(__name__)
CORS(app) # 啟用CORS，允許所有來源的請求

# --- 資料庫連線設定 (樣板程式，幫助我們高效連線) ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # 這個設定讓資料庫回傳的資料可以用欄位名存取，非常方便
        db.row_factory = sqlite3.Row 
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- API 路由 (網站的功能接口) ---

# == 商品相關 API ==
@app.route('/api/products', methods=['GET'])
def get_products():
    cursor = get_db().execute('SELECT * FROM products ORDER BY id DESC')
    products = [dict(row) for row in cursor.fetchall()]
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
def add_product():
    new_product = request.json
    db = get_db()
    db.execute(
        'INSERT INTO products (name, image_url, base_price, service_fee) VALUES (?, ?, ?, ?)',
        [new_product['name'], new_product['imageUrl'], new_product['basePrice'], new_product['serviceFee']]
    )
    db.commit()
    return jsonify({'status': 'success', 'message': '商品新增成功'}), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product_data = request.json
    db = get_db()
    db.execute(
        'UPDATE products SET name = ?, image_url = ?, base_price = ?, service_fee = ? WHERE id = ?',
        [product_data['name'], product_data['imageUrl'], product_data['basePrice'], product_data['serviceFee'], product_id]
    )
    db.commit()
    return jsonify({'status': 'success', 'message': '商品更新成功'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', [product_id])
    db.commit()
    return jsonify({'status': 'success', 'message': '商品刪除成功'})


# == 訂單相關 API ==
@app.route('/api/orders', methods=['GET'])
def get_orders():
    cursor = get_db().execute('SELECT * FROM orders ORDER BY created_at DESC')
    orders = [dict(row) for row in cursor.fetchall()]
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def add_order():
    order_data = request.json
    try:
        db = get_db()
        db.execute(
            'INSERT INTO orders (paopaohu_id, payment_code, total_amount, items_json) VALUES (?, ?, ?, ?)',
            [
                order_data['paopaohuId'],
                order_data['paymentCode'],
                order_data['totalAmount'],
                json.dumps(order_data['items'])
            ]
        )
        db.commit()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


# == 系統管理 API (一次性使用) ==
@app.route('/api/setup_database_on_render')
def setup_database_on_render():
    try:
        db = get_db()
        print("正在線上資料庫中建立資料表...")
        
        # 建立 products 資料表
        db.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            base_price INTEGER NOT NULL,
            service_fee INTEGER NOT NULL
        );
        ''')
        print("-> products 資料表... 成功")

        # 建立 orders 資料表
        db.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paopaohu_id TEXT NOT NULL,
            payment_code TEXT NOT NULL,
            total_amount INTEGER NOT NULL,
            items_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        print("-> orders 資料表... 成功")
        
        db.commit()
        return "線上資料庫與資料表建立成功！現在您可以把這個路由從 app.py 中移除了。"
    except Exception as e:
        return f"建立資料庫時發生錯誤: {str(e)}"


# --- 啟動伺服器 ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)