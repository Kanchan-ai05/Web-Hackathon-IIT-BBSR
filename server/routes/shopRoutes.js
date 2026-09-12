const express = require('express');
const router = express.Router();
const {
  getShopItems,
  purchaseItem,
  equipInventoryItem,
  createCustomReward,
  deleteCustomReward,
  getUserInventory,
  redeemInventoryItem
} = require('../controllers/shopController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.use(protect);

router.get('/items', getShopItems);
router.post('/purchase', purchaseItem);
router.post('/rewards', createCustomReward);
router.delete('/rewards/:id', validateObjectId('id'), deleteCustomReward);
router.get('/inventory', getUserInventory);
router.post('/inventory/:itemId/equip', validateObjectId('itemId'), equipInventoryItem);
router.post('/inventory/:itemId/redeem', validateObjectId('itemId'), redeemInventoryItem);

module.exports = router;
