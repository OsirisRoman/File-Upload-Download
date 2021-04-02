const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

const nameValidation = body('name')
  .isLength({ min: 1 })
  .withMessage('The product requires a name');

const descriptionValidation = body('description')
  .isLength({ min: 5 })
  .withMessage('The product description must contain at least 5 characters.');

const imageValidation = body('imageUrl')
  .isLength({ min: 1 })
  .withMessage('The product requires an image');

const priceValidation = body('price').custom((value, { req }) => {
  //The following regex checks for integer or real numbers
  //The string will begin and end by a number
  //The string is allowed to have just one decimal point
  if (!/^\d+(\.?\d+)$/.test(value)) {
    throw new Error('The product price is invalid.');
  }
  return true;
});

router.get('/add-product', isAuth, adminController.getAddProduct);
router.post(
  '/add-product',
  isAuth,
  nameValidation,
  descriptionValidation,
  imageValidation,
  priceValidation,
  adminController.postAddProduct
);
router.post('/delete-product', isAuth, adminController.postDeleteProduct);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post(
  '/edit-product/:productId',
  isAuth,
  nameValidation,
  descriptionValidation,
  imageValidation,
  priceValidation,
  adminController.postEditProduct
);
router.get('/product-list', isAuth, adminController.getProductList);

module.exports = router;
