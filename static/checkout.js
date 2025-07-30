document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "http://127.0.0.1:5000";

  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  const cart = JSON.parse(localStorage.getItem("ruandiCart")) || {};
  let totalAmount = 0;

  if (Object.keys(cart).length === 0) {
    cartItemsContainer.innerHTML =
      '<tr><td colspan="4" style="text-align: center;">您的購物車是空的！<a href="index.html">點此返回首頁</a></td></tr>';
  } else {
    for (const productId in cart) {
      const item = cart[productId];
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      const row = `
                <tr>
                    <td style="border-bottom: 1px solid #ddd; padding: 12px;">${item.name}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 12px;">$${item.price}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 12px;">${item.quantity}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 12px;">$${subtotal}</td>
                </tr>
            `;
      cartItemsContainer.innerHTML += row;
    }
  }

  cartTotalElement.textContent = `$${totalAmount} TWD`;

  document
    .getElementById("checkout-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const paopaohuId = document.getElementById("paopaohu-id").value;
      const paymentCode = document.getElementById("payment-code").value;

      if (!paopaohuId || !paymentCode || Object.keys(cart).length === 0) {
        alert("請填寫所有必填欄位，或您的購物車是空的！");
        return;
      }

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
            alert("下單成功！感謝您的訂購。您的訂單已送出。");
            localStorage.removeItem("ruandiCart");
            window.location.href = "index.html";
          } else {
            alert("下單失敗，錯誤訊息：" + data.message);
          }
        })
        .catch((error) => {
          console.error("訂單提交錯誤:", error);
          alert("發生網路錯誤，請檢查後端伺服器是否正常運作。");
        });
    });
});
