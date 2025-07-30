document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com"; // 請確認這是您 Render 後端的正確網址

  // --- 抓取頁面所有元素 ---
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  const confirmationInput = document.getElementById("final-confirmation-input");
  const submitBtn = document.getElementById("submit-order-btn");
  const copyBtn = document.getElementById("copy-account-btn");
  const bankAccountSpan = document.getElementById("bank-account-number");

  // --- 需要驗證的文字 ---
  const requiredText = "我了解";

  // 從 localStorage 讀取購物車資料
  let cart = JSON.parse(localStorage.getItem("ruandiCart")) || {};

  // 核心函式：更新購物車並重新渲染畫面
  function updateCartAndRerender() {
    // 1. 清空舊畫面
    cartItemsContainer.innerHTML = "";
    let totalAmount = 0;

    // 2. 檢查購物車是否為空
    if (Object.keys(cart).length === 0) {
      cartItemsContainer.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">您的購物車是空的！<a href="index.html">點此返回首頁</a></td></tr>';
    } else {
      // 3. 遍歷購物車，產生新的表格內容
      for (const productId in cart) {
        const item = cart[productId];
        const subtotal = item.price * item.quantity;
        totalAmount += subtotal;
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td data-label="商品名稱">${item.name}</td>
                    <td data-label="單價">$${item.price}</td>
                    <td data-label="數量">
                        <div class="quantity-controls">
                            <button class="quantity-change" data-product-id="${productId}" data-change="-1">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-change" data-product-id="${productId}" data-change="1">+</button>
                        </div>
                    </td>
                    <td data-label="小計">$${subtotal}</td>
                    <td data-label="操作" style="text-align: center;">
                        <button class="remove-btn" data-product-id="${productId}">✖</button>
                    </td>
                `;
        cartItemsContainer.appendChild(row);
      }
    }

    // 4. 更新總金額
    cartTotalElement.textContent = `$${totalAmount} TWD`;

    // 5. 將更新後的購物車存回 localStorage
    localStorage.setItem("ruandiCart", JSON.stringify(cart));

    // 6. 重新檢查確認文字以決定按鈕狀態
    checkConfirmation();
  }

  // 函式：檢查確認文字
  function checkConfirmation() {
    if (
      confirmationInput.value.trim() === requiredText &&
      Object.keys(cart).length > 0
    ) {
      submitBtn.disabled = false;
      submitBtn.style.backgroundColor = "#28a745";
    } else {
      submitBtn.disabled = true;
      submitBtn.style.backgroundColor = "#6c757d";
    }
  }

  // 監聽購物車表格的點擊事件 (用於 + - 和移除)
  cartItemsContainer.addEventListener("click", function (event) {
    const target = event.target;

    if (
      target.classList.contains("quantity-change") ||
      target.classList.contains("remove-btn")
    ) {
      const productId = target.dataset.productId;

      if (target.classList.contains("quantity-change")) {
        const change = parseInt(target.dataset.change);
        if (cart[productId]) {
          cart[productId].quantity += change;
          if (cart[productId].quantity <= 0) {
            delete cart[productId];
          }
        }
      }

      if (target.classList.contains("remove-btn")) {
        if (
          cart[productId] &&
          confirm(`確定要從購物車中移除「${cart[productId].name}」嗎？`)
        ) {
          delete cart[productId];
        }
      }

      updateCartAndRerender();
    }
  });

  // 監聽確認輸入框的輸入
  confirmationInput.addEventListener("input", checkConfirmation);

  // 監聽表單提交事件
  document
    .getElementById("checkout-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const paopaohuId = document.getElementById("paopaohu-id").value;
      const paymentCode = document.getElementById("payment-code").value;
      const totalAmount = Object.values(cart).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderData = {
        paopaohuId: paopaohuId,
        paymentCode: paymentCode,
        totalAmount: totalAmount,
        items: cart,
      };

      fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            alert("下單成功！感謝您的訂購。");
            localStorage.removeItem("ruandiCart");
            window.location.href = "index.html";
          } else {
            alert("下單失敗，錯誤訊息：" + (data.message || "未知錯誤"));
          }
        })
        .catch((error) => {
          console.error("訂單提交錯誤:", error);
          alert("發生網路錯誤，請檢查後端伺服器是否正常運作。");
        });
    });

  // 一鍵複製功能
  copyBtn.addEventListener("click", function () {
    const accountNumber = bankAccountSpan.textContent;
    navigator.clipboard.writeText(accountNumber).then(
      function () {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "已複製！";
        copyBtn.style.backgroundColor = "#28a745";
        setTimeout(function () {
          copyBtn.textContent = originalText;
          copyBtn.style.backgroundColor = "";
        }, 2000);
      },
      function (err) {
        alert("複製失敗，請手動複製帳號。");
        console.error("無法複製帳號: ", err);
      }
    );
  });

  // 頁面初次載入時，執行一次渲染
  updateCartAndRerender();
});
