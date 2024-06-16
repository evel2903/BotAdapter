import express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    // render và truyền mảng result sang file index.ejs
    res.render('index', {title: `Cài đặt thông số Bot`});
  } catch (error) {
    next(error); // xử lý lỗi
  }
});

export default router;
