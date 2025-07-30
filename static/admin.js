document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com";

  // 簡易密碼保護
  const correctPassword = "12345"; // !! 請務必修改成您自己的高強度密碼 !!
  const enteredPassword = prompt("請輸入管理密碼：");
  if (enteredPassword !== correctPassword) {
    alert("密碼錯誤！");
    window.location.href = "index.html";
    return;
  }

  // 抓取頁面上的重要元素
  const productForm = document.getElementById("product-form");
  const productIdInput = document.getElementById("product-id");
  const productNameInput = document.getElementById("name");
  const imageUrlInput = document.getElementById("image-url");
  const basePriceInput = document.getElementById("base-price");
  const serviceFeeInput = document.getElementById("service-fee");
  const updateBtn = document.getElementById("update-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const productsListContainer = document.getElementById("products-list");

  // 頁面載入時，自動載入訂單和商品
  loadOrders();
  loadProducts();

  // 表單提交事件 (用於新增商品)
  productForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const productData = {
      name: productNameInput.value,
      imageUrl: imageUrlInput.value,
      basePrice: parseInt(basePriceInput.value),
      serviceFee: parseInt(serviceFeeInput.value),
    };
    fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        resetForm();
        loadProducts(); // 重新載入商品列表
      });
  });

  // 更新按鈕的點擊事件
  updateBtn.addEventListener("click", function () {
    const productId = productIdInput.value;
    const productData = {
      name: productNameInput.value,
      imageUrl: imageUrlInput.value,
      basePrice: parseInt(basePriceInput.value),
      serviceFee: parseInt(serviceFeeInput.value),
    };
    fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        resetForm();
        loadProducts();
      });
  });

  // 取消編輯按鈕
  cancelEditBtn.addEventListener("click", function () {
    resetForm();
  });

  // 商品列表區的點擊事件 (用於編輯和刪除)
  productsListContainer.addEventListener("click", function (event) {
    const target = event.target;
    const row = target.closest("tr");
    if (!row) return; // 如果點擊的不是表格內的內容，就忽略
    const productId = row.dataset.productId;

    if (target.classList.contains("delete-btn")) {
      if (confirm(`確定要刪除 ID 為 ${productId} 的商品嗎？`)) {
        fetch(`${API_BASE_URL}/api/products/${productId}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message);
            loadProducts();
          });
      }
    }

    if (target.classList.contains("edit-btn")) {
      const productToEdit = {
        id: productId,
        name: row.cells[1].textContent,
        base_price: parseInt(row.cells[2].textContent),
        service_fee: parseInt(row.cells[3].textContent),
      };

      // 抓取圖片網址需要從API或DOM中其他地方獲取，這裡簡化處理
      // 為了準確，我們還是從API重新獲取一次
      fetch(`${API_BASE_URL}/api/products`)
        .then((res) => res.json())
        .then((products) => {
          const fullProduct = products.find((p) => p.id == productId);
          if (fullProduct) {
            productIdInput.value = fullProduct.id;
            productNameInput.value = fullProduct.name;
            imageUrlInput.value = fullProduct.image_url;
            basePriceInput.value = fullProduct.base_price;
            serviceFeeInput.value = fullProduct.service_fee;

            productForm.querySelector('button[type="submit"]').style.display =
              "none";
            updateBtn.style.display = "inline-block";
            cancelEditBtn.style.display = "inline-block";

            // 讓頁面滾動到表單位置，方便編輯
            productForm.scrollIntoView({ behavior: "smooth" });
          }
        });
    }
  });

  // 函式：載入並顯示商品列表
  function loadProducts() {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((products) => {
        productsListContainer.innerHTML = "";
        products.forEach((p) => {
          const row = document.createElement("tr");
          row.dataset.productId = p.id;
          row.innerHTML = `
                        <td>${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.base_price}</td>
                        <td>${p.service_fee}</td>
                        <td>
                            <button class="edit-btn">編輯</button>
                            <button class="delete-btn">刪除</button>
                        </td>
                    `;
          productsListContainer.appendChild(row);
        });
      });
  }

  // 函式：重設表單
  function resetForm() {
    productForm.reset();
    productIdInput.value = "";
    productForm.querySelector('button[type="submit"]').style.display =
      "inline-block";
    updateBtn.style.display = "none";
    cancelEditBtn.style.display = "none";
  }

  // 函式：載入訂單列表
  function loadOrders() {
    const ordersListContainer = document.getElementById("orders-list");
    fetch(`${API_BASE_URL}/api/orders`)
      .then((res) => res.json())
      .then((orders) => {
        ordersListContainer.innerHTML = "";
        orders.forEach((order) => {
          const itemsObject = JSON.parse(order.items_json);
          let itemsHTML = '<ul class="items-list">';
          for (const productId in itemsObject) {
            const item = itemsObject[productId];
            itemsHTML += `<li>${item.name} (單價: $${item.price}) x ${item.quantity}</li>`;
          }
          itemsHTML += "</ul>";
          const orderTime = new Date(order.created_at).toLocaleString("zh-TW", {
            hour12: false,
          });
          const rowHTML = `
                    <tr>
                        <td>${order.id}</td>
                        <td>${orderTime}</td>
                        <td>${order.paopaohu_id}</td>
                        <td>${order.payment_code}</td>
                        <td>$${order.total_amount} TWD</td>
                        <td>${itemsHTML}</td>
                    </tr>`;
          ordersListContainer.insertAdjacentHTML("beforeend", rowHTML);
        });
      });
  }
});
