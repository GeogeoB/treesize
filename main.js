const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require("body-parser");
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { setTimeout } = require('timers');
const { isPromise } = require('util/types');
const io = new Server(server);
const multer = require('multer');
const upload = multer();

//manipulation des fichiers 
const fs = require('fs');

const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized:true,
  cookie: { maxAge: oneDay },
  resave: false 
});

app.set('view engine', 'ejs');
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true })); 

app.use(upload.array()); 

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }))

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

app.get('/', (req, res) => {
    if (req.session.username) {
      console.log(req.session.projets);
      bdd_users = fs.readFileSync(__dirname + "/bdd/users/" + req.session.username, 'utf8').split('\n');
      projets = bdd_users.slice(1,bdd_users.length);
      
      copie = [] 
      projets.forEach(element => {
        copie.push(element.replace("\r",""));
      });
      projets = copie;
      console.log(projets);

      res.render("hub",{username : req.session.username, projets : projets});
    }
    else {
        res.render("log",{erreur : ""});
    }
});


app.get('/SignUp', (req,res) => {
  res.render('sign_up',{erreur : ''});
});

app.get('/logiciel', (req,res) => {
  id = req.query.id;
  dir = __dirname + '/bdd/trees';
  var bdd_projet = fs.readdirSync(dir);

  if(req.session.username && bdd_projet.includes(id)) {
    bdd_users = fs.readFileSync(__dirname + "/bdd/users/" + req.session.username, 'utf8').split('\n');
    projets = bdd_users.slice(1,bdd_users.length);
    id_projets_users_allowed = [];
    dico_nom = new Map();
    projets.forEach(element => {
      id_element = element.split("|")[0];
      nom = element.split("|")[1];
      dico_nom.set(id_element,nom);
      id_projets_users_allowed.push(id_element)
    });

    if (id_projets_users_allowed.includes(id)) {
      res.render('logiciel', {id : id, username : req.session.username, name_projet : dico_nom.get(id)});
    }
  }
  else {
    res.redirect("/");
  }
  
});

app.post('/', (req, res) => {
    dir = __dirname + '/bdd/users';
    var files = fs.readdirSync(dir);
    username = req.body.username;
    mdp = req.body.password;
    req.session.username = username;

    if (files.includes(username)) {
      bdd_users = fs.readFileSync(__dirname + "/bdd/users/" + req.session.username, 'utf8').split('\n');
      mdp = bdd_users[0]; //Le MDP
      projets = bdd_users.slice(1,bdd_users.length);

      if (mdp == mdp) {
        res.redirect("/");
      }
      else {
        res.render("log",{erreur : "mdp faux"});
      }
    }
    else {
      res.render("log",{erreur : "Pseudo non existant"});
    };
});

app.get('/disconnect', (req,res) => {
  req.session.destroy();
  res.redirect('/');
});

app.post('/SignUp', (req, res) => {
  dir = __dirname + '/bdd/users';
  var files = fs.readdirSync(dir);
  username = req.body.username;
  req.session.username = username;
  mdp1 = req.body.password[0];
  mdp2 = req.body.password[1];

  if (mdp1 != mdp2) {
    console.log(mdp1);
    console.log(mdp2);
    res.render('sign_up',{erreur : "Les mots de passe doivent être pareil"});
  }
  else if (files.includes(username)) {
    res.render('sign_up',{erreur : "Username déjà existant"});
  }
  else {
    fs.appendFile(__dirname + '/bdd/users/' + req.session.username,mdp1, function (err) {
      if (err) throw err;
      req.session.username = username;
      res.redirect("/");
   });
  };
});

app.post('/New_project', (req,res) => {
  id = Math.random().toString(36).slice(-8);
  fs.appendFile(__dirname + '/bdd/trees/' + id, req.body.name + '\n' + req.session.username, function (err) {
    if (err) throw err;
    console.log(req.session.username);
    fs.appendFile(__dirname + '/bdd/users/' + req.session.username,"\n" + id + "| " + req.body.name + ";", function (err) {
      if (err) throw err;
      res.redirect("/");
   });
 });
})

io.on('connection', (socket) => {
  console.log("qqn c'est connecté au site");

  socket.on("rejoindre_room", msg => {
    console.log("qqn est co a la nouvelle room", msg.id_room);
    socket.join(msg.id_room);
  });

  socket.on("widget_move", msg => {
    console.log(msg);
    socket.broadcast.to(msg.id_room).emit('widget_move', msg);
  });

  socket.on("Supprimer_widget", msg => {
    socket.broadcast.to(msg.id_room).emit('Supprimer_widget', msg);
  });

  socket.on("Creer_widget", msg => {
    socket.broadcast.to(msg.id_room).emit('Creer_widget', msg);
  });
}); 

server.listen(3000, () => {
    console.log('listening on *:3000');
  });