
// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

let cart = [];
let products = [];

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Загружаем корзину из localStorage
        loadCartFromStorage();
        
        // Загружаем товары
        await loadProductsFromJSON();
        
        // Отображаем товары
        displayProducts('all');
        
        // Обновляем счетчик корзины
        updateCartCount();
        
        // Настраиваем обработчик формы заказа
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', handleOrderSubmit);
        }
        
        // Обработчик открытия модального окна корзины
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.addEventListener('show.bs.modal', function () {
                renderCartModal();
            });
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки. Пожалуйста, обновите страницу.', 'danger');
    }
});

// ============================================
// ЗАГРУЗКА ТОВАРОВ ИЗ JSON
// ============================================

async function loadProductsFromJSON() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Не удалось загрузить товары');
        products = await response.json();
        console.log('✅ Загружено товаров:', products.length);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        // Если не удалось загрузить, создаем демо-товары
        products = getDemoProducts();
        showNotification('Используются демо-товары', 'warning');
    }
}

function getDemoProducts() {
    return [
        {
            "id": 1,
            "name": "The Witcher 3: Wild Hunt",
            "price": 1999,
            "description": "Эпическая RPG в мире фэнтези",
            "category": "RPG",
            "image": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
            "platform": "PC",
            "rating": 5
        },
        {
            "id": 2,
            "name": "Counter-Strike 2",
            "price": 0,
            "description": "Бесплатный тактический шутер",
            "category": "Шутер",
            "image": "https://images.igdb.com/igdb/image/upload/t_cover_big/co5f7a.jpg",
            "platform": "PC",
            "rating": 4
        }
    ];
}

// ============================================
// ОТОБРАЖЕНИЕ ТОВАРОВ
// ============================================

function displayProducts(filter = 'all') {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    let filteredProducts = products;
    if (filter !== 'all') filteredProducts = products.filter(p => p.category === filter);
    
    container.innerHTML = filteredProducts.length ? '' : getNoProductsHTML();
    
    filteredProducts.forEach(product => {
        container.innerHTML += createProductCard(product);
    });
}

function getNoProductsHTML() {
    return `
        <div class="col-12 text-center py-5">
            <i class="bi bi-emoji-frown display-1 text-muted mb-3"></i>
            <h3>Товары не найдены</h3>
            <p class="text-muted">Попробуйте выбрать другую категорию</p>
        </div>
    `;
}

function createProductCard(product) {
    return `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
            <div class="card h-100 product-card">
                <div class="position-relative">
                    <img src="${product.image}" class="card-img-top game-cover" alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x400?text=Game+Image'">
                    ${product.platform === 'PC' ? `<span class="position-absolute top-0 end-0 m-2 badge bg-info"><i class="bi bi-pc-display"></i></span>` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-primary category-badge">${product.category}</span>
                        <span class="badge bg-secondary category-badge">${product.platform}</span>
                    </div>
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text flex-grow-1 small text-muted">${product.description.substring(0, 100)}...</p>
                    
                    <div class="mb-2">
                        ${getRatingStars(product.rating)}
                        <small class="text-muted ms-1">${product.rating}.0</small>
                    </div>
                    
                    <div class="mt-auto">
                        <div class="mb-2">
                            <span class="h4 text-success mb-0">${product.price === 0 ? 'Бесплатно' : product.price + ' ₽'}</span>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="showProductInfo(${product.id})">
                                <i class="bi bi-info-circle me-1"></i>Подробнее
                            </button>
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                <i class="bi bi-cart-plus me-1"></i>В корзину
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function filterProducts(category) {
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    event.target.classList.remove('btn-outline-primary');
    event.target.classList.add('btn-primary', 'active');
    displayProducts(category);
}

// ============================================
// ИНФОРМАЦИЯ О ТОВАРЕ
// ============================================

function showProductInfo(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modalHTML = `
        <div class="modal fade" id="productModal${productId}">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${product.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${product.image}" class="img-fluid rounded" alt="${product.name}"
                                     onerror="this.src='https://via.placeholder.com/500x600?text=Game+Image'">
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <span class="badge bg-primary">${product.category}</span>
                                    <span class="badge bg-secondary ms-1">${product.platform}</span>
                                </div>
                                <p class="mb-3">${product.description}</p>
                                <div class="mb-3">
                                    <h5>Рейтинг:</h5>
                                    ${getRatingStars(product.rating)}
                                    <span class="ms-2">${product.rating}.0/5.0</span>
                                </div>
                                <div class="mb-3">
                                    <h5>Цена:</h5>
                                    <span class="h3 text-success">${product.price === 0 ? 'Бесплатно' : product.price + ' ₽'}</span>
                                </div>
                                <button class="btn btn-primary w-100" onclick="addToCart(${productId}); bootstrap.Modal.getInstance(document.getElementById('productModal${productId}')).hide();">
                                    <i class="bi bi-cart-plus me-2"></i>Добавить в корзину
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById(`productModal${productId}`)) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    new bootstrap.Modal(document.getElementById(`productModal${productId}`)).show();
}

// ============================================
// КОРЗИНА (УПРОЩЕННАЯ ВЕРСИЯ)
// ============================================

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('gamestore_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            console.log('✅ Корзина загружена:', cart.length, 'товаров');
        } else {
            cart = [];
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        cart = [];
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem('gamestore_cart', JSON.stringify(cart));
        console.log('💾 Корзина сохранена');
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('Товар не найден', 'danger');
        return;
    }
    
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        // Увеличиваем количество существующего товара
        cart[existingItemIndex].quantity += 1;
    } else {
        // Добавляем новый товар
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            platform: product.platform,
            quantity: 1
        });
    }
    
    // Сохраняем и обновляем
    saveCartToStorage();
    updateCartCount();
    showNotification(`${product.name} добавлен в корзину!`, 'success');
    
    // Если корзина открыта - обновляем её содержимое
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.classList.contains('show')) {
        renderCartModal();
    }
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems > 99 ? '99+' : totalItems;
    }
}

function renderCartModal() {
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartContent = document.getElementById('cart-content');
    const cartTableBody = document.getElementById('cart-table-body');
    const cartTotal = document.getElementById('cart-total');
    const totalAmount = document.getElementById('total-amount');
    const orderFormContainer = document.getElementById('order-form-container');
    
    if (!emptyCartMessage || !cartContent || !cartTableBody || !cartTotal || !totalAmount || !orderFormContainer) {
        console.error('Не найдены элементы корзины');
        return;
    }
    
    // Проверяем, пуста ли корзина
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartContent.style.display = 'none';
        cartTotal.style.display = 'none';
        orderFormContainer.style.display = 'none';
        return;
    }
    
    // Корзина не пуста - рисуем товары
    emptyCartMessage.style.display = 'none';
    cartContent.style.display = 'block';
    cartTotal.style.display = 'block';
    orderFormContainer.style.display = 'block';
    
    // Очищаем таблицу
    cartTableBody.innerHTML = '';
    
    let total = 0;
    
    // Добавляем каждый товар
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const row = document.createElement('tr');
        
        // Ячейка с информацией о товаре
        const productCell = document.createElement('td');
        productCell.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${item.image}" class="cart-item-image me-3" alt="${item.name}"
                     onerror="this.src='https://via.placeholder.com/60x60?text=Game'">
                <div>
                    <strong>${item.name}</strong><br>
                    <small class="text-muted">${item.platform}</small>
                </div>
            </div>
        `;
        
        // Ячейка с ценой
        const priceCell = document.createElement('td');
        priceCell.innerHTML = `<span>${item.price === 0 ? 'Бесплатно' : item.price + ' ₽'}</span>`;
        
        // Ячейка с количеством
        const quantityCell = document.createElement('td');
        quantityCell.innerHTML = `
            <div class="input-group input-group-sm" style="width: 120px;">
                <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, -1)">-</button>
                <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, 1)">+</button>
            </div>
        `;
        
        // Ячейка с суммой
        const totalCell = document.createElement('td');
        totalCell.textContent = item.price === 0 ? 'Бесплатно' : itemTotal + ' ₽';
        
        // Ячейка с кнопкой удаления
        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `
            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        
        // Добавляем ячейки в строку
        row.appendChild(productCell);
        row.appendChild(priceCell);
        row.appendChild(quantityCell);
        row.appendChild(totalCell);
        row.appendChild(deleteCell);
        
        // Добавляем строку в таблицу
        cartTableBody.appendChild(row);
    });
    
    // Обновляем итоговую сумму
    totalAmount.textContent = total + ' ₽';
}

function updateCartQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity < 1) {
            cart.splice(index, 1);
        }
        saveCartToStorage();
        updateCartCount();
        renderCartModal(); // Обновляем содержимое корзины
    }
}

function removeFromCart(index) {
    if (confirm('Удалить товар из корзины?')) {
        cart.splice(index, 1);
        saveCartToStorage();
        updateCartCount();
        renderCartModal(); // Обновляем содержимое корзины
        showNotification('Товар удален из корзины', 'warning');
    }
}

// ============================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ============================================

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'warning');
        return;
    }
    
    const orderData = {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        comment: document.getElementById('order-comment').value.trim(),
        cart: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderNumber: 'ORD-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('ru-RU')
    };
    
    // Проверка обязательных полей
    if (!orderData.name || !orderData.phone || !orderData.address) {
        showNotification('Заполните обязательные поля (имя, телефон, адрес)!', 'danger');
        return;
    }
    
    // Проверка телефона
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(orderData.phone) || orderData.phone.replace(/\D/g, '').length < 10) {
        showNotification('Введите корректный номер телефона', 'danger');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Оформляем...';
    submitBtn.disabled = true;
    
    try {
        const success = await sendToTelegram(orderData);
        
        if (success) {
            document.getElementById('order-number').textContent = orderData.orderNumber;
            
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (cartModal) cartModal.hide();
            
            setTimeout(() => {
                new bootstrap.Modal(document.getElementById('successModal')).show();
            }, 500);
            
            // Очищаем корзину
            cart = [];
            saveCartToStorage();
            updateCartCount();
            document.getElementById('order-form').reset();
        } else {
            showNotification('Ошибка при отправке заказа.', 'danger');
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showNotification('Произошла ошибка. Попробуйте снова.', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================
// ОТПРАВКА В TELEGRAM
// ============================================

async function sendToTelegram(orderData) {
    try {
        const message = formatTelegramMessage(orderData);
        
        const BOT_TOKEN = '8331215867:AAEIDwgyYqIMQu68MxzYq2UpPs_7g3P6NMQ';
        const CHAT_ID = '6648508240';
        
   
        
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('text', message);
        formData.append('parse_mode', 'HTML');
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.ok) {
                console.log('✅ Заказ успешно отправлен в Telegram!');
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
        // Сохраняем заказ локально как резервную копию
        saveOrderLocally(orderData);
        showNotification('Заказ сохранен. Проблемы с отправкой в Telegram.', 'warning');
        return true; // Для пользователя - успех
    }
}

function formatTelegramMessage(orderData) {
    let message = `🛒 <b>НОВЫЙ ЗАКАЗ #${orderData.orderNumber}</b>\n`;
    message += `📅 ${orderData.date}\n\n`;
    
    message += `<b>👤 КЛИЕНТ:</b>\n`;
    message += `├ Имя: ${orderData.name}\n`;
    message += `├ Телефон: ${orderData.phone}\n`;
    message += `├ Адрес: ${orderData.address}\n`;
    if (orderData.email) message += `├ Email: ${orderData.email}\n`;
    if (orderData.comment) message += `└ Комментарий: ${orderData.comment}\n`;
    
    message += `\n<b>🛍️ ТОВАРЫ (${orderData.cart.length}):</b>\n`;
    orderData.cart.forEach((item, index) => {
        const isLast = index === orderData.cart.length - 1;
        const prefix = isLast ? '└' : '├';
        message += `${prefix} ${item.name} (${item.platform})\n`;
        message += `  ${item.quantity} × ${item.price === 0 ? 'Бесплатно' : item.price + ' ₽'} = ${item.price === 0 ? 'Бесплатно' : (item.price * item.quantity) + ' ₽'}\n`;
    });
    
    message += `\n<b>💰 ИТОГО: ${orderData.total} ₽</b>\n`;
    message += `\n🆔 ID заказа: ${orderData.orderNumber}\n`;
    message += `⏰ ${orderData.date}`;
    
    return message;
}

function saveOrderLocally(orderData) {
    try {
        const savedOrders = JSON.parse(localStorage.getItem('gamestore_backup_orders') || '[]');
        savedOrders.push({
            ...orderData,
            timestamp: Date.now()
        });
        localStorage.setItem('gamestore_backup_orders', JSON.stringify(savedOrders));
        console.log('💾 Заказ сохранен локально:', orderData.orderNumber);
    } catch (e) {
        console.error('Ошибка сохранения локальной копии:', e);
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating 
            ? '<i class="bi bi-star-fill text-warning"></i>' 
            : '<i class="bi bi-star text-warning"></i>';
    }
    return stars;
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.alert-notification').forEach(el => el.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-notification position-fixed`;
    alertDiv.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 9999; 
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            ${getNotificationIcon(type)}
            <div class="ms-2">${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '<i class="bi bi-check-circle-fill text-success fs-4"></i>',
        danger: '<i class="bi bi-exclamation-circle-fill text-danger fs-4"></i>',
        warning: '<i class="bi bi-exclamation-triangle-fill text-warning fs-4"></i>',
        info: '<i class="bi bi-info-circle-fill text-info fs-4"></i>'
    };
    return icons[type] || icons.info;
}

// ============================================
// ДОБАВЛЯЕМ СТИЛИ
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .alert-notification {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
    }
`;
document.head.appendChild(style);