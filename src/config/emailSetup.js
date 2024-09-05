const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
    }
})

const calculateServicesTotalPrice = ({ services }) => {
    let total = 0;
    services.forEach(service => {
        if (service.selectedComplexityType) {
            total += service.selectedComplexityType?.price || 0;
        }
        else {
            service.selectedSubServices?.forEach(subservice => {
                total += subservice.selectedComplexityType?.price || 0;
            })
        }
    })

    return total;
}


const calculateAdditionalCopyPrice = ({ file_format }) => {
    let total = 0;
    file_format.forEach((format, i) => {
        if (i !== 0) {
            total += format.price;
        }
    })

    return total;
}


const calculatePreferenceTimeAndPrice = ({ quantity }, { time, costPerImage }) => {
    time = +time;
    let str = '';
    if (time === 24) {
        str = '24 hours turnaround(included)';
    }
    else {
        if (costPerImage >= 0) {
            str = `${time} hours turnaround(+$${costPerImage} USD/image)`;
        }
        else {
            str = `${time} hours turnaround(-$${costPerImage * -1} USD/image)`;
        }
    }

    let cost;
    if (costPerImage === 0) {
        cost = `$0 USD`;
    }
    else if (costPerImage > 0) {
        cost = `+$${(costPerImage * quantity).toFixed(2)} USD`;
    }
    else {
        cost = `-$${(costPerImage * quantity * -1).toFixed(2)} USD`;
    }

    return {
        priceStr: str,
        price: cost,
    };
}


const createMailOptions = ({ isAdmin = false, order, template }) => {
    return {
        from: `"Bizphix" <${process.env.SMTP_MAIL}>`,
        to: isAdmin ? process.env.SMTP_MAIL : order.customer_email,
        subject: 'Your Order Confirmation',
        html: template,
        attachments: [
            {
                filename: 'logo.png',
                path: path.join(__dirname, '../../views/emails/images/logo.png'),
                cid: 'logo'
            },
            {
                filename: 'unkwon-ing.png',
                path: path.join(__dirname, '../../views/emails/images/unkwon-ing.png'),
                cid: 'unknown'
            },
            {
                filename: 'facebook.png',
                path: path.join(__dirname, '../../views/emails/images/icon/facebook.png'),
                cid: 'fb'
            },
            {
                filename: 'twitter.png',
                path: path.join(__dirname, '../../views/emails/images/icon/twitter.png'),
                cid: 'twitter'
            },
            {
                filename: 'instagram.png',
                path: path.join(__dirname, '../../views/emails/images/icon/instagram.png'),
                cid: 'instagram'
            },
            {
                filename: 'linkedin.png',
                path: path.join(__dirname, '../../views/emails/images/icon/linkedin.png'),
                cid: 'linkedin'
            }
        ]
    }
}



const sendEmail = async (order, next) => {
    order.price = calculateServicesTotalPrice(order);
    order.additionalCopyPrice = calculateAdditionalCopyPrice(order.preferences);
    order.prefTimePrice = calculatePreferenceTimeAndPrice(order, order.preferences);

    try { 
        const customerTemplate = await ejs.renderFile(path.join(__dirname, '../../views/emails/user_template.ejs'), { order, isAdmin: false });
        const mailOptions = createMailOptions({ isAdmin: false, order, template: customerTemplate });
 
        const adminTemplate = await ejs.renderFile(path.join(__dirname, '../../views/emails/user_template.ejs'), { order, isAdmin: true });
        const adminMailOptions = createMailOptions({ isAdmin: true, order, template: adminTemplate });

        
        async function sendEmailsWithRetry(attempts = 3, delay = 2000) {
            try { 
                await transporter.sendMail(mailOptions);
                await transporter.sendMail(adminMailOptions);
            } 
            catch (error) {
                if (attempts > 0) {  
                    await new Promise(resolve => setTimeout(resolve, delay));
                    await sendEmailsWithRetry(attempts - 1, delay);
                } 
                else {
                    console.error('Failed to send emails after multiple attempts:', error); 
                }
            }
        } 

        sendEmailsWithRetry(3, 2000);

    } 
    catch (error) {
        console.error('Failed to send email:', error);
        next({ status: 400, message: 'Email Sending Failed' });
    }
};


module.exports = { sendEmail };