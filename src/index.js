const express = require('express');
const cors = require('cors');
const connectDB = require('./config/dbConnection');
const corsOptions = require('./config/corsOptions');
const cookieParser = require('cookie-parser');
const { logger } = require('./api/middleware/logger');
const apiLimiter = require('./api/middleware/rateLimiter');
const ErrorHandler = require('./utills/ErrorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.set('view engine', 'ejs');
app.use(logger)
// app.use(apiLimiter)
app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cookieParser()) 

app.use('/order', require('./routes/orderRoute'))

// Non-Standard routes
app.use(function(req, res, next) { 
    next(ErrorHandler.notFound('Route Not Found'))
}) 

// Error Handling Middleware 
app.use(function(err, req, res, next) { 
    return res.status(err.status).json({ 
        hasError: true, 
        status: err.status, 
        message: err.message 
    }) 
}); 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
