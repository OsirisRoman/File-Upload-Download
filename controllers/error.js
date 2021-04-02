exports.get404 = (req, res, next) => {
  res.status(404).render('404NotFound', {
    pageTitle: '404 Not Found',
    path: '',
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render('500ServerError', {
    pageTitle: 'Error!',
    path: '',
  });
};
