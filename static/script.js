document.addEventListener("DOMContentLoaded", function () {
  // !! 部署時請務必替換成您在Render上的後端網址 !!
  const API_BASE_URL = "https://ruandi-shop-backend-ro8b.onrender.com"; // 請確認這是您 Render 後端的正確網址

  const productsGrid = document.getElementById("products-grid");

  fetch(`${API_BASE_URL}/api/products`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((products) => {
      if (products.length === 0) {
        productsGrid.innerHTML = "<p>目前沒有商品上架。</p>";
        return;
      }
      products.forEach((product) => {
        const finalPrice = product.base_price + product.service_fee;
        const cardHTML = `
                    <div class="product-card">
                        <img src="${product.image_url}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <div class="product-price">$${finalPrice} TWD</div>
                        <div class="price-breakdown">(含商品價 $${product.base_price} + 代購服務費 $${product.service_fee})</div>
                        <button class="action-button add-to-cart-btn" data-product-id="${product.id}" data-product-name="${product.name}" data-price="${finalPrice}">加入購物車</button>
                    </div>
                `;
        productsGrid.insertAdjacentHTML("beforeend", cardHTML);
      });
    })
    .catch((error) => {
      console.error("無法取得商品列表:", error);
      productsGrid.innerHTML =
        "<p>載入商品失敗，請檢查後端伺服器是否已啟動，或稍後再試。</p>";
    });

  productsGrid.addEventListener("click", function (event) {
    if (event.target.classList.contains("add-to-cart-btn")) {
      const button = event.target;
      const productId = button.dataset.productId;
      const productName = button.dataset.productName;
      const price = parseInt(button.dataset.price);
      addToCart(productId, productName, price);
    }
  });
});

function addToCart(productId, name, price) {
  let cart = JSON.parse(localStorage.getItem("ruandiCart")) || {};
  if (cart[productId]) {
    cart[productId].quantity++;
  } else {
    cart[productId] = { name: name, price: price, quantity: 1 };
  }
  localStorage.setItem("ruandiCart", JSON.stringify(cart));
  alert(`「${name}」已加入購物車！`);
}
