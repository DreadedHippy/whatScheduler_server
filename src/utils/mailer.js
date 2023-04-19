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

					<h3>What is WhatScheduler?</h3>
					<pre>
						Whatscheduler is an Open Source project that allows you to schedule WhatsApp messages to be sent at a later time.
						Currently, it also supports sending messages to multiple contacts at once as well as sending recurring messages.
					</pre>
					<br/>

					<h3>Why do I need to verify my email?</h3>
					<pre>
						We need to verify your email to ensure that you are a real person and not a bot.
						We also need to verify your email to ensure that you are the owner of the WhatsApp account you are using.
						We do not store your WhatsApp credentials, we only use them to send messages to your contacts.
					</pre>

					<h3>How can I contribute to this project?</h3>
					<pre>
						You can contribute to this project by reporting bugs, suggesting new features, or even by contributing code.
						You can find the source code for this project on <a href="https://github.com/DreadedHippy/WhatScheduler">GitHub</a>.
					</pre>
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