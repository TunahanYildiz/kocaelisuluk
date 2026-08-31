// ========================================
// SEPET SİSTEMİ FONKSİYONLARI
// ========================================

/**
 * Ürünü sepete ekler
 * @param {Object} product - { id, name, price, quantity }
 */
function addToCart(product) {
    // Mevcut sepeti al
    let cart = getCart();
    
    // Sepette aynı ID'ye sahip ürün var mı kontrol et
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingProductIndex !== -1) {
        // Ürün sepette varsa, adetini artır
        cart[existingProductIndex].quantity += product.quantity;
        console.log(`Sepette mevcut ürün güncellendi: ${product.name} (Yeni toplam adet: ${cart[existingProductIndex].quantity})`);
    } else {
        // Ürün sepette yoksa, yeni ürün olarak ekle
        cart.push(product);
        console.log(`Yeni ürün sepete eklendi: ${product.name} (${product.quantity} adet)`);
    }
    
    // Güncellenmiş sepeti kaydet
    saveCart(cart);
    
    return cart;
}

/**
 * Tarayıcının localStorage'ından sepet bilgilerini çeker
 * @returns {Array} Sepet dizisi
 */
function getCart() {
    const cartData = localStorage.getItem('sifakaynagi_cart');
    if (cartData) {
        try {
            const cart = JSON.parse(cartData);
            
            // Otomatik sepet temizleme kontrolü (3 saatte bir)
            checkAndClearOldCart();
            
            return cart;
        } catch (error) {
            console.error('Sepet verisi okunamadı:', error);
            return [];
        }
    }
    return [];
}

/**
 * Sepet dizisini localStorage'a kaydeder
 * @param {Array} cart - Kaydedilecek sepet dizisi
 */
function saveCart(cart) {
    try {
        localStorage.setItem('sifakaynagi_cart', JSON.stringify(cart));
        // Son güncelleme zamanını kaydet
        localStorage.setItem('lastCartUpdate', Date.now().toString());
        console.log('Sepet başarıyla kaydedildi:', cart);
    } catch (error) {
        console.error('Sepet kaydedilemedi:', error);
    }
}

/**
 * Otomatik sepet temizleme fonksiyonu (3 saatte bir)
 */
function checkAndClearOldCart() {
    const lastCartUpdate = localStorage.getItem('lastCartUpdate');
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000; // 3 saat = 3 * 60 * 60 * 1000 ms
    
    if (!lastCartUpdate || (now - parseInt(lastCartUpdate)) > threeHours) {
        // 3 saatten fazla geçmişse sepeti temizle
        localStorage.removeItem('sifakaynagi_cart');
        localStorage.setItem('lastCartUpdate', now.toString());
        console.log('Sepet otomatik olarak temizlendi (3 saat geçti)');
    }
}

/**
 * Sepet arayüzünü günceller
 */
function updateCartUI() {
    // Mevcut sepeti al
    const cart = getCart();
    
    // Sepet toplam ürün adetini hesapla
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Sayaç elementini seç ve güncelle
    const cartItemCount = document.getElementById('cart-item-count');
    if (cartItemCount) {
        cartItemCount.textContent = totalItems;
        cartItemCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    // Modal elementlerini seç
    const cartModalBody = document.getElementById('cart-modal-body');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    
    if (cart.length === 0) {
        // Sepet boş
        if (cartModalBody) {
            cartModalBody.innerHTML = '<p>Sepetiniz şu anda boş.</p>';
        }
        if (cartTotalPrice) {
            cartTotalPrice.textContent = '0.00 TL';
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
    } else {
        // Sepet dolu - ürünleri listele
        if (cartModalBody) {
            let cartHTML = '';
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                cartHTML += `
                    <div class="d-flex justify-content-between align-items-center cart-item mb-3" data-product-id="${item.id}">
                        
                        <!-- Sol Taraf: Ürün Adı ve Adet -->
                        <div>
                            <h6 class="mb-1 text-success">${item.name}</h6>
                            <div class="d-flex align-items-center text-muted small">
                                <button class="btn btn-sm btn-outline-secondary quantity-decrease mx-2">-</button>
                                <span>${item.quantity} Adet</span>
                                <button class="btn btn-sm btn-outline-secondary quantity-increase ms-2">+</button>
                            </div>
                        </div>

                        <!-- Sağ Taraf: Fiyat ve Sil Butonu -->
                        <div class="d-flex align-items-center">
                            <span class="badge bg-primary rounded-pill me-3">${(item.price * item.quantity).toFixed(2)} TL</span>
                            <button class="btn btn-outline-danger btn-sm rounded-circle remove-from-cart-btn">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>

                    </div>
                `;
            });
            
            cartModalBody.innerHTML = cartHTML;
        }
        
        // Toplam tutarı hesapla
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        if (cartTotalPrice) {
            cartTotalPrice.textContent = totalPrice.toFixed(2) + ' TL';
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
    }
    
    console.log('Sepet UI güncellendi. Toplam ürün sayısı:', cart.length);
    console.log('Toplam sepet adeti:', totalItems);
}

/**
 * Sepetten ürün silme fonksiyonu
 */
function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCart(updatedCart);
    updateCartUI();
    console.log('Ürün sepetten silindi:', productId);
}

/**
 * WhatsApp sipariş mesajı oluşturma fonksiyonu
 */
function generateWhatsAppMessage() {
    const cart = getCart();
    
    if (cart.length === 0) {
        return 'Merhaba, sipariş vermek istiyorum.';
    }
    
    let message = 'Merhaba, sipariş vermek istiyorum:\n\n';
    
    cart.forEach((item) => {
        const itemTotal = (item.price * item.quantity).toFixed(0);
        message += `🔸 ${item.name}\n`;
        message += `   Adet: ${item.quantity} (${itemTotal} TL)\n\n`;
    });
    
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    message += `Toplam Tutar: ${totalPrice.toFixed(2)} TL`;
  
    
    return message;
}

/**
 * Sepeti tamamen temizleme fonksiyonu
 */
function clearCart() {
    localStorage.removeItem('sifakaynagi_cart');
    localStorage.setItem('lastCartUpdate', Date.now().toString());
    updateCartUI();
    console.log('Sepet tamamen temizlendi');
}

/**
 * Ürün adetini artırma fonksiyonu (5'er 5'er)
 */
function increaseQuantity(productId) {
    const cart = getCart();
    const productIndex = cart.findIndex(item => item.id === productId);
    
    if (productIndex !== -1) {
        cart[productIndex].quantity += 5;
        saveCart(cart);
        updateCartUI();
        console.log('Ürün adeti artırıldı:', productId);
    }
}

/**
 * Ürün adetini azaltma fonksiyonu (5'er 5'er)
 */
function decreaseQuantity(productId) {
    const cart = getCart();
    const productIndex = cart.findIndex(item => item.id === productId);
    
    if (productIndex !== -1) {
        cart[productIndex].quantity -= 5;
        
        // Eğer adet 5'ten az düştüyse ürünü sepetten kaldır
        if (cart[productIndex].quantity < 5) {
            cart.splice(productIndex, 1);
        }
        
        saveCart(cart);
        updateCartUI();
        console.log('Ürün adeti azaltıldı:', productId);
    }
}

// ========================================
// SEPETE EKLEME FONKSİYONU
// ========================================

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    
    // Sayfa yüklendiğinde sepeti yükle
    updateCartUI();
    
    // Tüm "Sepete Ekle" butonlarını seç
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    // Her butona event listener ekle
    addToCartButtons.forEach(function(button) {
        // Her buton için özel zamanlayıcı değişkeni
        let buttonTimer = null;
        
        button.addEventListener('click', function() {
            
            // Butonun data özelliklerinden ürün bilgilerini al
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = button.getAttribute('data-product-price');
            
            // Aynı input-group içindeki adet alanının değerini al
            const inputGroup = button.closest('.input-group');
            const quantityInput = inputGroup.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value) || 5;
            
            // Ürün nesnesini oluştur
            const product = {
                id: productId,
                name: productName,
                price: parseInt(productPrice),
                quantity: quantity
            };
            
            // Ürünü sepete ekle
            const updatedCart = addToCart(product);
            
            // Konsola güncellenmiş sepeti yazdır
            console.log('Güncellenmiş sepet:', updatedCart);
            
            // Mevcut zamanlayıcıyı temizle (hızlı tıklamalar için)
            if (buttonTimer) {
                clearTimeout(buttonTimer);
            }
            
            // Görsel geri bildirim ver
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Eklendi';
            button.classList.add('added-to-cart');
            
            // 0.5 saniye sonra buton metnini eski haline getir
            buttonTimer = setTimeout(function() {
                button.disabled = false;
                button.innerHTML = originalText;
                button.classList.remove('added-to-cart');
            }, 500);
            
            // Sepet UI'ını güncelle
            updateCartUI();
            
        });
    });
    
    // WhatsApp checkout butonu event listener
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            try {
                const message = generateWhatsAppMessage();
                
                // WhatsApp URL'ini oluştur (mesajla birlikte)
                const whatsappUrl = `https://api.whatsapp.com/send?phone=905519482274&text=${encodeURIComponent(message)}`;
                
                console.log('WhatsApp URL:', whatsappUrl);
                console.log('Mesaj:', message);
                
                // Yeni sekmede aç
                window.open(whatsappUrl, '_blank');
                
                // Modal'ı kapat
                const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
                if (modal) {
                    modal.hide();
                }
                
            } catch (error) {
                console.error('WhatsApp linki oluşturulurken hata:', error);
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        });
    }
    
    // Sepet modal içindeki butonlar için event delegation
    document.addEventListener('click', function(e) {
        // Sil butonu
        if (e.target.closest('.remove-from-cart-btn')) {
            const button = e.target.closest('.remove-from-cart-btn');
            const cartItem = button.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            removeFromCart(productId);
        }
        
        // Adet artırma butonu
        if (e.target.closest('.quantity-increase')) {
            const button = e.target.closest('.quantity-increase');
            const cartItem = button.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            increaseQuantity(productId);
        }
        
        // Adet azaltma butonu
        if (e.target.closest('.quantity-decrease')) {
            const button = e.target.closest('.quantity-decrease');
            const cartItem = button.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            decreaseQuantity(productId);
        }
        
        // Ürün sayfasındaki adet artırma butonu (5'er 5'er)
        if (e.target.closest('.quantity-increase-btn')) {
            const button = e.target.closest('.quantity-increase-btn');
            const inputGroup = button.closest('.input-group');
            const quantityInput = inputGroup.querySelector('.quantity-input');
            const currentValue = parseInt(quantityInput.value) || 5;
            quantityInput.value = currentValue + 5;
        }
        
        // Ürün sayfasındaki adet azaltma butonu (5'er 5'er)
        if (e.target.closest('.quantity-decrease-btn')) {
            const button = e.target.closest('.quantity-decrease-btn');
            const inputGroup = button.closest('.input-group');
            const quantityInput = inputGroup.querySelector('.quantity-input');
            const currentValue = parseInt(quantityInput.value) || 5;
            if (currentValue > 5) {
                quantityInput.value = currentValue - 5;
            }
        }
    });
    
});

// ========================================
// ALIŞVERİŞE DEVAM ET BUTONU
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // "Alışverişe Devam Et" butonuna event listener ekle
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'continue-shopping-btn') {
            // Modal'ı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if (modal) {
                modal.hide();
            }
            
            // Ürünler sayfasına yönlendir
            window.location.href = 'urunler.html';
        }
    });
});

// ========================================
// NAVBAR SCROLL EFEKTİ
// ========================================

window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.custom-navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// ========================================
// SEPET DEBUG FONKSİYONLARI (Geliştirme için)
// ========================================

// Konsoldan sepeti temizlemek için
function clearCart() {
    localStorage.removeItem('sifakaynagi_cart');
    console.log('Sepet temizlendi');
    updateCartUI();
}

// Konsoldan sepeti görmek için
function showCart() {
    const cart = getCart();
    console.log('Mevcut sepet:', cart);
    return cart;
}

// Global fonksiyonları window nesnesine ekle (konsoldan erişim için)
window.clearCart = clearCart;
window.showCart = showCart;

// ========================================
// MOBİL MENÜ KAYDIRMA KİLİDİ
// ========================================
const navbarCollapse = document.getElementById('navbarNav');

if (navbarCollapse) {
    navbarCollapse.addEventListener('show.bs.collapse', function () {
        document.body.classList.add('body-no-scroll');
    });

    navbarCollapse.addEventListener('hide.bs.collapse', function () {
        document.body.classList.remove('body-no-scroll');
    });
}

// ========================================
// MOBİL MENÜ SCROLL İLE KAPATMA
// ========================================
let scrollTimeout;
document.addEventListener('scroll', function() {
    const isNavbarOpen = navbarCollapse && navbarCollapse.classList.contains('show');
    
    if (isNavbarOpen) {
        // Scroll başladığında menüyü kapat
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false
        });
        bsCollapse.hide();
        
        // Debounce için timeout kullan (çok hızlı scroll'da sürekli kapanmasın)
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Scroll durduktan sonra gerekli işlemler
        }, 100);
    }
});

// ========================================
// MOBİL MENÜ DIŞINA TIKLAYINCA KAPATMA
// ========================================
document.addEventListener('click', function(event) {
    const isNavbarOpen = navbarCollapse && navbarCollapse.classList.contains('show');
    const togglerButton = document.querySelector('.navbar-toggler');
    const isClickInsideNavbar = navbarCollapse && navbarCollapse.contains(event.target);
    const isClickOnToggler = togglerButton && togglerButton.contains(event.target);

    if (isNavbarOpen && !isClickInsideNavbar && !isClickOnToggler) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false
        });
        bsCollapse.hide();
    }
});