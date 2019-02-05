
/******************************************************************************************
 *                                      ARTICLE_DB 
 *******************************************************************************************/

function ArticleDB(_caisse) {
 
    var articles = {
        5410188006711 : { ean: 5410188006711, prix : 2.15, libelle : "Tropicana Tonic Breakfast", rayon: 13 },
        3560070048786 : { ean: 3560070048786, prix : 0.87, libelle : "Cookies choco", rayon: 3 },
        3017800238592 : { ean: 3017800238592, prix : 2.20, libelle : "Daucy Curry vert de légumes riz graines de courge et tournesol", rayon: 2 },
        3560070976478 : { ean: 3560070976478, prix : 1.94, libelle : "Poulet satay et son riz", rayon: 2 },
        3046920010856 : { ean: 3046920010856, prix : 2.01, libelle : "Lindt Excellence Citron à la pointe de Gingembre", rayon: 12 },
        8715700110622 : { ean: 8715700110622, prix : 0.96, libelle : "Ketchup", rayon: 10 },
        3520115810259 : { ean: 3520115810259, prix : 8.49, libelle : "Mont d'or moyen Napiot", rayon: 6 },
        3270190022534 : { ean: 3270190022534, prix : 0.58, libelle : "Pâte feuilletée", rayon: 11 },
        8718309259938 : { ean: 8718309259938, prix : 4.65, libelle : "Soda stream saveur agrumes", rayon: 14 },
        3560071097424 : { ean: 3560071097424, prix : 2.40, libelle : "Tartelettes carrées fraise", rayon: 3 },
        3017620402678 : { ean: 3017620402678, prix : 1.86, libelle : "Nutella 220g", rayon: 1 },
        3245412567216 : { ean: 3245412567216, prix : 1.47, libelle : "Pain de mie", rayon: 1 },
        45496420598 : { ean: 45496420598, prix : 54.99, libelle : "Jeu switch Minecraft", rayon: 7 },
        3560070139675 : { ean: 3560070139675, prix : 1.94, libelle : "Boîte de 110 mouchoirs en papier", rayon: 5 },
        3020120029030 : { ean: 3020120029030, prix : 1.70, libelle : "Cahier Oxford 90 pages petits carreaux", rayon: 0 },
        3474377910724 : { ean: 3474377910724, prix: 8.60, libelle : "Sortez couverts !", rayon: 5 }
    };
    if (_caisse) {
        // article non reconnu par la scanette mais reconnu par la caisse
        articles[7640164630021] = { ean: 7640164630021, prix : 229.90, libelle : "Robot éducatif Thymio", rayon: 7 };
        articles[3570590109324] = { ean: 3570590109324, prix : 7.48, libelle : "Vin blanc Arbois Vieilles Vignes", rayon: 6 };
    }
    
    this.getArticle = function(codeEAN) {
        return articles[codeEAN];
    }
    
    this.getArticlesEAN = function() {
        return Object.keys(articles);   
    }
    
    this.getArticleForRayon = function(r) {
        var ret = [];
        for (var ean in articles) {
            if (articles[ean].rayon == r) {
                ret.push(articles[ean]);   
            }
        }
        return ret;
    }
}
    
    
/******************************************************************************************
 *                                      SCANETTE
 *******************************************************************************************/
var logging = new Log();

function Scanette(db) {
    
    var panier = {};
    var refsInconnues = [];
    
    var STATE = { bloquee: 0, en_courses: 1, relecture: 2, relecture_ok: 3, relecture_ko: 4 };
    
    var state = STATE.bloquee;
    
    var MAX_A_RELIRE = 12;
    var aRelire = 0;
    var relu = {};
    
    this.numero = 0;
    
    this.debloquer = function() {
        logging.addLog("INFO", "Scanette.debloquer", null, this.numero);
        //console.log("scan" + this.numero + ".debloquer()"); 
        if (state == STATE.bloquee) {
            state = STATE.en_courses;
            panier = {};
            return 0;
        }
        return -1;
    }
    
    this.scanner = function(ean13) {
        logging.addLog("INFO", "Scanette.scanner", ean13, this.numero);
        //console.log("scan" + this.numero + ".scanner(" + ean13 +")");         
        if (state == STATE.en_courses) {
            var art = db.getArticle(ean13);
            if (! art) {
                refsInconnues.push(ean13);
                return -2;
            }
            
            if (!panier[ean13]) {
                panier[ean13] = { quantite: 0, article: art, lastScan: Date.now() };
            }
            panier[ean13].quantite++; 
            panier[ean13].lastScan = Date.now();
            return 0;
        }
        
        if (state == STATE.relecture) {
            if (!panier[ean13]) {
                state = STATE.relecture_ko;
                return -3;   
            }
            if (!relu[ean13]) {
                relu[ean13] = 0;   
            }
            relu[ean13]++;
            if (relu[ean13] > panier[ean13].quantite) {
                state = STATE.relecture_ko;
                return -3;   
            }
            aRelire--;
            if (aRelire == 0) {
                state = STATE.relecture_ok;   
            }
            return 0;
        }
         
        return -1;
    }
    
    this.supprimer = function(ean13) {
        logging.addLog("INFO", "Scanette.supprimer", ean13, this.numero);
        //console.log("scan" + this.numero + ".supprimer(" + ean13 + ")");
        if (state != STATE.en_courses) {
            return -1;
        }
        if (! panier[ean13]) {
            return -2;   
        }
        panier[ean13].quantite--;
        if (panier[ean13].quantite == 0) {
            delete(panier[ean13]);   
        }
    }
    
    this.quantite = function(ean13) {
        logging.addLog("INFO", "Scanette.quantite", ean13, this.numero);
        //console.log("scan" + this.numero + ".quantite(" + ean13 + ")");
        return (panier[ean13]) ? panier[ean13].quantite : 0;   
    }
    
    this.getArticles = function() {
        logging.addLog("INFO", "Scanette.getArticles", null, this.numero);
        //console.log("scan" + this.numero + ".getArticles()");
        return Object.values(panier).sort(function (a1, a2) { return a2.lastScan - a1.lastScan; }).map(function(e) { return e.article; });
    }
    
    this.getReferencesInconnues = function() {
        logging.addLog("INFO", "Scanette.getReferencesInconnues", null, this.numero);
        //console.log("scan" + this.numero + ".getReferencesInconnues()");
        return refsInconnues;   
    }
        
    this.abandon = function() {
        logging.addLog("INFO", "Scanette.abandon", null, this.numero);
        //console.log("scan" + this.numero + ".abandon()");
        panier = {};
        refsInconnues = [];
        state = STATE.bloquee;
    }
    
    this.getState = function() {
        logging.addLog("INFO", "Scanette.getState", null, this.numero);
        return state;   
    }
    
    this.getARelire = function() {
        logging.addLog("INFO", "Scanette.getARelire", null, this.numero);
        return aRelire;   
    }
    
    this.transmission = function(c) {
        logging.addLog("INFO", "Scanette.transmission", c, this.numero);
        //console.log("scan" + this.numero + ".transmission(caisse" + c.numero + ")");
        if (state != STATE.en_courses && state != STATE.relecture_ok) {
            return -1;       
        }
        switch (c.connexion(this)) {
            case 0: 
                this.abandon();
                return 0;
            case 1: 
                state = STATE.relecture;
                var nbProduitsDansPanier = Object.values(panier).map(function(e) { 
                    return e.quantite;
                }).reduce(function(acc, el) { return acc + el});
                aRelire = nbProduitsDansPanier < MAX_A_RELIRE ? nbProduitsDansPanier : MAX_A_RELIRE;
                relu = {};
                return 1;
        }
        return -1;
    }    
    
}



/******************************************************************************************
 *                                      CAISSE 
 *******************************************************************************************/

function Caisse() {
 
    var db = new ArticleDB(true);
 
    var achats = {};
    var refsInconnues = [];
    
    var STATE = { en_attente: 0, paiement: 1, attente_caissier: 2, session_ouverte: 3 };
    var state = STATE.en_attente;
    
    this.numero = 0;

    this.getState = function() {
        logging.addLog("INFO", "Caisse.getState", null, this.numero);
        return state;   
    }
    
    this.connexion = function(scan) {
        logging.addLog("INFO", "Caisse.connexion", scan, this.numero);
        //console.log("caisse" + this.numero + ".connexion(scan" + scan.numero + ")");    
        if (state != STATE.en_attente) {
            return -1;
        }
        
        if (scan.getState() != 1 && scan.getState() != 3) {
            return -1;
        }
        
        var relecture = demandeRelecture();    
        
        refsInconnues = scan.getReferencesInconnues();
        var panier = scan.getArticles();

        if (panier.length != 0 && relecture && scan.getState() == 1) {
            return 1;
        }

        achats = {};
        
        if (panier.length == 0) {
            state = STATE.attente_caissier;
        }
        else {
            for (var i=0; i < panier.length; i++) {
                var art = panier[i];
                achats[art.ean] = { quantite: scan.quantite(art.ean), article: art }; 
            }
            state = (refsInconnues.length > 0) ? STATE.attente_caissier : STATE.paiement;
        }
        return 0;
    };
    
    
    var demandeRelecture = function() {
        logging.addLog("INFO", "Caisse.demandeRelecture", null, this.numero);
        return Math.random() < 0.1;
    };
    
    this.ajouter = function(ean) {
        logging.addLog("INFO", "Caisse.ajouter", ean, this.numero);
        //console.log("caisse" + this.numero + ".ajouter(" + ean + ")");    
        if (state != STATE.session_ouverte) {
            return -1;   
        }
        var art = db.getArticle(ean);
        if (art == null) {
            return -2;
        }
        if (!achats[ean]) {
            achats[ean] = { quantite: 0, article: art };   
        }
        achats[ean].quantite++;
        return 0;
    }
    
    this.supprimer = function(ean) {
        logging.addLog("INFO", "Caisse.supprimer", ean, this.numero);
        //console.log("caisse" + this.numero + ".supprimer(" + ean + ")");    
        if (state != STATE.session_ouverte) {
            return -1;
        }
        if (!achats[ean]) {
            return -2;   
        }
        achats[ean].quantite--;
        if (achats[ean].quantite == 0) {
            delete(achats[ean]);   
        }
        return 0;
    }
    
    this.ouvrirSession = function() {
        logging.addLog("INFO", "Caisse.ouvrirSession", null, this.numero);
        //console.log("caisse" + this.numero + ".ouvrirSession()");            
        if (state != STATE.paiement && state != STATE.attente_caissier) {
            return -1;      
        }
        state = STATE.session_ouverte;
        return 0;
    }
    
    this.fermerSession = function() {
        logging.addLog("INFO", "Caisse.fermerSession", null, this.numero);
        //console.log("caisse" + this.numero + ".fermerSession()");            
        if (state != STATE.session_ouverte) {
            return -1;   
        }
        state = (Object.keys(achats).length == 0) ? STATE.en_attente : STATE.paiement;   
        return 0;
    }
    
    this.abandon = function() {
        logging.addLog("INFO", "Caisse.abandon", null, this.numero);
        //console.log("caisse" + this.numero + ".abandon()");            
        state = STATE.en_attente;
        achats = {};
        refsInconnues = [];
    }
    
    this.payer = function(somme) {
        logging.addLog("INFO", "Caisse.payer", somme, this.numero);
        //console.log("caisse" + this.numero + ".payer()");            
        if (state != STATE.paiement) {
            return -1; 
        }
        
        var aPayer = this.getMontantTotal();
        
        if (somme >= aPayer) {
            state = STATE.en_attente;   
        }
        return somme - aPayer;
    }
    
    
    this.getAchats = function() {
        logging.addLog("INFO", "Caisse.getAchats", null, this.numero);
        return achats;   
    };
    this.getReferencesInconnues = function() {
        logging.addLog("INFO", "Caisse.getReferencesInconnues", null, this.numero);
        return refsInconnues;   
    };
    this.getMontantTotal = function() {
        logging.addLog("INFO", "Caisse.getMontantTotal", null, this.numero);
        var ean = Object.keys(achats);
        var aPayer = 0;
        for (var i=0; i < ean.length; i++) {
            aPayer += achats[ean[i]].quantite * achats[ean[i]].article.prix;
        }
        return aPayer.toFixed(2);    
    }
    
}

/******************************************************************************************
 *                                      LOG FORMAT
 *******************************************************************************************/
function Log() {
    // Log data
    var logData = [];
    var text = "";
    // Add to the log
    this.addLog = function(logType, methodName, values, user) {
        var x = new Date();
        var data = { 
            Type : logType, 
            MethodName : methodName,
            Parameters : values,
            User : user,
            DateTime : x.getDate() + "/" + (x.getMonth() + 1) + "/" + x.getFullYear() 
            + " " + x.getHours() + ":" + x.getMinutes() + ":" + x.getMilliseconds()
        };

        var jsonContent = JSON.stringify(data);
        text = text + jsonContent + "\n";
        logData.push(jsonContent);
        console.log("------- Begin -------");
        console.log(text);
        console.log("------- End -------");
    }

    // Get the logs
    this.getLogs = function() {
        return logData;
    }
}