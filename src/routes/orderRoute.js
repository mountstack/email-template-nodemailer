const express = require('express');
const router = express.Router();
const orderController = require('../api/controllers/orderController');
const { protect, admin } = require('../api/middleware/auth');
const createOrderValidation = require('../api/middleware/createOrderValidation');

console.log(createOrderValidation);

router.route('/')
    .get(orderController.getAllOrders)
    .post(createOrderValidation, orderController.createOrder)

router.route('/:id')
    .get(orderController.getOrderById)
    .put(protect, admin, orderController.updateOrder)
    .delete(protect, admin, orderController.deleteOrder)

router.route('/:email')
    .get(orderController.getOrdersByCustomerEmail)

router.route('/status') 
    .get(orderController.getOrdersByStatus)

router.route('/:id/status')
    .put(protect, admin, orderController.updateOrderStatus)

module.exports = router;