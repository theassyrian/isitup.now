var express       = require('express');
var bodyParser    = require('body-parser');
var fs            = require('fs');
var cookieSession = require('cookie-session')
var isUp          = require('is-up');
var validator     = require('validator');
var sanitizer     = require('express-sanitizer');
var helmet        = require('helmet');
var dotenv        = require('dotenv')
var app           = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static(__dirname));
app.use(express.static("public"));

app.disable('x-powered-by')
app.use(sanitizer())
app.use(helmet());
dotenv.load();
app.use(cookieSession({
    secret: process.env.SECRET,
    cookie: {
        maxAge:60000,
        httpOnly: true,
        secure: true
    }
}));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/check', function(req, res, next) {
    site = validator.escape(req.sanitize(req.body.url).replace('https://', '').replace('http://', ''));

    if (!validator.isURL(site)) {
        status = 'doesn\'t seem to be a valid url.'

        fs.readFile(__dirname + '/status.html', function(err, data) {
            if (err) {
                throw err;
            }

            var html = data.toString();
            var html = html.replace(/{{SITE_LINK}}/g, site);
            var html = html.replace(/{{SITE}}/g, site);
            var html = html.replace(/{{STATUS}}/g, status);

            return res.send(html);
        });
    } else {
        isUp(site).then(up => {
            if (up == true) {
                status = 'is up!';
            } else {
                status = 'seems to be down!';
            }
    
            fs.readFile(__dirname + '/status.html', function(err, data) {
                if (err) {
                    throw err;
                }
    
                var html = data.toString();
                var site_link = 'http://' + site;
                var html = html.replace(/{{SITE_LINK}}/g, site_link);
                var html = html.replace(/{{SITE}}/g, site);
                var html = html.replace(/{{STATUS}}/g, status);
    
                res.send(html);
            });
        }).catch(next);
    }
});

app.use(function (err, req, res, next) {
    console.log(err)
    res.status(500).send('Something broke!')
});

const port = process.env.PORT || 3000;
app.listen(port);