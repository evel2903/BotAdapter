import express from 'express';
import dbContext from '../Database/dbContext.js';
const router = express.Router();

router.get('/', async function(req, res) {
  try {
    await dbContext.GetTelegramSetting().then(setting => {
        res.json(setting)
    })
  }
  catch(error){
    console.log(error)
  }
});

router.put('/', async function(req, res) {
    try {
        const request = req.body
        let setting = {
            telegramToken: request.telegramToken,
            telegramChannel: request.telegramChannel
        }
        await dbContext.UpdateTelegramSetting(setting).then( _ => {
            res.json({status: 'sussces'})
        })
      }
      catch(error){
        console.log(error)
      }
})

export default router;
