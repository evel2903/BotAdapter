import express from 'express';
import dbContext from '../Database/dbContext.js';
const router = express.Router();

router.get('/', async function(req, res) {
  try {
    await dbContext.GetAccount().then(account => {
        const listHideField = account.map(item => {
            return {
                accountId: item.accountId
            }
        })
        res.send(listHideField)
    })
  }
  catch(error){
    console.log(error)
  }
});

router.post('/', async function(req, res) {
    try {
        // render và truyền mảng result sang file index.ejs
        const request = req.body
        let account = {
            accountId: request.accountId,
            accountAPIKey: request.accountAPIKey,
            accountSecretKey: request.accountSecretKey
        }
        await dbContext.InsertAccount(account).then( _ => {
            res.json({
                status: 'sussces',
                accountId: request.accountId
            })
        })
      }
      catch(error){
        console.log(error)
      }
})

router.delete('/:id', async function(req, res) {
    try {
        // render và truyền mảng result sang file index.ejs
        const accountId = req.params.id
        await dbContext.DeleteAccount(accountId).then( _ => {
            res.json({
                status: 'sussces',
                accountId: accountId
            })
        })
      }
      catch(error){
        console.log(error)
      }
})

export default router;
