import express from 'express';
import dbContext from '../Database/dbContext.js';
const router = express.Router();

router.get('/', async function (req, res) {
  try {
    await dbContext.GetSetting().then(setting => {
      res.json(setting)
    })
  }
  catch (error) {
    console.log(error)
  }
});

router.put('/', async function (req, res) {
  try {
    const request = req.body
    let setting = {
      typeOrder: request.typeOrder,
    }
    await dbContext.UpdateSetting(setting).then(_ => {
      res.json({ status: 'sussces' })
    })
  }
  catch (error) {
    console.log(error)
  }
})

export default router;
