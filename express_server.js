const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');

function generateRandomString() {
  let randomStr = "";
  const possibleChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOQRSTUVWXYZ0123456789";

  for (let i = 0; i < 6; i ++) {
    randomStr += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
  }
  return randomStr;
}

function emailCheck(email) {
  for(let user in users) {
      if (email === users[user].email) {
        return users[user];
      }
  }
  return false;
}

function urlsForUser(id) {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    if (id === urlDatabase[shortUrl].user_id) {
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  // console.log(userUrls);
  return userUrls;
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["test"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    user_id: 'testID',
    shortURL: 'b2xVn2'
  },
  "9sm5xK": { longURL: "http://www.google.com"}
}

var users = {

  "testID": {
    id: "testID",
    email: "test@test.com",
    password: "test"
  },

  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "pass"
  },

 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}
// let auth = function (req, res, next) {
//   let user = null;
//   if (req.session.user_id) {
//     user = req.session.user_id;
//   }
//   users[req.session.user_id] = user;
//   next();
// }

app.get("/login",  (req, res) => {
  let templateVars;
  if (req.session.user_id) {
    templateVars = {urls: urlDatabase, username: users[req.session.user_id]};
  } else {
    templateVars = { urls: urlDatabase, username: null};
  }
  res.render('urls_login', templateVars);
})

app.get("/register",  (req, res) => {
  let templateVars;
  if(req.session.user_id){
    templateVars = { urls: urlDatabase, username: users[req.session.user_id]};
  } else {
    templateVars = { urls: urlDatabase, username: null};
  }
  res.render("urls_register", templateVars);
})

app.post("/register", (req, res) => {
  const { email, password} = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email.length === 0 || password.length === 0 || emailCheck(email)) {
    res.sendStatus(400);
  } else {
    user_id = generateRandomString();
    users[user_id] = {
      id: user_id, 
      email: email, 
      password: hashedPassword
    };
    req.session.user_id = user_id;
    res.redirect(`/urls`);
  }
})

app.post("/login", (req, res) => {
  const user = emailCheck(req.body.email)
  if (user === false) {
    res.sendStatus(403);
  } else if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect(`/urls`);
  } else {
    res.sendStatus(403);
  }
})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
})

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { 
    longURL: req.body.longURL,
    shortURL: shortURL,
    user_id: req.session.user_id
  }
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].user_id) {
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
  } else {
    res.redirect(`/login`);
  }
})

app.get("/urls",  (req, res) => {
  let templateVars;
  if (req.session.user_id) {
     templateVars = { urls: urlsForUser(req.session.user_id), username: users[req.session.user_id]};
    res.render("urls_index", templateVars);
  } else {
    templateVars = { urls: urlDatabase, username: null};
    res.send('You need to login before seeing shortened URLs');
  }
});

app.get("/urls/new",  (req, res) => {
  let templateVars;
  let user_id = req.session.user_id;
  if (user_id) {
     templateVars = {
      username: users[req.session.user_id]
    }
    res.render("urls_new", templateVars);
    } else {
      templateVars = { urls: urlDatabase, username: null};
      res.redirect('/login');
  }
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = {
    shortURL: req.params.id,
    longURL: req.body.longURL,
    user_id: req.session.user_id
  }
  res.redirect('/urls');
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars;
  if (users[req.session.user_id]) {
    let potentialUrl = urlDatabase[req.params.shortURL];
    if (req.session.user_id === potentialUrl.user_id) {
      templateVars = { url: potentialUrl, username: users[req.session.user_id]};
      res.render("urls_show", templateVars);
    } else {
      res.send("<p>This TinyURL doesn't belong to you</p>");
    }
  } else {
    templateVars = { urls: urlDatabase, username: null};
    res.send('You need to login before seeing shortened URLs');
  }
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});