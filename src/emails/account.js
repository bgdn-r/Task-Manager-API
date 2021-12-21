const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
	sgMail.send({
		to: email,
		from: "bogdanristic95@gmail.com",
		subject: "Thanks for joining in!",
		text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
	});
};

const sendCancelationEmail = (name, email) => {
	sgMail.send({
		to: email,
		from: "bogdanristic95@gmail.com",
		subject: "Sorry to see you leaving.",
		text: `Goodbye, ${name}. Hope to see you back sometimes soon.`,
	});
};

module.exports = { sendWelcomeEmail, sendCancelationEmail };
