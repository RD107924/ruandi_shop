import sqlite3
import json
import os
import uuid
from flask import Flask, jsonify, request, g, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# --- 設定 ---
DATABASE = '/data/database.db'
UPLOAD_FOLDER = '/data' # 我們將圖片儲存在永久硬碟的根目錄
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app = Flask(__name__)
CORS(app) 
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- 資料庫連線設定 (維持不變) ---
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

# --- 輔助函式 ---
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- API 路由 ---

# *** 全新功能 1: 處理圖片上傳 ***
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        # 產生一個安全且獨一無二的檔名
        filename_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{filename_ext}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)

        # 回傳這個圖片在網路上的公開網址
        image_url = f'/uploads/{unique_filename}'
        return jsonify({'imageUrl': image_url})
    
    return jsonify({'error': 'File type not allowed'}), 400

# *** 全新功能 2: 讓外界可以讀取上傳的圖片 ***
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 從我們的 UPLOAD_FOLDER (也就是 /data) 提供檔案
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# == 商品相關 API (維持不變) ==
@app.route('/api/products', methods=['GET'])
def get_products():
    cursor = get_db().execute('SELECT * FROM products ORDER BY id DESC')
    products = [dict(row) for row in cursor.fetchall()]
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
def add_product():
    # ... (此函數維持不變)
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
    # ... (此函數維持不變)
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
    # ... (此函數維持不變)
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', [product_id])
    db.commit()
    return jsonify({'status': 'success', 'message': '商品刪除成功'})


# == 訂單相關 API (維持不變) ==
@app.route('/api/orders', methods=['GET'])
def get_orders():
    # ... (此函數維持不變)
    cursor = get_db().execute('SELECT * FROM orders ORDER BY created_at DESC')
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/orders/<string:paopaohu_id>', methods=['GET'])
def get_orders_by_customer(paopaohu_id):
    # ... (此函數維持不變)
    cursor = get_db().execute(
        'SELECT * FROM orders WHERE paopaohu_id = ? ORDER BY created_at DESC', 
        [paopaohu_id]
    )
    orders = [dict(row) for row in cursor.fetchall()]
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def add_order():
    # ... (此函數維持不變)
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


# == 系統管理 API (維持不變) ==
@app.route('/api/setup_database_on_render')
def setup_database_on_render():
    # ... (此函數維持不變)
    try:
        db = get_db()
        # ... 
        return "資料庫已存在。"
    except Exception as e:
        return f"建立資料庫時發生錯誤: {str(e)}"

# --- 啟動伺服器 ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)