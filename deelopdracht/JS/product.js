"use strict";

// winkelmandje
const cart = JSON.parse(localStorage.getItem("cart")) || {};

// Toevoegen
function addToCart(productId, productName, price) {
  if (cart[productId]) {
    cart[productId].quantity += 1;
  } else {
    cart[productId] = { name: productName, quantity: 1, price: price };
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
}

// Winkelmand tonen in de aside
function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  if (!cartItems) return;

  cartItems.innerHTML = "";

  if (Object.keys(cart).length === 0) {
    cartItems.innerHTML = "<li>Je winkelmandje is leeg</li>";
    return;
  }

  // Producten toevoegen in de lijst
  Object.entries(cart).forEach(([productId, product]) => {
    const li = document.createElement("li");
    li.innerHTML = `
            ${product.name} - Aantal: ${product.quantity} - Prijs: €${(
      product.price * product.quantity
    ).toFixed(2)}
            <button class="remove-item" data-id="${productId}">Verwijder</button>
        `;
    cartItems.appendChild(li);
  });

  // Werking van de verwijder knop
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.target.getAttribute("data-id");
      removeFromCart(productId);
    });
  });
}

// Verwijder een specifiek product uit het winkelmandje
function removeFromCart(productId) {
  delete cart[productId];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
}

// Legen van het hele winkelmandje
function clearCart() {
  localStorage.removeItem("cart");
  Object.keys(cart).forEach((key) => delete cart[key]);
  updateCartDisplay();
}

// Toon of verberg het winkelmandje
function toggleCart() {
  const shoppingCart = document.getElementById("shopping-cart");
  shoppingCart.classList.toggle("hidden");
  shoppingCart.classList.toggle("visible");
}

// Event Listeners instellen bij pagina-laden
document.addEventListener("DOMContentLoaded", () => {
  const cartTrigger = document.getElementById("winkelmand-trigger");
  const clearButton = document.getElementById("clear-cart");

  // Event Listener voor de "Winkelmandje" nav-trigger
  if (cartTrigger) {
    cartTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      toggleCart();
    });
  }

  // Event Listener voor "Legen"-knop
  if (clearButton) {
    clearButton.addEventListener("click", clearCart);
  }

  // Voor de "In het winkelmandje"-knop op productpagina
  const addToCartButton = document.getElementById("add-to-cart");
  if (addToCartButton) {
    addToCartButton.addEventListener("click", (event) => {
      event.preventDefault();

      const productId =
        document.querySelector("section").id || "product-detail";
      const productName = document.getElementById("materiaal").textContent;
      const price = parseFloat(
        document
          .getElementById("prijs")
          .textContent.replace("€", "")
          .replace(",", ".")
      );

      addToCart(productId, productName, price);
    });
  }

  updateCartDisplay();
});

// wishlist
const wishlist = new Set(JSON.parse(localStorage.getItem("wishlist")) || []);

// Functie om wishlist te toggelen
function toggleWishlist(productId, iconElement) {
  const isInWishlist = wishlist.has(productId);
  if (isInWishlist) {
    wishlist.delete(productId);
  } else {
    wishlist.add(productId);
  }
  iconElement.classList.toggle("added", !isInWishlist);
  localStorage.setItem("wishlist", JSON.stringify([...wishlist]));
  alert(
    `Het product is ${
      isInWishlist ? "verwijderd uit" : "toegevoegd aan"
    } je wishlist.`
  );
}

// Event listener toevoegen na pagina laden
document.addEventListener("DOMContentLoaded", () => {
  const wishlistIcon = document.querySelector(".wishlist");
  if (wishlistIcon) {
    const productId = document.querySelector("section").id || "product-detail";
    wishlistIcon.classList.toggle("added", wishlist.has(productId));
    wishlistIcon.addEventListener("click", () =>
      toggleWishlist(productId, wishlistIcon)
    );
  }
});
