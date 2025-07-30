document.addEventListener('DOMContentLoaded', function() {
    // !! 部署時請務必替換成您在Render上的後端網址 !!
    const API_BASE_URL = 'https://ruandi-shop-backend-ro8b.onrender.com'; // 請確認這是您 Render 後端的正確網址

    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const confirmationInput = document.getElementById('final-confirmation-input');
    const submitBtn = document.getElementById('submit-order-btn');
    const requiredText = '我充分了解，商品僅下單至跑跑虎集運會員編號下';
    let cart = JSON.parse(localStorage.getItem('ruandiCart')) || {};
    let totalAmount = 0;

    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = '<tr><td colspan="4" style="text-align: center;">您的購物車是空的！<a href="index.html">點此返回首頁</a></td></tr>';
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

    confirmationInput.addEventListener('input', function() {
        if (confirmationInput.value.trim() === requiredText) {
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '#28a745';
        } else {
            submitBtn.disabled = true;
            submit-order-btn.style.backgroundColor = '#6c757d';
        }
    });

    document.getElementById('checkout-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const paopaohuId = document.getElementById('paopaohu-id').value;
        const paymentCode = document.getElementById('payment-code').value;

        if (!paopaohuId || !paymentCode || Object.keys(cart).length === 0) {
            alert('請填寫所有必填欄位，或您的購物車是空的！');
            return;
        }
        if (confirmationInput.value.trim() !== requiredText) {
            alert('請在最終確認欄位輸入指定文字！');
            return;
        }

        const orderData = {
            paopaohuId: paopaohuId,
            paymentCode: paymentCode,
            totalAmount: totalAmount,
            items: cart
        };
        
        fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('下單成功！感謝您的訂購。您的訂單已送出。');
                localStorage.removeItem('ruandiCart');
                window.location.href = 'index.html';
            } else {
                alert('下單失敗，錯誤訊息：' + data.message);
            }
        })
        .catch(error => {
            console.error('訂單提交錯誤:', error);
            alert('發生網路錯誤，請檢查後端伺服器是否正常運作。');
        });
    });
});