/**
 * Custom Product Popup with AJAX Cart Integration
 * Implements product popup modal with variant selection and add to cart functionality
 * Includes special business logic for Black + Medium variant combination
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    SOFT_WINTER_JACKET_HANDLE: 'soft-winter-jacket',
    BLACK_OPTION: 'Black',
    MEDIUM_OPTION: 'Medium'
  };

  // ============================================
  // State Management
  // ============================================
  /** @type {Array<{id: number, handle: string, title: string, description: string, price: string, compare_at_price: string, featured_image: string, variants: Array<{id: number, title: string, available: boolean, option1: string, option2: string, option3: string}>}>} */
  let productsData = [];
  /** @type {any} */
  let currentProduct = null;

  // ============================================
  // DOM Elements
  // ============================================
  const elements = {
    popup: /** @type {HTMLElement | null} */ (null),
    popupImage: /** @type {HTMLImageElement | null} */ (null),
    popupTitle: /** @type {HTMLElement | null} */ (null),
    popupPrice: /** @type {HTMLElement | null} */ (null),
    popupDescription: /** @type {HTMLElement | null} */ (null),
    variantSelect: /** @type {HTMLSelectElement | null} */ (null),
    addToCartForm: /** @type {HTMLFormElement | null} */ (null),
    addToCartBtn: /** @type {HTMLElement | null} */ (null),
    closeBtn: /** @type {HTMLElement | null} */ (null),
    message: /** @type {HTMLElement | null} */ (null),
    triggers: /** @type {NodeListOf<HTMLElement> | null} */ (null)
  };

  // ============================================
  // Initialization
  // ============================================
  function init() {
    // Load product data from JSON script tag
    loadProductData();
    
    // Cache DOM elements
    cacheElements();
    
    // Attach event listeners
    attachEventListeners();
    
    console.log('Custom Popup initialized successfully');
  }

  // ============================================
  // Load Product Data
  // ============================================
  function loadProductData() {
    const dataElement = document.getElementById('productData');
    if (dataElement) {
      try {
        const data = JSON.parse(dataElement.textContent);
        productsData = data.products || [];
        console.log('Loaded products:', productsData.length);
      } catch (error) {
        console.error('Error parsing product data:', error);
      }
    }
  }

  // ============================================
  // Cache DOM Elements
  // ============================================
  function cacheElements() {
    elements.popup = document.getElementById('productPopup');
    elements.popupImage = /** @type {HTMLImageElement | null} */ (document.getElementById('popupProductImage'));
    elements.popupTitle = document.getElementById('popupProductTitle');
    elements.popupPrice = document.getElementById('popupProductPrice');
    elements.popupDescription = document.getElementById('popupProductDescription');
    elements.variantSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('popupVariantSelect'));
    elements.addToCartForm = /** @type {HTMLFormElement | null} */ (document.getElementById('popupAddToCartForm'));
    elements.addToCartBtn = elements.addToCartForm ? elements.addToCartForm.querySelector('.popup-add-to-cart-btn') : null;
    elements.closeBtn = document.querySelector('.custom-popup-close');
    elements.message = document.getElementById('popupMessage');
    elements.triggers = document.querySelectorAll('.custom-grid-trigger');
  }

  // ============================================
  // Event Listeners
  // ============================================
  function attachEventListeners() {
    // Product trigger buttons
    if (elements.triggers && elements.triggers.length > 0) {
      elements.triggers.forEach(function(trigger) {
        trigger.addEventListener('click', handleTriggerClick);
      });
    }

    // Close button
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', closePopup);
    }

    // Close on overlay click
    if (elements.popup) {
      elements.popup.addEventListener('click', handleOverlayClick);
    }

    // Close on ESC key
    document.addEventListener('keydown', handleEscapeKey);

    // Add to cart form submission
    if (elements.addToCartForm) {
      elements.addToCartForm.addEventListener('submit', handleAddToCart);
    }
  }

  // ============================================
  // Handle Trigger Click
  // ============================================
  /** @param {Event} event */
  function handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const trigger = /** @type {HTMLElement} */ (event.currentTarget);
    const productId = parseInt(trigger.dataset.productId || '0');
    const productHandle = trigger.dataset.productHandle;
    
    // Find product in data
    const product = productsData.find(p => p.id === productId);
    
    if (product) {
      currentProduct = product;
      openPopup(product);
    } else {
      console.error('Product not found:', productId);
    }
  }

  // ============================================
  // Open Popup
  // ============================================
  /** @param {any} product */
  function openPopup(product) {
    if (!elements.popup) return;

    // Populate popup content
    populatePopupContent(product);
    
    // Show popup with animation
    elements.popup.style.display = 'flex';
    setTimeout(function() {
      if (elements.popup) {
        elements.popup.classList.add('active');
      }
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  // ============================================
  // Populate Popup Content
  // ============================================
  /** @param {any} product */
  function populatePopupContent(product) {
    // Set image
    if (elements.popupImage && product.featured_image) {
      elements.popupImage.src = product.featured_image;
      elements.popupImage.alt = product.title;
    }

    // Set title
    if (elements.popupTitle) {
      elements.popupTitle.textContent = product.title;
    }

    // Set price
    if (elements.popupPrice) {
      let priceHTML = `<span class="current-price">${product.price}</span>`;
      if (product.compare_at_price && product.compare_at_price !== product.price) {
        priceHTML = `<span class="compare-price">${product.compare_at_price}</span>` + priceHTML;
      }
      elements.popupPrice.innerHTML = priceHTML;
    }

    // Set description
    if (elements.popupDescription) {
      elements.popupDescription.textContent = product.description || 'No description available.';
    }

    // Populate variants
    populateVariants(product.variants);
    
    // Reset message
    hideMessage();
  }

  // ============================================
  // Populate Variants Dropdown
  // ============================================
  /** @param {Array<{id: number, title: string, available: boolean, option1: string, option2: string, option3: string}>} variants */
  function populateVariants(variants) {
    if (!elements.variantSelect) return;

    // Clear existing options
    elements.variantSelect.innerHTML = '<option value="">Choose an option</option>';

    // Add variant options
    if (variants && variants.length > 0) {
      variants.forEach(function(variant) {
        const option = document.createElement('option');
        option.value = String(variant.id);
        option.textContent = variant.title;
        option.disabled = !variant.available;
        
        if (!variant.available) {
          option.textContent += ' (Sold Out)';
        }
        
        // Store variant data as data attributes for business logic
        option.dataset.option1 = variant.option1 || '';
        option.dataset.option2 = variant.option2 || '';
        option.dataset.option3 = variant.option3 || '';
        
        if (elements.variantSelect) {
          elements.variantSelect.appendChild(option);
        }
      });
    }
  }

  // ============================================
  // Handle Add to Cart
  // ============================================
  /** @param {Event} event */
  async function handleAddToCart(event) {
    event.preventDefault();
    
    if (!elements.variantSelect) return;
    
    const variantId = elements.variantSelect.value;
    
    if (!variantId) {
      showMessage('Please select a variant', 'error');
      return;
    }

    // Get selected variant data
    const selectedOption = elements.variantSelect.options[elements.variantSelect.selectedIndex];
    if (!selectedOption) return;
    
    const variantData = {
      id: variantId,
      option1: selectedOption.dataset.option1 || '',
      option2: selectedOption.dataset.option2 || '',
      option3: selectedOption.dataset.option3 || ''
    };

    // Disable button and show loading
    setButtonLoading(true);
    hideMessage();

    try {
      // Add main product to cart
      await addToCart(variantId);
      
      // Check for special business logic: Black + Medium
      const shouldAddJacket = checkSpecialCondition(variantData);
      
      if (shouldAddJacket) {
        await addSoftWinterJacket();
      }
      
      // Show success message
      showMessage(
        shouldAddJacket 
          ? '✓ Added to cart! (Soft Winter Jacket also added)' 
          : '✓ Successfully added to cart!',
        'success'
      );
      
      // Update cart UI if available (Dawn theme cart icon)
      updateCartCount();
      
      // Close popup after delay
      setTimeout(function() {
        closePopup();
      }, 1500);
      
    } catch (error) {
      console.error('Add to cart error:', error);
      showMessage(error.message || 'Failed to add to cart. Please try again.', 'error');
    } finally {
      setButtonLoading(false);
    }
  }

  // ============================================
  // Check Special Business Logic Condition
  // ============================================
  /** @param {{id: string, option1: string, option2: string, option3: string}} variantData */
  function checkSpecialCondition(variantData) {
    // Check if variant contains Color: Black AND Size: Medium
    const hasBlack = 
      variantData.option1 === CONFIG.BLACK_OPTION || 
      variantData.option2 === CONFIG.BLACK_OPTION || 
      variantData.option3 === CONFIG.BLACK_OPTION;
    
    const hasMedium = 
      variantData.option1 === CONFIG.MEDIUM_OPTION || 
      variantData.option2 === CONFIG.MEDIUM_OPTION || 
      variantData.option3 === CONFIG.MEDIUM_OPTION;
    
    return hasBlack && hasMedium;
  }

  // ============================================
  // Add Product to Cart via AJAX
  // ============================================
  /**
   * @param {string|number} variantId
   * @param {number} quantity
   */
  async function addToCart(variantId, quantity = 1) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: variantId,
        quantity: quantity
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.description || 'Failed to add to cart');
    }

    return await response.json();
  }

  // ============================================
  // Add Soft Winter Jacket (Special Business Logic)
  // ============================================
  async function addSoftWinterJacket() {
    try {
      // First, fetch the product to get its variant ID
      const response = await fetch(`/products/${CONFIG.SOFT_WINTER_JACKET_HANDLE}.js`);
      
      if (!response.ok) {
        console.warn('Soft Winter Jacket product not found');
        return;
      }

      const jacketProduct = await response.json();
      
      // Get first available variant
      const availableVariant = jacketProduct.variants.find(
        /** @param {{available: boolean, id: number}} v */
        function(v) { return v.available; }
      );
      
      if (availableVariant) {
        await addToCart(availableVariant.id, 1);
        console.log('Successfully added Soft Winter Jacket');
      } else {
        console.warn('No available variants for Soft Winter Jacket');
      }
    } catch (error) {
      console.error('Error adding Soft Winter Jacket:', error);
      // Don't throw error - this is a bonus feature
    }
  }

  // ============================================
  // Update Cart Count (Dawn Theme Integration)
  // ============================================
  async function updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Update cart count in Dawn theme header
      const cartCountElements = document.querySelectorAll('.cart-count-bubble span');
      cartCountElements.forEach(function(element) {
        element.textContent = String(cart.item_count);
      });
      
      // Trigger cart drawer update if available
      document.documentElement.dispatchEvent(
        new CustomEvent('cart:refresh', { bubbles: true })
      );
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }

  // ============================================
  // UI Helper Functions
  // ============================================
  /** @param {boolean} isLoading */
  function setButtonLoading(isLoading) {
    if (!elements.addToCartBtn) return;
    
    const btnText = /** @type {HTMLElement | null} */ (elements.addToCartBtn.querySelector('.btn-text'));
    const btnLoading = /** @type {HTMLElement | null} */ (elements.addToCartBtn.querySelector('.btn-loading'));
    const btn = /** @type {HTMLButtonElement} */ (elements.addToCartBtn);
    
    if (!btnText || !btnLoading) return;
    
    if (isLoading) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
    } else {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  /**
   * @param {string} text
   * @param {string} type
   */
  function showMessage(text, type = 'success') {
    if (!elements.message) return;
    
    elements.message.textContent = text;
    elements.message.className = `popup-message ${type}`;
    elements.message.style.display = 'block';
  }

  function hideMessage() {
    if (!elements.message) return;
    elements.message.style.display = 'none';
  }

  // ============================================
  // Close Popup Functions
  // ============================================
  function closePopup() {
    if (!elements.popup) return;
    
    elements.popup.classList.remove('active');
    
    setTimeout(function() {
      if (elements.popup) {
        elements.popup.style.display = 'none';
      }
      document.body.style.overflow = '';
      
      // Reset form
      if (elements.addToCartForm) {
        elements.addToCartForm.reset();
      }
      hideMessage();
      currentProduct = null;
    }, 300);
  }

  /** @param {Event} event */
  function handleOverlayClick(event) {
    if (event.target === elements.popup) {
      closePopup();
    }
  }

  /** @param {KeyboardEvent} event */
  function handleEscapeKey(event) {
    if (event.key === 'Escape' && elements.popup && elements.popup.classList.contains('active')) {
      closePopup();
    }
  }

  // ============================================
  // Initialize on DOM Ready
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
