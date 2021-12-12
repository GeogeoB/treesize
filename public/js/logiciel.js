var socket = io();

fenetre = document.getElementById("fenetre");
widget = [...document.getElementsByClassName("widget")];
traits = [...document.getElementsByClassName("trait")];
menu_widget = document.getElementById("menu-widget");
fenetre_widget = document.getElementById("fenetre_widget");
fenetre_trait = document.getElementById("svg_trait");
container_change_widget = document.getElementById("container-change-widget");

widget_selection_id = [];
let Move_bg = false;
let Move_widget = false;
let On_Widget = false;
let change_widget = false;
let deplacement_svg = 5000;

function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace( 
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;	
	}
	return vars;
}


id_room = $_GET('id');
socket.emit("rejoindre_room", {id_room : id_room});

socket.on("widget_move", msg => {
    movementX = msg.movementX;
    movementY = msg.movementY;

    console.log(msg.id);

    move_widgets([msg.id],movementX,movementY,false)

});

socket.on("Supprimer_widget", msg => {
    Supprimer_widget(msg.widget_selection_id,false);
});

socket.on("Creer_widget", msg => {
    console.log("oui");
    Creer_widget(msg.pos_x_,msg.pos_y_,msg.id,false);
});

function CreerTrait(widget) {
    vise = widget.getAttribute("vise");
    if (vise != null) {
        vise = vise.split("|");

        x1 = window.getComputedStyle(widget,null).getPropertyValue('left').trim().split(/\s+/);
        y1 = window.getComputedStyle(widget,null).getPropertyValue('bottom').trim().split(/\s+/);
        

        vise.forEach(element => {
            widget_vise = document.getElementById(element);
            console.log(widget_vise);
            x2 = window.getComputedStyle(widget_vise,null).getPropertyValue('left').trim().split(/\s+/);
            y2 = window.getComputedStyle(widget_vise,null).getPropertyValue('bottom').trim().split(/\s+/);

            A = '<line class="trait" x1="' + String(parseInt(x1) + 50 + deplacement_svg) +'" y1="' + String(-50 + window.innerHeight - parseInt(y1)  + deplacement_svg) + '" x2="' + String(parseInt(x2) + 50  + deplacement_svg) + '" y2="' + String(-50 + window.innerHeight - parseInt(y2)  + deplacement_svg) + '" stroke-width="1" stroke="black" type="horizontal" widget1="' + widget.getAttribute("id") +'" widget2="' + element +'"/>'
            fenetre_trait.innerHTML += A;

            traits = [...document.getElementsByClassName("trait")];
        });
    }
}

function setup_Listener(element) {
    element.addEventListener('mouseover', event => {
        On_Widget = true;
        bottom = window.getComputedStyle(element,null).getPropertyValue('bottom').trim().split(/\s+/);
        left = window.getComputedStyle(element,null).getPropertyValue('left').trim().split(/\s+/);

        bottom_fenetre = window.getComputedStyle(fenetre_widget,null).getPropertyValue('bottom').trim().split(/\s+/);
        left_fenetre = window.getComputedStyle(fenetre_widget,null).getPropertyValue('left').trim().split(/\s+/);

        menu_widget.style.bottom = String(+parseInt(bottom_fenetre) + parseInt(bottom) - 49) + "px";
        menu_widget.style.left = String(+parseInt(left_fenetre) + parseInt(left) - 50) + "px";
        //menu_widget.style.display = "flex";
    })

    element.addEventListener('mouseleave', event => {
        On_Widget = false;
        menu_widget.style.display = "none";
    });

    element.addEventListener('mousedown', event => {
        console.log(widget_selection_id);
        if (!event.shiftKey) {
            //Ajouter la multi selection un jour
            widget_selection_id.forEach(id => {
                element_ = document.getElementById(id);
                element_.style.outline = "none";
                element_.style.backgroundColor  = "white";
            });

            widget_selection_id = [];
        }

        element.style.zIndex = "5";
        element.style.outline = "2px solid #1C6EA4";
        element.style.backgroundColor  = "rgb(240, 249, 255)";
        if (!widget_selection_id.includes(element.getAttribute("id"))) {
            widget_selection_id.push(element.getAttribute("id"));
        };

        console.log(widget_selection_id);
        
        Move_widget = true;
    });

    element.addEventListener('mouseup', event => {
        element.style.zIndex = "0";
        Move_widget = false;
    });

    element.addEventListener('dblclick', event => {
        container_change_widget.style.display = "flex";
        fenetre_trait.style.display = "none";
    })  
}

function move_widgets(widget_selection_id,movementX,movementY,send = true) {
    menu_widget.style.display = "none";
        
        widget_selection_id.forEach(id => {
            element = document.getElementById(id)
            bottom = window.getComputedStyle(element,null).getPropertyValue('bottom').trim().split(/\s+/);
            left = window.getComputedStyle(element,null).getPropertyValue('left').trim().split(/\s+/);

            element.style.bottom = String(parseInt(bottom) - movementY) + "px";
            element.style.left = String(parseInt(left) + movementX) + "px";

            traits.forEach(trait => {
                if (trait.getAttribute("widget1") == element.getAttribute("id")) {
                    trait.setAttribute("x1",String(parseInt(left) + 50 +deplacement_svg));
                    trait.setAttribute("y1",String(-50 + window.innerHeight - parseInt(bottom)  + deplacement_svg));
                }

                if (trait.getAttribute("widget2") == element.getAttribute("id")) {
                    trait.setAttribute("x2",String(parseInt(left) + 50  + deplacement_svg));
                    trait.setAttribute("y2",String(-50 + window.innerHeight - parseInt(bottom) + deplacement_svg));
                }
            });

            if (send) {
                socket.emit('widget_move', {id_room : id_room, movementX : movementX, movementY : movementY, id : id});
            }
        });
}

function Creer_widget(pos_x_,pos_y_,id,send=true) {
    var div = document.createElement("div",);
    div.className = "widget";

    bottom = window.getComputedStyle(fenetre_widget,null).getPropertyValue('bottom').trim().split(/\s+/);
    left = window.getComputedStyle(fenetre_widget,null).getPropertyValue('left').trim().split(/\s+/);

    div.style.left = String(pos_x_ - parseInt(left)) + "px";
    div.style.bottom = String(window.innerHeight - 120 - pos_y_ - parseInt(bottom)) + "px";
    
    div.innerHTML = '<p class="titre_widget">Nouveau Titre</p><p class="description_widget">Ajouter une description</p>';
    div.setAttribute("id",id);

    widget.push(div);
    setup_Listener(div);

    fenetre_widget.appendChild(div);

    if (send) {
        socket.emit("Creer_widget",{id_room : id_room,pos_x_ : pos_x_, pos_y_ : pos_y_, id : id})
    }
}

function Supprimer_widget(widget_selection_id_,send = true) {
    widget_selection_id_.forEach(id => {
        element = document.getElementById(id);

        traits.filter(element => element.getAttribute("widget1") == id || element.getAttribute("widget2") == id).forEach(elt => {
            if(elt != null) {
                fenetre_trait.removeChild(elt);
            }
            traits = traits.filter(elt_ => elt_ != elt);
        });
        fenetre_widget.removeChild(element);
    });

    if (send) {
        socket.emit("Supprimer_widget",{id_room : id_room,widget_selection_id : widget_selection_id_});
    }
    widget_selection_id = [];
    On_Widget = false;
}

container_change_widget.addEventListener('keydown', event => {
    console.log(event);
    if(event.key == "Escape") {
        container_change_widget.style.display = "none";
        fenetre_trait.style.display = "inherit";
    }
})

widget.forEach(element => {
    setup_Listener(element);
    CreerTrait(element);
});

fenetre.addEventListener('mousedown', event => {
    if(event.button == 1) { //Si bouton centrale de la souris
        Move_bg = true;
    }
  });

fenetre.addEventListener('mouseup', event => {
    if(event.button == 1) { //Si bouton centrale de la souris
        Move_bg = false;
    }
    Move_widget = false;
  }); 

fenetre.addEventListener('click', event => {
    if (!On_Widget) {
        widget_selection_id.forEach(id => {
            element = document.getElementById(id)
            element.style.outline = "none";
            element.style.backgroundColor  = "white";
        });
    }
})

fenetre.addEventListener('dblclick', event => {
    if (!On_Widget) {
        pos_x = event.clientX;
        pos_y = event.clientY;
        id = Math.random().toString(36).slice(-8);
        
        Creer_widget(pos_x,pos_y,id)
        
    }
});

document.addEventListener('keydown', event => {
    if(event.code == 'Delete') {
        Supprimer_widget(widget_selection_id); //attention pas de param mais depend de widget_selection_id
    }
})

fenetre.addEventListener('mousemove', event => {

    if (Move_widget) {
        movementX = event.movementX;
        movementY = event.movementY;

        move_widgets(widget_selection_id,movementX,movementY)
    };

    if(Move_bg && !On_Widget) {
        positions = window.getComputedStyle(fenetre,null).backgroundPosition.trim().split(/\s+/);
        fenetre.style.cursor = "grabbing";
        x = positions[2].slice(0,-2);
        y = positions[1].slice(0,-2);
        
        fenetre.style.backgroundPosition = "0px " + String(parseInt(y) + event.movementY) +"px," + String(parseInt(x) + event.movementX) + "px 0px";

        bottom = window.getComputedStyle(fenetre_widget,null).getPropertyValue('bottom').trim().split(/\s+/);
        left = window.getComputedStyle(fenetre_widget,null).getPropertyValue('left').trim().split(/\s+/);

        fenetre_widget.style.bottom = String(parseInt(bottom) - event.movementY) + "px";
        fenetre_widget.style.left = String(parseInt(left) + event.movementX) + "px";

        /*bottom = window.getComputedStyle(fenetre_trait,null).getPropertyValue('bottom').trim().split(/\s+/);
        left = window.getComputedStyle(fenetre_trait,null).getPropertyValue('left').trim().split(/\s+/);

        fenetre_trait.style.bottom = String(parseInt(bottom) - event.movementY) + "px";
        fenetre_trait.style.left = String(parseInt(left) + event.movementX) + "px";*/
        
    }
    else {
        fenetre.style.cursor = "inherit";
    }
});