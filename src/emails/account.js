const sgMail = require('@sendgrid/mail');
console.log('fetching key from config file ',process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email,name) =>{
    console.log('sendWelcomeMethod called successfully')
    sgMail.send({
        to : email,
        from : 'insanegaurav.17@gmail.com',
        subject : 'Thanks for joining in!',
        text : `Welcome to the app, ${name}. Let me know how you get along with the app`,
    })
}

const sendCancellationEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'insanegaurav.17@gmail.com',
        subject : 'Thanks for using are application',
        text : `Bye ${name}. What better could have we done to keep you using our app'`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
