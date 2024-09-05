const { sendEmail } = require('../../config/emailSetup'); 
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utills/ErrorHandler');

const createOrder = async (req, res, next) => { 
    try { 
        console.log({"->": 1});
        let count = await Order.countDocuments();
        count = count + 1; 
        count = count.toString().padStart(4, '0'); 
        
        const newOrder = new Order({...req.body, order_id: count});
        const savedOrder = await newOrder.save(); 

        console.log('Order has been created successfully', savedOrder);

        
        await sendEmail({...req.body, order_id: count}, next);
        

        return res.status(201).json({
            savedOrder,
            message: 'Order has been created successfully'
        });
    }
    catch (error) {
        console.error('Something went wrong:', error);
        next(error); 
    }
}

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByCustomerEmail,
    updateOrderStatus,
    getOrdersByStatus
}