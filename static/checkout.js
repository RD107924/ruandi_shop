document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com"; // 請確認這是您 Render 後端的正確網址

  const cartItemsContainer = document.getElementById("cart-items");
  // ... (其他元素宣告維持不變)
  const cartTotalElement = document.getElementById("cart-total");
  const confirmationInput = document.getElementById("final-confirmation-input");
  const submitBtn = document.getElementById("submit-order-btn");
  const copyBtn = document.getElementById("copy-account-btn");
  const bankAccountSpan = document.getElementById("bank-account-number");
  const requiredText = "我了解";
  let cart = JSON.parse(localStorage.getItem("ruandiCart")) || {};

  function updateCartAndRerender() {
    cartItemsContainer.innerHTML = "";
    let totalAmount = 0;
    if (Object.keys(cart).length === 0) {
      cartItemsContainer.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">您的購物車是空的！<a href="index.html">點此返回首頁</a></td></tr>';
    } else {
      for (const cartItemId in cart) {
        const item = cart[cartItemId];
        const subtotal = item.price * item.quantity;
        totalAmount += subtotal;

        // ******** 👇 全新：在商品名稱下方加入備註輸入框 ********
        const remarkValue = item.remark || ""; // 如果沒有備註，給一個空字串
        const remarkHTML = `
                    <div style="margin-top: 8px;">
                        <input type="text" class="cart-item-remark" placeholder="新增顏色、規格等備註..." 
                               data-cart-item-id="${cartItemId}" value="${remarkValue}">
                    </div>
                `;
        // ******************************************************

        const row = document.createElement("tr");
        row.innerHTML = `
                    <td data-label="商品名稱">${item.name}${remarkHTML}</td>
                    <td data-label="單價">$${item.price}</td>
                    <td data-label="數量">
                        <div class="quantity-controls">
                            <button class="quantity-change" data-cart-item-id="${cartItemId}" data-change="-1">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-change" data-cart-item-id="${cartItemId}" data-change="1">+</button>
                        </div>
                    </td>
                    <td data-label="小計">$${subtotal}</td>
                    <td data-label="操作" style="text-align: center;">
                        <button class="remove-btn" data-cart-item-id="${cartItemId}">✖</button>
                    </td>
                `;
        cartItemsContainer.appendChild(row);
      }
    }

    cartTotalElement.textContent = `$${totalAmount} TWD`;
    localStorage.setItem("ruandiCart", JSON.stringify(cart));
    checkConfirmation();
  }

  // ... (checkConfirmation 函式維持不變) ...

  // ******** 👇 全新：監聽所有備註輸入框的變動並即時儲存 ********
  cartItemsContainer.addEventListener("input", function (event) {
    if (event.target.classList.contains("cart-item-remark")) {
      const cartItemId = event.target.dataset.cartItemId;
      const newRemark = event.target.value;

      if (cart[cartItemId]) {
        cart[cartItemId].remark = newRemark; // 更新購物車物件中的備註
        localStorage.setItem("ruandiCart", JSON.stringify(cart)); // 立刻存回 localStorage
      }
    }
  });
  // ************************************************************

  // 監聽購物車表格的點擊事件 (用於 + - 和移除)
  cartItemsContainer.addEventListener("click", function (event) {
    // ... (此函數內容不變) ...
  });

  // ... (後續所有程式碼，包括表單提交、一鍵複製等，都維持不變) ...

  // --- 為了完整性，此處提供完整的檔案內容 ---
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
  cartItemsContainer.addEventListener("click", function (event) {
    const target = event.target;
    if (
      target.classList.contains("quantity-change") ||
      target.classList.contains("remove-btn")
    ) {
      const cartItemId = target.dataset.cartItemId;
      if (target.classList.contains("quantity-change")) {
        const change = parseInt(target.dataset.change);
        if (cart[cartItemId]) {
          cart[cartItemId].quantity += change;
          if (cart[cartItemId].quantity <= 0) {
            delete cart[cartItemId];
          }
        }
      }
      if (target.classList.contains("remove-btn")) {
        if (
          cart[cartItemId] &&
          confirm(`確定要從購物車中移除「${cart[cartItemId].name}」嗎？`)
        ) {
          delete cart[cartItemId];
        }
      }
      updateCartAndRerender();
    }
  });
  confirmationInput.addEventListener("input", checkConfirmation);
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
            alert("下單成功!感謝您的訂購，商品將在1~2天內送達深圳倉。");
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
  updateCartAndRerender();
});
