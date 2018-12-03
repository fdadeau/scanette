/***
 *  Simulateur d'utilisation de scanette
 */
(function() {
    
    document.addEventListener("DOMContentLoaded", init, true);


    function init(_ev) {
        
        var pg = document.getElementById("playground");
        window.scrollTo(0, pg.offsetHeight);
                

        var currentSelection = null;
        
        
        
        /**************************************************
         ***                                            ***
         ***                SCANETTES                   ***
         ***                                            ***
         **************************************************/
        
        var scanettes = [new ScanetteIHM(0), new ScanetteIHM(1), new ScanetteIHM(2), new ScanetteIHM(3)];   
        for (var i=0; i < scanettes.length; i++) {
            var icScanette = document.createElement("div");
            icScanette.className = "icScanette";
            icScanette.id = "icScanette" + i;
            icScanette.dataset.index = i;
            icScanette.addEventListener("click", function(e) {
                e.stopImmediatePropagation();
                if (!this.classList.contains("prise")) {
                    this.classList.add("prise");
                    var sc = scanettes[this.dataset.index];
                    var cli = new Client(sc);
                    clients.push(cli);
                    sc.prendre(cli);
                    /** Initial data */
                    cli.ajouter(8718309259938);
                    sc.current.scanner(8718309259938);
                    cli.ajouter(3520115810259);
                    cli.ajouter(3520115810259);
                    sc.current.scanner(3520115810259);
                    sc.current.scanner(3520115810259);
                    //
                    cli.selectionner();
                    // sc.transferer(caisses[3].caisse);
                }
            }, false);
            pg.appendChild(icScanette);
        }
        
        
        function ScanetteIHM(idx) {
            
            this.ecran = document.querySelector("#bcScanette #bcEcran");
            
            this.current = new Scanette(new ArticleDB(false));
            
            this.holder = null;
            
            this.index = idx;
            
            this.afficher = function() {
                switch (this.etat) {
                    case 0: 
                        switch (this.current.getState()) {
                            case 0:     // bloquee 
                                this.ecran.innerHTML = "<p class='centre' style='text-align: center;'>En attente...</p>";   
                                return;
                            case 1:     // en courses
                                var htmlPanier = "";
                                var articlesInScanette = this.current.getArticles();
                                var nb = 0, tot = 0;
                                for (var i=0; i < articlesInScanette.length; i++) {
                                    var art = articlesInScanette[i];
                                    var qte = this.current.quantite(art.ean);
                                    var lib = art.libelle;
                                    if (lib.length > 10) {
                                        lib = lib.substr(0, 10).trim() + "...";   
                                    }
                                    nb += qte;
                                    tot += qte * art.prix;
                                    htmlPanier += "<p><span class='prix'>" + art.prix + "</span><span class='quantite'>" + qte + "</span>" + lib + "</p>";    
                                }
                                tot = tot.toFixed(2);
                                this.ecran.innerHTML = "<h3>Votre panier</h3><div class='panier'>" + htmlPanier + "</div><div class='btnGauche'>Retirer</div><div class='total'>" + tot + " &euro;<br>" + nb + " article" + (nb > 1 ? "s" : "") + "</div>";
                                return;
                            case 2:     // relecture
                                this.ecran.innerHTML = "<h3>Relecture du panier</h3>" + 
                                    "<p class='centre'>Veuillez scanner encore " + this.current.getARelire() + " article(s)</p>";
                                return;
                            case 3:     // relecture OK 
                                this.ecran.innerHTML = "<h3>Relecture du panier</h3>" + 
                                    "<p class='centre'>Relecture terminée avec succès. <br><br>Scannez la caisse pour terminer. </p>";
                                return;
                            case 4:     // relecture KO
                                this.ecran.innerHTML = "<h3>Relecture du panier</h3>" + 
                                    "<p class='centre'>Echec de relecture. </p><div class='btnDroit'>Terminer</div>";
                                return;
                        }
                            break;
                    case 1: 
                        if (this.current.getState() == 1) {
                            this.ecran.innerHTML = "<div class='centre'>Scannez le code barre de l'article à ajouter.</div>"
                                + "<div class='btnDroit'>Annuler</div>";
                        }
                        else {
                            this.ecran.innerHTML = "<div class='centre'>Scannez le code barre de l'article à vérifier.</div>"
                                + "<div class='btnDroit'>Annuler</div>";
                        }
                        break;
                    case 2: 
                        this.ecran.innerHTML = "<div class='centre'>Scannez le code barre de l'article à supprimer.</div><div class='btnDroit'>Annuler</div>";
                        break;
                    case 3: 
                        this.ecran.innerHTML = "<div class='centre'>Article non reconnu.</div><div class='btnGauche'>OK</div>";
                        break;
                    case 4: 
                        this.ecran.innerHTML = "<div class='centre'>L'article n'est pas présent dans votre panier.</div><div class='btnGauche'>OK</div>";
                        break;
                    case 5: 
                        this.ecran.innerHTML = "<div class='centre'>Transmission à la caisse</div>";
                        break;
                    case 6: 
                        this.ecran.innerHTML = "<div class='centre'>Caisse indisponible</div><div class='btnGauche'>OK</div>";
                        break;
                }
            };
            
            this.etat = 0;
            
            this.jaune = function() {
                if (this.etat == 0 && (this.current.getState() >= 1 && this.current.getState() <= 3)) {
                    document.getElementById("playground").classList.add("canScan");
                    this.etat = 1;
                    this.afficher();
                }
            };
            this.optDroite = function() {
                if (this.etat == 1 || this.etat == 2) {
                    this.etat = 0;
                    document.getElementById("playground").classList.remove("canScan");
                    this.afficher();
                }
                else if (this.etat == 0 && this.current.getState() == 4) {
                    this.holder.terminer();
                }
            };
            this.optGauche = function() {
                if (this.etat == 0) {
                    this.etat = 2;
                    document.getElementById("playground").classList.add("canScan");
                    this.afficher();
                }
                else if (this.etat == 3 || this.etat == 4 || this.etat == 6) {
                    this.etat = 0;
                    this.afficher();
                }
            };
            this.scrollDown = function() {
                if (this.etat != 0) {
                    return;   
                }
                this.ecran.querySelector(".panier").scrollTop += 10;
            };
            this.scrollUp = function() {
                if (this.etat != 0) {
                    return;   
                }
                this.ecran.querySelector(".panier").scrollTop -= 10; 
            };
            this.scan = function(ean) {
                if (this.etat == 1) {
                    var r = this.current.scanner(ean);
                    if (r == -2) {
                        this.etat = 3;
                    }
                    else {
                        this.etat = 0;   
                    }
                    document.getElementById("playground").classList.remove("canScan");
                    this.afficher();
                    return;
                }
                if (this.etat == 2) {
                    var r = this.current.supprimer(ean);
                    if (r == -2) {
                        this.etat = 4;   
                    }
                    else {
                        this.etat = 0;   
                    }
                    document.getElementById("playground").classList.remove("canScan");
                    this.afficher();
                    return;
                }
            };        
            this.transferer = function(c) {
                this.etat = 5;
                this.afficher();
                document.getElementById("bcMoniteur").innerHTML = "<p class='centre progressBar'>Réception des informations de la scanette.</p>";
                setTimeout(function(ca) {
                    var r = this.current.transmission(ca.caisse);
                    this.etat = 0;
                    this.afficher();
                    if (r == 0) {
                        if (this.holder instanceof Caissier) {
                            ca.client = this.holder.takesCareOf;
                            this.holder.takesCareOf = null;
                        }
                        else {
                            ca.client = this.holder;
                        }
                        this.reposer();
                        ca.afficher();
                    }
                    else if (r == 1) {
                        // passe la scanette au caissier
                        var old_holder = this.holder;
                        this.holder.scanette = null;
                        this.holder = caissiers[ca.index];
                        this.holder.scanette = this;
                        this.holder.takesCareOf = old_holder;
                        montrerCaisse(false);
                        // this.holder.selectionner();
                    }
                    else { // r == -1
                        this.etat = 6;
                        this.afficher();
                    }
                }.bind(this, c), 2000);
            };
            this.prendre = function(cli) {
                this.holder = cli;
                this.current.debloquer();
                this.afficher();
            };
            this.reposer = function() {
                this.current.abandon();
                this.holder.scanette = null;
                this.holder = null;
                document.getElementById("playground").classList.remove("withScanette");
                document.getElementById("icScanette" + this.index).classList.remove("prise");
            };
        }
        document.querySelector("#bcScanette #btnBas").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            currentSelection.scanette.scrollDown();
        }, true);
        document.querySelector("#bcScanette #btnHaut").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            currentSelection.scanette.scrollUp();
        }, true);
        document.querySelector("#bcScanette #btnJaune").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            currentSelection.scanette.jaune();
        }, true);
        document.querySelector("#bcScanette #btnOptGauche").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            currentSelection.scanette.optGauche();
        }, true);
        document.querySelector("#bcScanette #btnOptDroit").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            currentSelection.scanette.optDroite();
        }, true);
 
        
        
        /***************************
        ****                    ****
        ****       RAYONS       ****
        ****                    ****
        ****************************/   
        
        var rayons = [
            { libelle: "Fournitures de bureau", x: 75.5, y: 50.2, w: 13.5, h: 9 },
            { libelle: "Petit déjeuner", x: 21.4, y: 16, w: 4, h: 26.5 },
            { libelle: "Plats cuisinés", x: 32.2, y: 16, w: 4, h: 26.5 },
            { libelle: "Gâteaux", x: 10.5, y: 16, w: 4, h: 26.5 },
            { libelle: "Produits d'entretien", x: 53.5, y: 16, w: 8, h: 10.5 },
            { libelle: "Hygiène", x: 43.2, y: 47, w: 4, h: 19.5 },
            { libelle: "Produits régionaux", x: 43.2, y: 16, w: 4, h: 26.5 },
            { libelle: "Jeux vidéo", x: 62.4, y: 30.5, w: 22.5, h: 9.5 },
            { libelle: "Fruits", x: 66.6, y: 13.5, w: 7, h: 8.5 },
            { libelle: "Légumes", x: 82, y: 13.5, w: 5.5, h: 8.5 },
            { libelle: "Condiments", x: 32.2, y: 47, w: 4, h: 19.5 },
            { libelle: "Rayon frais", x: 21.4, y: 47, w: 4, h: 19.5 },
            { libelle: "Confiserie", x: 53.8, y: 45, w: 14.2, h: 10.5 },
            { libelle: "Jus de fruits", x: 10.5, y: 47, w: 4, h: 19.5 },
            { libelle: "Sodas", x: 73.5, y: 69.5, w: 14.5, h: 9 }
        ];
        var allArticles = new ArticleDB(true);

        for (var i=0; i < rayons.length; i++) {
            var divRayon = document.createElement("div");
            divRayon.className = "rayon";
            divRayon.id = "rayon" + i;
            divRayon.style.top = rayons[i].y + "%";
            divRayon.style.left = rayons[i].x + "%";
            divRayon.style.width = rayons[i].w + "%";
            divRayon.style.height = rayons[i].h + "%";
            divRayon.dataset.index = i;

            divRayon.addEventListener("click", function(e) {
                var i = this.dataset.index;
                if (currentSelection != null && currentSelection instanceof Client) {
                    // calcul du point de chute
                    var x = e.clientX + window.scrollX;
                    var y = e.clientY + window.scrollY;
                    if (rayons[i].x < 50) {
                        x = (rayons[i].x - 1) * pg.offsetWidth / 100 | 0;
                    }
                    else {
                        y = (rayons[i].y + rayons[i].h + 2) * pg.offsetHeight / 100 | 0; 
                    }
                    currentSelection.deplacerVers(x, y, afficherRayon.bind(null, i));
                }
                else {
                    afficherRayon(i);   
                }
            }, true);
            pg.appendChild(divRayon);
        }
        
        
        document.getElementById("bcRayon").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            if (e.target.classList.contains("ajouter")) {
                if (currentSelection.ajouter) {
                    currentSelection.ajouter(e.target.dataset.ean);
                }
                return;
            }
            if (e.target.classList.contains("codeBarre") && document.getElementById("playground").classList.contains("canScan")) {
                document.getElementById("playground").classList.remove("canScan");
                currentSelection.scanette.scan(e.target.dataset.ean);   
                return;
            }
        }, true);
        
        document.getElementById("bcCaddie").addEventListener("click", function(e) {
            e.stopImmediatePropagation();
            if (e.target.classList.contains("supprimer")) {
                if (currentSelection.supprimer) {
                    currentSelection.supprimer(e.target.dataset.index);
                }
                return;
            }
            if (e.target.classList.contains("codeBarre") && document.getElementById("playground").classList.contains("canScan")) {
                document.getElementById("playground").classList.remove("canScan");
                currentSelection.scanette.scan(e.target.dataset.ean);                
                return;
            }
        }, true);
        
        
        
        /****************************
        ****                     ****
        ****       CLIENTS       ****
        ****                     ****
        *****************************/   
        
        var clients = [];
        var nbCli = 0;
        function Client(scan) {
            
            var caddie = [];
            
            var divSprite;
                        
            this.scanette = scan;
            
            this.fini = false;
            
            this.articles = new ArticleDB(true);
            
            this.afficher = function() {
                var bcCaddie = document.querySelector("#bcCaddie .contenu");
                var inHTML = "";
                if (caddie.length == 0) {
                    inHTML = "<p>Aucun article dans le caddie</p>";          
                }
                else {
                    for (var i=0; i < caddie.length; i++) {
                        var ean = caddie[i].ean;
                        inHTML += 
                            "<div class='article' style='background-image: url(./images/produits/" + ean + ".jpg'>"
                                + "<img src='./images/codes/" + ean + ".gif' data-ean='" + ean + "' class='codeBarre'>"
                                + "<div class='supprimer' data-index='" + i + "'></div>"
                            + "</div>";
                    }
                }
                bcCaddie.innerHTML = inHTML;
                document.getElementById("icPastille").innerHTML = caddie.length;
            };
            
            this.selectionner = function() {
                if (this.fini) {
                    return;
                }
                if (currentSelection != null) {
                    currentSelection.deselectionner();   
                }
                divSprite.classList.add("selected");
                pg.classList.add("selected");
                if (this.scanette != null) {
                    pg.classList.add("withScanette");
                    this.scanette.afficher();
                }
                this.afficher();
                currentSelection = this;
            }
            
            this.deselectionner = function() {
                fermerToutesFenetres();
                nettoyerPlayground();
                divSprite.classList.remove("selected");
                currentSelection = null;
            }
            
            var divSprite = document.createElement("div");
            divSprite.id = "client" + (nbCli++);
            divSprite.className = "client sprite client" + (Math.random() * 7 | 0) + " animation arretB";
            divSprite.addEventListener("click", function(e) {
                this.selectionner();
            }.bind(this), false);
            document.getElementById("playground").appendChild(divSprite);
            
            
            var etat = "arretB";   // "arret[HBDG]" ou "marcheHBDG"
            var x = pg.offsetWidth * 65 / 100 | 0, y = pg.offsetHeight * 88 / 100 | 0;
            divSprite.style.top = y + "px";
            divSprite.style.left = x + "px";
            var dest = {x: null, y: null, vecX: null, vecY: null, speed: null, contourne: false, delta: null, to: null, after: null };        
            var depl = 4;
            
            
            this.deplacerVers = function(newX, newY, after) {
                // annule le deplcement précedent
                clearTimeout(dest.to);    
                dest.x = newX;
                dest.y = newY;
                dest.speed = depl;
                // calcul du vecteur de déplacement
                var norme = Math.sqrt(distance(dest.x, dest.y, x, y)); 
                dest.vecX = (dest.x - x) / norme;
                dest.vecY = (dest.y - y) / norme;
                dest.delta = depl;
                dest.after = after;
                this.setAnimation();
                // lance la récursion
                this.update();
            }
            
            this.update = function() {
                // arrivé
                if (distance(dest.x, dest.y, x, y) < dest.delta) {
                    dest.x = dest.y = null;
                    this.setAnimation();
                    if (dest.after) {
                        dest.after();
                    }
                    return;
                }
                // contourne --> test s'il est possible de reprendre un chemin normal
                if (dest.contourne) {
                    var norme = Math.sqrt(distance(dest.x, dest.y, x, y)); 
                    var vecX = (dest.x - x) / norme;
                    var vecY = (dest.y - y) / norme;   
                    if (zonesOK.inZone(x + vecX * dest.speed, y + vecY * dest.speed)) {
                        dest.vecX = vecX;
                        dest.vecY = vecY;
                        dest.contourne = false;
                        this.setAnimation();
                    }
                }
                // verification du déplacement et mise en place du contournement 
                if (! zonesOK.inZone(x + dest.vecX * dest.speed, y + dest.vecY * dest.speed)) {
                    // si possibilité d'aller horizontal
                    if (zonesOK.inZone(x + dest.vecX * dest.speed, y)) {
                        dest.vecX = dest.vecX > 0 ? 1 : -1;
                        dest.vecY = 0;
                        dest.contourne = true;
                        this.setAnimation();
                    }
                    // si possibilité d'aller vertical
                    else if (zonesOK.inZone(x, y + dest.vecY * dest.speed)) {
                        dest.vecX = 0;
                        dest.vecY = dest.vecY > 0 ? 1 : -1;
                        dest.contourne = true;
                        this.setAnimation();
                    }
                    // si déjà en train de contourner --> inverse le sens de déplacement
                    else if (dest.contourne) {
                        dest.vecX = -dest.vecX;
                        dest.vecY = -dest.vecY;
                        this.setAnimation();
                    }
                }
                
                x += dest.vecX * dest.speed;
                y += dest.vecY * dest.speed;
                divSprite.style.top = y + "px";
                divSprite.style.left = x + "px";
                
                dest.to = setTimeout(this.update.bind(this), 20);
            };
            
            var distance = function(x1, y1, x2, y2) { return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2); }
            
            
            this.setAnimation = function() {
                divSprite.classList.remove("arretD");   
                divSprite.classList.remove("arretG");   
                divSprite.classList.remove("arretH");   
                divSprite.classList.remove("arretB");
                divSprite.classList.remove("marcheD");   
                divSprite.classList.remove("marcheG");   
                divSprite.classList.remove("marcheH");   
                divSprite.classList.remove("marcheB");
                if (dest.x != null) {
                    if (dest.vecX > 0.5) {
                        divSprite.classList.add("marcheD");
                    }
                    else if (dest.vecX < -0.5) {
                        divSprite.classList.add("marcheG");
                    }
                    else if (dest.vecY > 0.5) {
                        divSprite.classList.add("marcheB");
                    }
                    else {
                        divSprite.classList.add("marcheH");   
                    }
                }
                else {
                    divSprite.classList.add("arretB");   
                }
            }
            
            
            this.ajouter = function(ean) {
                caddie.push(this.articles.getArticle(ean));   
                this.afficher();
            };
            
            this.supprimer = function(i) {
                caddie.splice(i, 1);
                this.afficher();
            };
            
            this.terminer = function() {
                this.fini = true;
                this.deselectionner();
                if (this.scanette != null) {
                    this.scanette.reposer();   
                }
                this.deplacerVers(18 * pg.offsetWidth / 100, pg.offsetHeight * 88.9 / 100, function() {
                    setTimeout(function() {
                        pg.removeChild(divSprite);
                        montrerCaddie(false);                
                        clients.splice(clients.indexOf(this), 1);
                    }.bind(this), 500);
                }.bind(this));
            };
            
        };
        
        
        /***************************
        ****                    ****
        ****       CAISSES      ****
        ****                    ****
        ****************************/   

        // zones
        var caisses = [
            { x: 10.4, y: 71, w: 5.7, h: 12, caisse: new CaisseIHM(0) },
            { x: 20.9, y: 71, w: 5.7, h: 12, caisse: new CaisseIHM(1) },
            { x: 32, y: 71, w: 5.7, h: 12, caisse: new CaisseIHM(2) },
            { x: 43, y: 71, w: 5.7, h: 12, caisse: new CaisseIHM(3) }
        ];
        // traitement des zones
        for (var i=0; i < caisses.length; i++) {
            var divCaisse = document.createElement("div");
            divCaisse.className = "caisse";
            divCaisse.id = "caisse" + i;
            divCaisse.dataset.index = i;
            divCaisse.style.top = caisses[i].y + "%";
            divCaisse.style.left = caisses[i].x + "%";
            divCaisse.style.width = caisses[i].w + "%";
            divCaisse.style.height = caisses[i].h + "%";
            
            divCaisse.addEventListener("click", function(e) {
                var i = this.dataset.index;

                // caissier essaye d'aller sur une autre caisse
                if (currentSelection != null && currentSelection instanceof Caissier && currentSelection.index != i) 
                    return;
                // tentative d'utiliser une caisse déjà prise
                if (caissiers[i].takesCareOf != null) 
                    return;
                // client essaie d'aller sur une caisse déjà utiliée.
                if (currentSelection instanceof Client && caisses[i].caisse.client != null && currentSelection != caisses[i].caisse.client) {
                    return;
                }
                
                if (currentSelection instanceof Client) {
                    var x = (caisses[i].x - 2) * pg.offsetWidth / 100 | 0;
                    var y = (caisses[i].y + caisses[i].h * 0.75) * pg.offsetHeight / 100 | 0;
                    var after = afficherCaisse.bind(null, i);
                    currentSelection.deplacerVers(x, y, after);
                }
                else {
                    afficherCaisse(i);   
                }
                
            }, true);
            pg.appendChild(divCaisse);
        }
        document.getElementById("bcCaisse").addEventListener("click", function(e) {
            if (e.target.classList.contains("codeBarre") && document.getElementById("playground").classList.contains("canScan")) {
                document.getElementById("playground").classList.remove("canScan");
                currentSelection.scanette.transferer(caisses[e.target.dataset.index].caisse);
            }
            if (e.target.classList.contains("fente") && currentSelection instanceof Caissier) {
                var bcCaisse = document.getElementById("bcCaisse");
                if (bcCaisse.classList.contains("session")) {
                    var r = caisses[e.target.dataset.index].caisse.caisse.fermerSession();   
                    if (r == 0) {
                        bcCaisse.classList.remove("session");   
                        caisses[e.target.dataset.index].caisse.afficher();
                    }
                }
                else {
                    var r = caisses[e.target.dataset.index].caisse.caisse.ouvrirSession();   
                    if (r == 0) {
                        bcCaisse.classList.add("session");   
                        caisses[e.target.dataset.index].caisse.afficher();
                    }
                }
            }
        }, true);
        
        // objets de l'IHM
        function CaisseIHM(idx) {
            
            this.caisse = new Caisse(new ArticleDB());
            
            this.index = idx;
            
            this.client = null;
                        
            var moniteur = document.getElementById("bcMoniteur");
            
            this.afficher = function() {
                document.getElementById("bcCaisse").classList.remove("session");
                switch (this.caisse.getState()) {
                    case 0:     // en attente
                        moniteur.innerHTML = "<p class='centre'>Scannez le code barre en bas à droite pour terminer vos achats.</p>";
                        break;
                    case 3:     // session ouverte
                        document.getElementById("bcCaisse").classList.add("session");    
                    case 1:     // paiement
                    case 2:     // attente caissier
                        vider(moniteur);
                        moniteur.classList.remove("en_attente");
                        var gauche = document.createElement("div");
                        gauche.className = "gauche";
                        this.remplirPartieGauche(gauche);
                        moniteur.appendChild(gauche);
                        var droite = document.createElement("div");
                        droite.className = "droite";
                        this.remplirPartieDroite(droite);
                        moniteur.appendChild(droite);
                        break;
                }
            }
            
            this.remplirPartieGauche = function(gauche) {
                var h3 = document.createElement("h3");
                h3.innerHTML = "Liste des achats";
                gauche.appendChild(h3);
                
                var liste = document.createElement("div");
                liste.className = "liste";
                gauche.appendChild(liste);
                
                var achats = this.caisse.getAchats();
                var nbArticles = 0;
                var montantTotal = 0;
                for (var i=0; i < Object.keys(achats).length; i++) {
                    var ean = Object.keys(achats)[i];
                    var art = achats[ean].article;
                    var qte = achats[ean].quantite;
                    var lib = art.libelle;
                    if (lib.length > 35) {
                        lib = lib.substr(0, 35).trim() + "...";   
                    }
                    nbArticles += qte;
                    montantTotal += qte * art.prix;
                    var ligne = document.createElement("p");
                    ligne.className = "ligne";
                    ligne.dataset.ean = art.ean;
                    ligne.innerHTML = 
                        "<span class='quantite flotteG'>" + qte + "</span>"
                        + "<span class='prix flotteD'>" + art.prix + "</span>"
                        + lib;
                    ligne.addEventListener("click", function(e) {
                        var alreadySelected = document.querySelector("#bcMoniteur .liste .ligne.selected");
                        if (this == alreadySelected) {
                            this.classList.remove("selected");   
                        }
                        else {
                            this.classList.add("selected");
                            alreadySelected && alreadySelected.classList.remove("selected");
                        }                        
                    }, false);
                    liste.appendChild(ligne);
                }
                
                var total = document.createElement("div");
                total.className = "total";
                total.innerHTML = "<span class='prix flotteD'>" + montantTotal.toFixed(2) + "</span>" 
                    + nbArticles + " article" + ((nbArticles > 1) ? "s" : "");
                gauche.appendChild(total);
            }
            
            this.remplirPartieDroite = function(droite) {
                
                switch (this.caisse.getState()) {
                    case 1:     // paiement
                        var btnPayer = document.createElement("div");
                        btnPayer.id = "btnPayer";
                        btnPayer.innerHTML = "Payer";
                        btnPayer.className = "bouton";
                        btnPayer.addEventListener("click", function(e) {
                            var somme = window.prompt("Entrez la somme d'argent que vous payez");
                            somme = Number(somme);
                            var r = this.caisse.payer(somme);
                            if (r >= 0) {
                                var monnaie = (r > 0) ? "N'oubliez pas de prendre votre monnaie (" + (r) + " &euro;)<br><br>" : "";
                                document.getElementById("bcMoniteur").innerHTML = "<p class='centre'>" + monnaie + "Merci pour votre visite et à bientôt.</p>";
                                setTimeout(function() { montrerCaisse(false); this.terminer(); }.bind(this), 1500);
                            }
                            if (r < 0) {
                                document.querySelector("#bcMoniteur .droite").innerHTML = "<p class='centre'>Montant insuffisant</p>";
                                setTimeout(function() { this.afficher(); }.bind(this), 2000);
                            }
                        }.bind(this), false);
                        droite.appendChild(btnPayer);
                        break;
                    case 2:     // caissier_attendu
                        droite.innerHTML = 
                            "<div class='centre'>" 
                                + (this.caisse.getReferenceInconnues().length > 0 ? 
                                    "Réferences inconnues. En attente d'un caissier." : 
                                    "Panier vide. Contrôle nécessaire par un caissier.")
                            + "</div>";
                    case 3:     // session_ouverte
                        var btnAjouter = document.createElement("div");
                        btnAjouter.className = "bouton";
                        btnAjouter.id = "btnAjouter";
                        btnAjouter.innerHTML = "Ajouter";
                        btnAjouter.addEventListener("click", function(e) {
                            var ean = window.prompt("Saisir le code EAN du produit à ajouter :");
                            if (ean) {
                                var r = this.caisse.ajouter(ean);
                                if (r == 0) {
                                    this.afficher();
                                }
                                else {
                                    document.querySelector("#bcMoniteur .droite .message").innerHTML = "Code inconnu.";
                                    setTimeout(function() {
                                        document.querySelector("#bcMoniteur .droite .message").innerHTML = "";
                                    }, 1000);
                                }
                            }
                        }.bind(this), false);
                        var btnSupprimer = document.createElement("div");
                        btnSupprimer.className = "bouton";
                        btnSupprimer.id = "btnSupprimer";
                        btnSupprimer.innerHTML = "Supprimer";
                        btnSupprimer.addEventListener("click", function(e) {
                            var ean = document.querySelector("#bcMoniteur .gauche .liste .ligne.selected");
                            if (ean) {
                                var r = this.caisse.supprimer(ean.dataset.ean);
                                if (r == 0) {
                                    this.afficher();
                                }
                                else {  // should not happen
                                    document.querySelector("#bcMoniteur .droite .message").innerHTML = "Code inconnu.";
                                    setTimeout(function() {
                                        document.querySelector("#bcMoniteur .droite .message").innerHTML = "";
                                    }, 1000);
                                }
                            }
                        }.bind(this), false);
                        var msg = document.createElement("div");
                        msg.id = "msg";
                        msg.className = "message";
                        
                        var btnAnnuler = document.createElement("div");
                        btnAnnuler.innerHTML = "Annuler";
                        btnAnnuler.className = "bouton";
                        btnAnnuler.id = "btnAnnuler";
                        btnAnnuler.addEventListener("click", function(e) {
                            if (window.confirm("Annuler la transaction et terminer les achats ?")) {
                                document.getElementById("bcMoniteur").innerHTML = "<p class='centre'>Transaction annulée.</p>";
                                this.caisse.abandon();
                                currentSelection.deselectionner();
                                setTimeout(function() { montrerCaisse(false); }, 1000);
                                setTimeout(this.terminer.bind(this), 1500);
                            }
                        }.bind(this), false);
                        
                        droite.appendChild(btnAjouter);
                        droite.appendChild(btnSupprimer);
                        droite.appendChild(msg);
                        droite.appendChild(btnAnnuler);
                        
                        break;  
                }
            }
            
            
            this.terminer = function() {
                this.client.terminer();
                this.client = null;
            }
            
        }   


        
        /*****************************
        ****                      ****
        ****       CAISSIERS      ****
        ****                      ****
        ******************************/   
        
        var caissiers = [new Caissier(0), new Caissier(1), new Caissier(2), new Caissier(3)];
                
        // objets de l'IHM
        function Caissier(idx) {
                         
            // null ou instanceof Client
            this.takesCareOf = null;
                
            // null ou instanceof 
            this.scanette = null;
            
            this.index = idx;
            
            this.selectionner = function() {
                if (currentSelection != null) {
                    currentSelection.deselectionner();   
                }
                divCaissier.classList.add("selected");
                pg.classList.add("selectedC");
                if (this.scanette != null) {
                    pg.classList.add("withScanette");
                    this.scanette.afficher();
                }
                if (this.takesCareOf != null) {
                    pg.classList.add("takesCare");   
                }
                if (this.takesCareOf != null) {
                    this.takesCareOf.afficher();   
                }
                currentSelection = this;
            }
            
            this.deselectionner = function() {
                fermerToutesFenetres();
                nettoyerPlayground();
                divCaissier.classList.remove("selected");
                currentSelection = null;   
            }
            
            this.terminer = function() {
                 if (this.scanette != null) {
                    this.scanette.reposer();   
                    this.scanette = null;
                }
                this.deselectionner();
                this.takesCareOf.terminer();
                this.takesCareOf = null;
            }
                         
            var divCaissier = document.createElement("div");
            divCaissier.className = "caissier sprite";
            divCaissier.id = "caissier" + idx;
            divCaissier.style.top = (caisses[idx].y + 10) + "%";
            divCaissier.style.left = (caisses[idx].x + 5) + "%";
            divCaissier.addEventListener("click", function(e) {
                this.selectionner();
            }.bind(this), false);    
            pg.appendChild(divCaissier);
        }
        
                
        
        /*********************************************************
        ****                                                  ****
        ****       ZONES POUR LE DEPLACEMENT DES CLIENTS      ****
        ****                                                  ****
        **********************************************************/   
        
        var zonesOK = [
            { x: 5, y: 84, w: 38, h: 5 },
            { x: 40, y: 70, w: 3, h: 15 },
            { x: 29, y: 70, w: 3, h: 15 },
            { x: 18, y: 70, w: 3, h: 15 },
            { x: 69, y: 79, w: 25, h: 10 },
            { x: 69, y: 59, w: 25, h: 11 },
            { x: 49, y: 56, w: 25, h: 14 },
            { x: 70, y: 42, w: 22, h: 8 },
            { x: 58, y: 41, w: 30, h: 4 },
            { x: 5, y: 66, w: 53, h: 5 },
            { x: 5, y: 43, w: 47, h: 4 },
            { x: 85, y: 27, w: 9, h: 18 },
            { x: 49, y: 27, w: 13.2, h: 18 },
            { x: 62, y: 23, w: 31, h: 8 },
            { x: 65, y: 8, w: 26, h: 6 },
            { x: 5, y: 8, w: 61, h: 8.2 },
            { x: 57, y: 69, w: 16, h: 20 },
            { x: 89, y: 65, w: 5, h: 20 },
            { x: 90, y: 41, w: 4, h: 20 },
            { x: 69, y: 41, w: 5.4, h: 20 },
            { x: 69, y: 41, w: 5.4, h: 20 },
            { x: 89, y: 8, w: 4.7, h: 25 },
            { x: 75, y: 8, w: 6.5, h: 20 },
            { x: 62, y: 8, w: 4.4, h: 20 },
            { x: 49, y: 16, w: 4.4, h: 55 },
            { x: 38, y: 16, w: 4.4, h: 55 },
            { x: 27, y: 16, w: 4.4, h: 55 },
            { x: 16, y: 16, w: 4.4, h: 55 },
            { x: 5, y: 16, w: 4.5, h: 69 }            
        ];
        for (var i=0; i < zonesOK.length; i++) {
            var divZone = document.createElement("div");
            divZone.className = "zoneOK";
            divZone.style.top = zonesOK[i].y + "%";
            divZone.style.left = zonesOK[i].x + "%";
            divZone.style.width = zonesOK[i].w + "%";
            divZone.style.height = zonesOK[i].h + "%";
            pg.appendChild(divZone);   
        }
        zonesOK.inZone = function(x, y) {
            for (var i=0; i < this.length; i++) {
                var xMin = pg.offsetWidth * this[i].x / 100 | 0;
                var xMax = pg.offsetWidth * (this[i].x + this[i].w) / 100 | 0;
                var yMin = pg.offsetHeight * this[i].y / 100 | 0;
                var yMax = pg.offsetHeight * (this[i].y + this[i].h) / 100 | 0;
                if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                    return true;   
                }
            }
            return false;
        }
        
        
        // click sur le fond d'écran
        document.getElementById("playground").addEventListener("click", function(e) {
            if (e.target.classList.contains("zoneOK")) {
                if (currentSelection && currentSelection.deplacerVers) {
                    currentSelection.deplacerVers(e.clientX + window.scrollX, e.clientY + window.scrollY);   
                }
            }
        }, false);
        
        
        
        /**********************************************************************
         *      Fonctions internes à l'IHM (ouverture/fermeture de fenêtres
         **********************************************************************/
        
        function montrerRayon(b) {
            document.getElementById("cbRayon").checked = b;
        }
        function montrerCaisse(b) {
            document.getElementById("cbCaisse").checked = b;
        }
        function montrerCaddie(b) {
            document.getElementById("cbCaddie").checked = b;
        }
        function fermerToutesFenetres() {
            montrerRayon(false);
            montrerCaddie(false);
            montrerCaisse(false);
        }
        function nettoyerPlayground() {
            pg.classList.remove("selected");
            pg.classList.remove("selectedC");
            pg.classList.remove("withScanette");
            pg.classList.remove("takesCare");
            pg.classList.remove("canScan");
        }
        function vider(n) {
            while (n.hasChildNodes()) {
                n.removeChild(n.firstChild);   
            }
        }

        function afficherRayon(i) {
            var libelle = rayons[i].libelle;
            fermerToutesFenetres();
            // remplissage du rayon
            var bcRayon = document.getElementById("bcRayon");
            var allEAN = allArticles.getArticlesEAN();
            var htmlRayon = "<h2>" + libelle + "</h2><div class='contenu'>";
            for (var j=0; j < allEAN.length; j++) {
                var ean = allEAN[j]
                var art = allArticles.getArticle(ean);
                var lib = art.libelle;
                if (lib.length > 25) {
                    lib = lib.substr(0, 25);
                    lib = lib.substring(0, lib.lastIndexOf(' '));
                    lib += " ...";
                }
                if (i == art.rayon) {
                    htmlRayon += 
                        "<div>" 
                            + "<div class='article' style='background-image: url(./images/produits/" + ean + ".jpg)'>"
                                + "<img src='./images/codes/" + ean + ".gif' data-ean='" + ean + "' class='codeBarre'>"
                                + "<div class='ajouter' data-ean='" + ean + "'></div>"
                            + "</div>"
                            + "<div class='etiquette'><img src='./images/codes/" + ean + ".gif' data-ean='" + ean + "' class='codeBarre'>"
                                + "<div class='prix'>" + art.prix + "</div>"
                                + "<div class='libelle'>" + lib + "</div>"
                            + "</div>"
                        + "</div>";
                }
            }
            htmlRayon += "</div><label class='close' for='cbRayon'></label>";
            bcRayon.innerHTML = htmlRayon;
            montrerRayon(true);    
        }
        
        function afficherCaisse(i) {
            var bcCaisse = document.getElementById("bcCaisse");
            bcCaisse.querySelector(".codeBarre").src = "./images/codes/" + (i*1+1) + ".gif";
            bcCaisse.querySelector(".codeBarre").dataset.index = i;
            bcCaisse.querySelector(".fente").dataset.index = i;

            caisses[i].caisse.afficher();

            montrerCaisse(true);
        }
        
        
        
    }// fin init
    
    
})();


