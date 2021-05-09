const Product = require("../models/product");
const Order = require("../models/order");

const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const Constants = require("../Constants");

const getProductList = (req, res, next) => {
  let page = +req.query.page || 1;
  let numberOfProducts;

  Product.find()
    .countDocuments()
    .then(totalItems => {
      numberOfProducts = totalItems;
      if (!Number.isInteger(page)) {
        page = Math.floor(page);
      }

      if (
        numberOfProducts > 1 &&
        page > Math.ceil(numberOfProducts / Constants.ITEMS_PER_PAGE)
      ) {
        page = Math.ceil(numberOfProducts / Constants.ITEMS_PER_PAGE);
      } else if (page < 1) {
        page = 1;
      }

      return Product.find()
        .skip((page - 1) * Constants.ITEMS_PER_PAGE)
        .limit(Constants.ITEMS_PER_PAGE);
    })
    .then(products => {
      products.forEach(product => {
        product.price = (product.price / 100).toFixed(2);
      });
      res.render("shop/product-list", {
        productList: products,
        pageTitle: "Shop",
        path: "/product-list",
        numberOfProducts,
        currentPage: page,
        hasNextPage: Constants.ITEMS_PER_PAGE * page < numberOfProducts,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(numberOfProducts / Constants.ITEMS_PER_PAGE),
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getUserCart = (req, res, next) => {
  req.user
    .populate("cart.productId")
    .execPopulate()
    .then(populatedUser => {
      const cart = [];
      populatedUser.cart.forEach(product => {
        cart.push({
          _id: product.productId._id,
          name: product.productId.name,
          imageUrl: product.productId.imageUrl,
          description: product.productId.description,
          price: (product.productId.price / 100).toFixed(2),
          quantity: product.quantity,
        });
      });
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: cart,
        totalToPay: (
          populatedUser.cart.reduce((accumulator, currentValue) => {
            return (
              accumulator + currentValue.productId.price * currentValue.quantity
            );
          }, 0) / 100
        ).toFixed(2),
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postDeleteProductFromCart = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postUserCart = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .addToCart(productId)
    .then(() => {
      res.redirect("cart");
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const postUserOrders = (req, res, next) => {
  req.user
    .populate("cart.productId")
    .execPopulate()
    .then(populatedUser => {
      const cart = [];
      populatedUser.cart.forEach(product => {
        cart.push({
          name: product.productId.name,
          price: (product.productId.price / 100).toFixed(2),
          quantity: product.quantity,
        });
      });

      const order = new Order({
        products: cart,
        totalToPay: (
          populatedUser.cart.reduce((accumulator, currentValue) => {
            return (
              accumulator + currentValue.productId.price * currentValue.quantity
            );
          }, 0) / 100
        ).toFixed(2),
        user: req.user._id,
      });
      return order.save();
    })
    .then(() => {
      return req.user.resetCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getUserOrders = (req, res, next) => {
  Order.find({ user: req.user._id })
    .then(orders => {
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        console.log("No order found");
        return next(error);
      }
      if (order.user.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized!"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "inline; filename=" + invoiceName + ""
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text(`Invoice #${order._id}`),
        {
          underline: true,
        };
      pdfDoc.text("-----------------------");

      order.products.forEach(item => {
        pdfDoc
          .fontSize(14)
          .text(`${item.name} - ${item.quantity} x $${item.price}`);
      });

      pdfDoc.text("-----------");
      pdfDoc.fontSize(20).text(`Total Price: $${order.totalToPay}`);

      pdfDoc.end();

      //const file = fs.createReadStream(invoicePath);

      //file.pipe(res);
    })
    .catch(err => {
      next(err);
    });
};

const goToCheckout = (req, res, next) => {
  res.render("shop/checkout", {
    pageTitle: "User Cart",
    path: "/checkout",
  });
};

const goToHome = (req, res, next) => {
  res.render("shop/index", {
    pageTitle: "User Landing Page",
    path: "/",
  });
};

const getProductDetails = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then(product => {
      product.price = (product.price / 100).toFixed(2);
      res.render("shop/product-details", {
        product: product,
        pageTitle: product.name,
        path: "/product-list",
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {
  getProductList,
  getUserCart,
  postUserCart,
  postDeleteProductFromCart,
  postUserOrders,
  getUserOrders,
  getInvoice,
  goToCheckout,
  goToHome,
  getProductDetails,
};
