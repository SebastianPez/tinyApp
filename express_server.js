const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

function generateRandomString() {
  let randomStr = "";
  const possibleChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOQRSTUVWXYZ0123456789";

  for (let i = 0; i < 6; i ++) {
    randomStr += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
  }
  return randomStr;
}

function emailCheck(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return users[user];
    }
    else {
    return false;
    }
  }
}


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {

  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },

 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}
let auth = function (req, res, next) {
  let user = null;
  if (req.cookies.user_id && users[req.cookies.user_id]) {
    user = users[req.cookies.user_id];
  }
  req.userAuth = user;
  next();
}

app.get("/login", auth, (req, res) => {
  let templateVars = {urls: urlDatabase, username: req.userAuth};
  res.render('urls_login', templateVars);
})

app.get("/register", auth, (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.userAuth};
  res.render("urls_register", templateVars);
})

app.post("/register", (req, res) => {
  const { email, password} = req.body;
  if (email.length === 0 || password.length === 0 || emailCheck(email)) {
    res.sendStatus(400);
  } else {
    user_id = generateRandomString();
    users[user_id] = {
      id: user_id, 
      email: email, 
      password: password
    };
    res.cookie("user_id", user_id);
    res.redirect(`/urls`);
  }
})

app.post("/login", (req, res) => {
  const user = emailCheck(req.body.email)
  if (user === false) {
    res.sendStatus(403);
  } else if (req.body.password !== user.password) {
    res.sendStatus(403);
  } else {
    res.cookie("user_id", user.id);
    res.redirect(`/urls`);
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
})

app.get("/urls", auth, (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.userAuth};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", auth, (req, res) => {
  let templateVars = {
    username: req.userAuth 
  }
  res.render("urls_new", templateVars);
})

app.post("/urls/:id", (req, res) => {
  // let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.userAuth};
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
})

app.get("/urls/:shortURL", auth, (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.userAuth};
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});