import nml from "nodemailer"
import dotenv from "dotenv"
dotenv.config()


let transporter = nml.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL,
		pass: process.env.EMAIL_PASS
	}
})


export function sendVerificationMail(receiver, verificationLink) {
	return new Promise((resolve, reject) => {
		let mailOptions = {
			from: process.env.EMAIL,
			to: receiver,
			subject: "Email Verification for WhatScheduler",
			html: `
				<h1 style="text-align: center" >Verify your email</h1>
	
				<div style='padding: 3px 8px; text-align: center;'>
					<h2>Hey there new user 👋, welcome to WhatScheduler</h2>
					<p style="text-align: center">Click the link below to verify your email</p>
					<br/>
	
					<a href="${verificationLink}" style="text-decoration: none; padding: 10px 20px; background-color: #3f51b5; color: white; border-radius: 5px;">Verify Email</a>
				</div>
			`
		}

		transporter.sendMail(mailOptions, function(error, info){
			if(error){
				console.log(error)
				reject("Message failed to send")
			}else {
				resolve("Message sent successfully")
			}

		})
	})
}