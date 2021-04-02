const express = require('express');

const shopController = require('../controllers/shop');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

router.get('/', shopController.goToHome);
router.get('/product-list', shopController.getProductList);
router.get('/product-details/:productId', shopController.getProductDetails);
router.get('/cart', isAuth, shopController.getUserCart);
router.post('/cart', isAuth, shopController.postUserCart);
router.post(
  '/delete-product-from-cart',
  isAuth,
  shopController.postDeleteProductFromCart
);
router.post('/create-order', isAuth, shopController.postUserOrders);
router.get('/orders', isAuth, shopController.getUserOrders);
router.get('/checkout', isAuth, shopController.goToCheckout);

module.exports = router;
