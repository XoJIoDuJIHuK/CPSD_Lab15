const express = require('express')
const { engine, ExpressHandlebars } = require('express-handlebars')
const HBS = require('express-handlebars')
const bodyParser = require('body-parser')
const fs = require('fs')

const app = express()
const port = 3000

function renderPage(response, parameters) {
	response.render('layouts/main', Object.assign({ phonebook: phonebookData }, parameters))
}
function renderError(response, message) {
	response.status(404).contentType('json').send(JSON.stringify(message))
}
function getPersonByName(name) {
	return phonebookData.find(obj => obj.name === name)
}
function checkPhoneNumber(phoneNumber) {
	return (new RegExp(/^\+[1-9]\d{9,11}$/g)).test(phoneNumber)
}


app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'hbs')
app.engine('hbs', engine({
	helpers: {
		refuseButton: function () {
			return '<button type="button" onclick="window.location.href=\'/\'">Отказаться</button>'
		}
	},
	extname: 'hbs'
}))

app.use(express.static('public'))

const phonebookData = JSON.parse(fs.readFileSync('phoneBook.json'))
setInterval(() => {
	fs.writeFileSync('phoneBook.json', JSON.stringify(phonebookData))
}, 2000)

app.get('/', (req, res) => {
	renderPage(res, { renderGet: true })
})

app.get('/add', (req, res) => {
	renderPage(res, { renderAdd: true })
})

app.get('/update', (req, res) => {
	const name = req.query.name
	if (!getPersonByName(name)) {
		renderError(res, { message: "invalid no such name" })
		return
	}
	renderPage(res, { renderUpdate: true, person: getPersonByName(name) })
})

app.post('/add', (req, res) => {
	const { name, phoneNumber } = req.body
	if (!name) {
		renderError(res, { message: "invalid name" })
		return
	}
	if (!phoneNumber || !checkPhoneNumber(phoneNumber)) {
		renderError(res, { message: "invalid phone number" })
		return
	}
	if (getPersonByName(name)) {
		renderError(res, { message: "such name already exists" })
		return
	}
	phonebookData.push({ name, phoneNumber })
	res.redirect('/')
})

app.post('/update', (req, res) => {
	const { name, phoneNumber } = req.body
	if (!name) {
		renderError(res, { message: "invalid name" })
		return
	}
	if (!phoneNumber || !checkPhoneNumber(phoneNumber)) {
		renderError(res, { message: "invalid phone number" })
		return
	}
	if (!getPersonByName(name)) {
		renderError(res, { message: "no such record" })
		return
	}
	getPersonByName(name).phoneNumber = phoneNumber
	res.redirect('/')
})

app.post('/delete', (req, res) => {
	const name = req.query.name
	if (!name) {
		renderError(res, { message: "invalid name" })
		return	
	}
	const person = getPersonByName(name)
	if (!person) {
		renderError(res, { message: "no such name" })
		return
	}
	phonebookData.splice(phonebookData.findIndex(obj => obj.name === name), 1)
	res.redirect('/')
})

app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`)
})