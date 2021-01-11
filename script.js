// Selectors
const cartBtn = document.querySelector('.cart-btn');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total')
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const productsDOM = document.querySelector('#products-container');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartContent = document.querySelector('.cart-content');

let buttonsDOM = [];
let cartArr = [];

// Fetching products from JSON
class Products {
  async fetchProducts(){
    try {
      let response = await fetch('./products.json');
      let results = await response.json();
      let products = results.items;
    
      products = products.map(item => {
        const id = item.id;
        const {title, price, image} = item.fields;
        
        return {id, title, price, image}
      });      
      return products;      
    }
    catch(err) {
      console.log(err);
    }
  };
}

class Interface {
  // Displaying the products
  displayProducts(products) {
    let result = '';
    products.forEach(product => {
      result += `
        <!-- Product -->
        <article class="product">
          <div class="img-container">
            <img src="${product.image}" alt="${product.title}">
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i> add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$ ${product.price}</h4>
        </article>
      `
    })
    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;

    buttons.forEach(button => {
      let id = button.dataset.id;           
      let isInCart = cartArr.find(item => item.id === id);      
      
      if(isInCart) {
        button.innerText = 'In Cart';
        button.disabled = true;
      } 
      button.addEventListener('click', (event) => {
        event.target.innerText = 'In Cart';
        event.target.disabled = true;

        let cartItem = {...Storage.getProduct(id), amount: 1};        

        cartArr = [...cartArr, cartItem];

        Storage.saveCart(cartArr);
        this.setCartValues(cartArr);
        this.addItemToCart(cartItem);
        this.openCart();
      })
    });
  }

  setCartValues(cart) {
    let sumTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      sumTotal += item.price * item.amount;
      itemsTotal += item.amount;
    })

    cartTotal.innerText = parseFloat(sumTotal).toFixed(2);
    cartItems.innerText = itemsTotal;
  }

  // Add item to cart
  addItemToCart(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');

    div.innerHTML = `
      <img src=${item.image} alt=${item.title}>
      <div>
        <h3>${item.title}</h3>
        <h4>$ ${item.price}</h4>
        <span class="remove-item" data-id=${item.id}>remove</span>
      </div>
      <div>
        <i class="fas fa-chevron-up" data-id=${item.id}></i>
        <p class="item-amount">${item.amount}</p>
        <i class="fas fa-chevron-down" data-id=${item.id}></i>
      </div>          
    `
    cartContent.appendChild(div);
  }

  fillCart(cart) {
    cart.forEach(item => this.addItemToCart(item));
  }

  openCart() {
    cartOverlay.classList.add('overlayed');
    cartDOM.classList.add('open');
  }
  closeCart() {
    cartOverlay.classList.remove('overlayed');
    cartDOM.classList.remove('open');
  }

  setupApp() {
    cartArr = Storage.getCart();  
    this.setCartValues(cartArr);  
    this.fillCart(cartArr);
    cartBtn.addEventListener("click", this.openCart);
    closeCartBtn.addEventListener("click", this.closeCart);
  }

  getButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }

  removeItem(id) {
    cartArr = cartArr.filter(item => item.id !== id);
    this.setCartValues(cartArr);
    Storage.saveCart(cartArr);
    let button = this.getButton(id);
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-shopping-cart"></i> add to cart';
  }

  clearCart() {
    let cartItems = cartArr.map(item => item.id);
    
    cartItems.forEach(id => this.removeItem(id));
    
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.closeCart();
  }

  cartFunctionality() {
    clearCartBtn.addEventListener('click', () => {
      this.clearCart();
    })

    cartContent.addEventListener('click', (event) => {
      if(event.target.classList.contains('remove-item')) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;

        cartContent.removeChild(removeItem.parentElement.parentElement);

        this.removeItem(id);
      } 
      else if(event.target.classList.contains('fa-chevron-up')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;

        let selectedItem = cartArr.find(item =>  item.id === id);

        selectedItem.amount = selectedItem.amount + 1;
        Storage.saveCart(cartArr);
        this.setCartValues(cartArr);
        addAmount.nextElementSibling.innerText = selectedItem.amount;
      }
      else if (event.target.classList.contains('fa-chevron-down')) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;

        let selectedItem = cartArr.find(item => item.id === id);

        selectedItem.amount = selectedItem.amount - 1;

        if(selectedItem.amount > 0) {
          Storage.saveCart(cartArr);
          this.setCartValues(cartArr);
          lowerAmount.previousElementSibling.innerText = selectedItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
          Storage.saveCart(cartArr);
          this.setCartValues(cartArr);
        }
      }
    })
  }
}

// Storage
class Storage {
  static saveProduct(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id); 
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
  }
}
 
// Event listener
document.addEventListener('DOMContentLoaded', () => {  
  let interface = new Interface();
  let products = new Products();

  interface.setupApp();

  products.fetchProducts()
    .then(products => {
      interface.displayProducts(products);
      Storage.saveProduct(products);      
    })
    .then(() => {
      interface.getBagButtons();
      interface.cartFunctionality();
    });
})

