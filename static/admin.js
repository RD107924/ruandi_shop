document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com"; // 請確認這是您 Render 後端的正確網址

  // 密碼已更新
  const correctPassword = "randy1007";
  const enteredPassword = prompt("請輸入管理密碼：");
  if (enteredPassword !== correctPassword) {
    alert("密碼錯誤！");
    window.location.href = "index.html";
    return;
  }

  const productForm = document.getElementById("product-form");
  const productIdInput = document.getElementById("product-id");
  const productNameInput = document.getElementById("name");
  const imageUrlInput = document.getElementById("image-url");
  const basePriceInput = document.getElementById("base-price");
  const serviceFeeInput = document.getElementById("service-fee");
  const updateBtn = document.getElementById("update-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const productsListContainer = document.getElementById("products-list");

  loadOrders();
  loadProducts();

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
        loadProducts();
      });
  });

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

  cancelEditBtn.addEventListener("click", function () {
    resetForm();
  });

  productsListContainer.addEventListener("click", function (event) {
    const target = event.target;
    const row = target.closest("tr");
    if (!row) return;
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
            productForm.scrollIntoView({ behavior: "smooth" });
          }
        });
    }
  });

  function loadProducts() {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((products) => {
        productsListContainer.innerHTML = "";
        products.forEach((p) => {
          const row = document.createElement("tr");
          row.dataset.productId = p.id;
          row.innerHTML = `
                        <td>${p.id}</td><td>${p.name}</td>
                        <td>${p.base_price}</td><td>${p.service_fee}</td>
                        <td>
                            <button class="edit-btn">編輯</button>
                            <button class="delete-btn">刪除</button>
                        </td>
                    `;
          productsListContainer.appendChild(row);
        });
      });
  }

  function resetForm() {
    productForm.reset();
    productIdInput.value = "";
    productForm.querySelector('button[type="submit"]').style.display =
      "inline-block";
    updateBtn.style.display = "none";
    cancelEditBtn.style.display = "none";
  }

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
                        <td>${order.id}</td><td>${orderTime}</td><td>${order.paopaohu_id}</td>
                        <td>${order.payment_code}</td><td>$${order.total_amount} TWD</td><td>${itemsHTML}</td>
                    </tr>`;
          ordersListContainer.insertAdjacentHTML("beforeend", rowHTML);
        });
      });
  }
});
