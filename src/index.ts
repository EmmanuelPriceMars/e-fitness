import {Application,Router} from 'express'
import {Request, Response} from 'express'



const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const Recaptcha = require('express-recaptcha').RecaptchaV2
const formData = require('form-data')
const MailGun = require('mailgun.js')
const mailgun = new MailGun(formData)

const {check, validationResult} = require('express-validator')
const validation = [
    check('name', 'A valid name is required.').not().isEmpty().trim().escape(),
    check ('email', 'please provide a valid email.').isEmail(),
    check('subject').optional().trim().escape(),
    check ('message', 'a message of 2000 characters or less is needed.').trim().escape().isLength({min:1, max: 2000})

]

const app: Application = express()
app.use(morgan('dev'))
app.use (express.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())


const recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY)

const mg = mailgun.client({username: 'apis', key:process.env.MAILGUN_API_KEY})

const handleGetRequest = (request: Request, response: Response) => {
    return response.json ('this thing is on')
}

const handlePostRequest = (request: Request, response: Response) => {
    console.log (request.body)
    response.append('content-Type', 'text/html')

//@ts-ignore
    //   if (request.recaptcha.error){
    //       return response.send (
    //          `<div class='alert alert-danger' role='alert'><strong> holy molly!</strong> there was a recaptcha error. </div>`
    //      )
    //   }


    const errors = validationResult(Request)

    if (errors.isEmpty() === false) {
        const currentError = errors.array()[0]
        return response.send(`<div class='alert alert-danger' role='alert'> <strong> holy molly!</strong> ${currentError.msg}</div>`,
        )
    }
    const {name, email, subject,  message} = request.body

    const mailgunData = {
        to:process.env.MAIL_RECIPIENT,
        from:`${name} <postmaster@${process.env.MAILGUN_DOMAIN}>`,
        subject: `${email}: ${(subject)}`,
        text:message
    }

    mg.messages.create(process.env.MAILGUN_DOMAIN, mailgunData)
        .then((msg: any) =>
            response.send(`<div class ='alert alert-success role='alert'> email sent (please refresh page) </div>`)
        )
        .catch((error: any) =>
            {
                console.error(error)
                response.send(`<div class='alert alert-danger' role = 'alert'> Email Failed.(please refresh page and try again).</div>`)}

        )

}

const indexRoute = express.Router()
indexRoute.route ('/')
    .get(handleGetRequest)
    .post(recaptcha.middleware.verify,validation, handlePostRequest)

app.use('/apis', indexRoute)

app.listen(4200, () => {
    console.log('express Successfully built')
})
