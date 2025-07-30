document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com"; // 請確認這是您 Render 後端的正確網址

  // 密碼已更新為 randy1007
  const correctPassword = "randy1007";
  const enteredPassword = prompt("請輸入管理密碼：");
  if (enteredPassword !== correctPassword) {
    alert("密碼錯誤！");
    window.location.href = "index.html";
    return; // 終止後續所有程式碼的執行
  }

  // 抓取頁面上的所有重要元素
  const productForm = document.getElementById("product-form");
  const productIdInput = document.getElementById("product-id");
  const imageUrlInput = document.getElementById("image-url");
  const imageUploadInput = document.getElementById("image-upload");
  const imagePreview = document.getElementById("image-preview");
  const productNameInput = document.getElementById("name");
  const basePriceInput = document.getElementById("base-price");
  const serviceFeeInput = document.getElementById("service-fee");
  const updateBtn = document.getElementById("update-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const productsListContainer = document.getElementById("products-list");
  const ordersListContainer = document.getElementById("orders-list");

  // 頁面載入時，自動載入訂單和商品
  loadOrders();
  loadProducts();

  // 監聽圖片上傳，並顯示預覽
  imageUploadInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // 表單提交事件 (用於新增商品)
  productForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleFormSubmit(false); // isUpdate = false
  });

  // 更新按鈕的點擊事件
  updateBtn.addEventListener("click", function () {
    handleFormSubmit(true); // isUpdate = true
  });

  // 取消編輯按鈕
  cancelEditBtn.addEventListener("click", function () {
    resetForm();
  });

  // 核心邏輯：處理表單提交 (新增或更新)
  async function handleFormSubmit(isUpdate = false) {
    let finalImageUrl = imageUrlInput.value; // 先取得表單中隱藏的舊圖片網址

    // 步驟1: 檢查是否有新圖片被上傳
    if (imageUploadInput.files.length > 0) {
      const formData = new FormData();
      formData.append("image", imageUploadInput.files[0]);

      // 步驟2: 如果有，先上傳圖片到 /api/upload
      try {
        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(uploadData.error || "圖片上傳失敗");

        finalImageUrl = API_BASE_URL + uploadData.imageUrl;
      } catch (error) {
        alert(`圖片處理失敗: ${error.message}`);
        return; // 中斷執行
      }
    }

    // 步驟3: 準備商品的文字資料
    const productData = {
      name: productNameInput.value,
      imageUrl: finalImageUrl,
      basePrice: parseInt(basePriceInput.value),
      serviceFee: parseInt(serviceFeeInput.value),
    };

    // 步驟4: 根據是新增還是更新，發送對應的請求
    let url = `${API_BASE_URL}/api/products`;
    let method = "POST";
    if (isUpdate) {
      const productId = productIdInput.value;
      if (!productId) {
        alert("錯誤：找不到要更新的商品ID。");
        return;
      }
      url = `${API_BASE_URL}/api/products/${productId}`;
      method = "PUT";
    }

    try {
      const productResponse = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const resultData = await productResponse.json();
      if (!productResponse.ok)
        throw new Error(resultData.message || "操作失敗");

      alert(resultData.message);
      resetForm();
      loadProducts(); // 操作成功後重新載入商品列表
    } catch (error) {
      alert(`商品儲存失敗: ${error.message}`);
    }
  }

  // 商品列表區的點擊事件 (用於編輯和刪除)
  productsListContainer.addEventListener("click", function (event) {
    const target = event.target;
    const row = target.closest("tr");
    if (!row) return;
    const productId = row.dataset.productId;

    // 如果點擊的是刪除按鈕
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

    // 如果點擊的是編輯按鈕
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

            imagePreview.src = fullProduct.image_url;
            imagePreview.style.display = "block";

            productForm.querySelector('button[type="submit"]').style.display =
              "none";
            updateBtn.style.display = "inline-block";
            cancelEditBtn.style.display = "inline-block";
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
                        <td><img src="${p.image_url}" alt="${p.name}" width="50" height="50" style="object-fit: cover;"></td>
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
    imageUrlInput.value = "";
    imagePreview.style.display = "none";
    imagePreview.src = "";
    productForm.querySelector('button[type="submit"]').style.display =
      "inline-block";
    updateBtn.style.display = "none";
    cancelEditBtn.style.display = "none";
  }

  // 函式：載入訂單列表
  function loadOrders() {
    fetch(`${API_BASE_URL}/api/orders`)
      .then((res) => res.json())
      .then((orders) => {
        ordersListContainer.innerHTML = "";
        if (orders.length === 0) {
          ordersListContainer.innerHTML =
            '<tr><td colspan="6" style="text-align: center;">目前沒有任何訂單。</td></tr>';
          return;
        }
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
