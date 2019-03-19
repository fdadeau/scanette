
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
        var l = { obj: "scan" + this.numero, operation: "debloquer", parameters: [] };
        if (state == STATE.bloquee) {
            state = STATE.en_courses;
            panier = {};
            log(l, 0);
            return 0;
        }
        log(l, -1);
        return -1;
    }
    
    this.scanner = function(ean13) {
        var l = { obj: "scan" + this.numero, operation: "scanner", parameters: [ean13] };         
        if (state == STATE.en_courses) {
            var art = db.getArticle(ean13);
            if (! art) {
                refsInconnues.push(ean13);
                log(l, -2);
                return -2;
            }
            
            if (!panier[ean13]) {
                panier[ean13] = { quantite: 0, article: art, lastScan: Date.now() };
            }
            panier[ean13].quantite++; 
            panier[ean13].lastScan = Date.now();
            log(l, 0);
            return 0;
        }
        
        if (state == STATE.relecture) {
            if (!panier[ean13]) {
                state = STATE.relecture_ko;
                log(l, -3);
                return -3;   
            }
            if (!relu[ean13]) {
                relu[ean13] = 0;   
            }
            relu[ean13]++;
            if (relu[ean13] > panier[ean13].quantite) {
                state = STATE.relecture_ko;
                log(l, -3);
                return -3;   
            }
            aRelire--;
            if (aRelire == 0) {
                state = STATE.relecture_ok;   
            }
            log(l, 0);
            return 0;
        }
        log(l, -1);
        return -1;
    }
    
    this.supprimer = function(ean13) {
        var l = { obj: "scan" + this.numero, operation: "supprimer", parameters: [ean13] };         
        if (state != STATE.en_courses) {
            log(l, -1);
            return -1;
        }
        if (! panier[ean13]) {
            log(l, -2);
            return -2;   
        }
        panier[ean13].quantite--;
        if (panier[ean13].quantite == 0) {
            delete(panier[ean13]);   
        }
    }
    
    this.quantite = function(ean13) {
        var l = { obj: "scan" + this.numero, operation: "quantite", parameters: [ean13] };         
        var ret = (panier[ean13]) ? panier[ean13].quantite : 0;
        log(l, ret);
        return ret;
    }
    
    this.getArticles = function() {
        var l = { obj: "scan" + this.numero, operation: "getArticles", parameters: [] };         
        log(l, 0);
        return Object.values(panier).sort(function (a1, a2) { return a2.lastScan - a1.lastScan; }).map(function(e) { return e.article; });
    }
    
    this.getReferencesInconnues = function() {
        var l = { obj: "scan" + this.numero, operation: "getReferencesInconnues", parameters: [] };         
        log(l, refsInconnues);
        return refsInconnues;   
    }
        
    this.abandon = function() {
        var l = { obj: "scan" + this.numero, operation: "abandon", parameters: [] };         
        panier = {};
        refsInconnues = [];
        state = STATE.bloquee;
        log(l);
    }
    
    this.getState = function() {
        return state;   
    }
    
    this.getARelire = function() {
        return aRelire;   
    }
    
    this.transmission = function(c) {
        var l = { obj: "scan" + this.numero, operation: "transmission", parameters: ["caisse" + c.numero] };         
        if (state != STATE.en_courses && state != STATE.relecture_ok) {
            log(l, -1);
            return -1;       
        }
        switch (c.connexion(this)) {
            case 0: 
                this.abandon();
                log(l, 0);
                return 0;
            case 1: 
                state = STATE.relecture;
                var nbProduitsDansPanier = Object.values(panier).map(function(e) { 
                    return e.quantite;
                }).reduce(function(acc, el) { return acc + el});
                aRelire = nbProduitsDansPanier < MAX_A_RELIRE ? nbProduitsDansPanier : MAX_A_RELIRE;
                relu = {};
                log(l, 1);
                return 1;
        }
        log(l, -1);
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
        return state;   
    }
    
    this.connexion = function(scan) {
        var l = { obj: "caisse" + this.numero, operation: "connexion", parameters: ["scan" + scan.numero] };         
        if (state != STATE.en_attente) {
            log(l, -1);
            return -1;
        }
        
        if (scan.getState() != 1 && scan.getState() != 3) {
            log(l, -1);
            return -1;
        }
        
        var relecture = demandeRelecture();    
        
        refsInconnues = scan.getReferencesInconnues();
        var panier = scan.getArticles();

        if (panier.length != 0 && relecture && scan.getState() == 1) {
            log(l, 1);
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
        log(l, 0);
        return 0;
    };
    
    
    var demandeRelecture = function() {
        return Math.random() < 0.1;
    };
    
    this.ajouter = function(ean) {
        var l = { obj: "caisse" + this.numero, operation: "ajouter", parameters: [ean] };         
        if (state != STATE.session_ouverte) {
            log(l, -1);
            return -1;   
        }
        var art = db.getArticle(ean);
        if (art == null) {
            log(l, -2);
            return -2;
        }
        if (!achats[ean]) {
            achats[ean] = { quantite: 0, article: art };   
        }
        achats[ean].quantite++;
        log(l, 0);
        return 0;
    }
    
    this.supprimer = function(ean) {
        var l = { obj: "caisse" + this.numero, operation: "supprimer", parameters: [ean] };         
        if (state != STATE.session_ouverte) {
            log(l, -1);
            return -1;
        }
        if (!achats[ean]) {
            log(l, -2);
            return -2;   
        }
        achats[ean].quantite--;
        if (achats[ean].quantite == 0) {
            delete(achats[ean]);   
        }
        log(l, 0);
        return 0;
    }
    
    this.ouvrirSession = function() {
        var l = { obj: "caisse" + this.numero, operation: "ouvrirSession", parameters: [] };         
        if (state != STATE.paiement && state != STATE.attente_caissier) {
            log(l, -1);
            return -1;      
        }
        state = STATE.session_ouverte;
        log(l, 0);
        return 0;
    }
    
    this.fermerSession = function() {
        var l = { obj: "caisse" + this.numero, operation: "fermerSession", parameters: [] };         
        if (state != STATE.session_ouverte) {
            log(l, -1);
            return -1;   
        }
        state = (Object.keys(achats).length == 0) ? STATE.en_attente : STATE.paiement;   
        log(l, 0);
        return 0;
    }
    
    this.abandon = function() {
        var l = { obj: "caisse" + this.numero, operation: "abandon", parameters: [] };         
        state = STATE.en_attente;
        achats = {};
        refsInconnues = [];
        log(l);
    }
    
    this.payer = function(somme) {
        var l = { obj: "caisse" + this.numero, operation: "payer", parameters: [somme] };         
        if (state != STATE.paiement) {
            log(l, -1);
            return -1; 
        }
        
        var aPayer = this.getMontantTotal();
        
        if (somme >= aPayer) {
            state = STATE.en_attente;   
        }
        log(l, somme - aPayer);
        return somme - aPayer;
    }
    
    
    this.getAchats = function() {
        return achats;   
    };
    this.getReferencesInconnues = function() {
        return refsInconnues;   
    };
    this.getMontantTotal = function() {
        var ean = Object.keys(achats);
        var aPayer = 0;
        for (var i=0; i < ean.length; i++) {
            aPayer += achats[ean[i]].quantite * achats[ean[i]].article.prix;
        }
        return aPayer.toFixed(2);    
    }
    
}


var forWho = null;
if (window.location.href.indexOf("for=lydie") > 0) forWho = "lydie";
if (window.location.href.indexOf("for=vahana") > 0) forWho = "vahana";
if (window.location.href.indexOf("for=fred") > 0) forWho = "fred";
function log(l, res) {
    if (res == undefined) {
        res = "?";   
    }
    switch (forWho) {
        case "lydie":
            console.log(l.obj + ", " + l.operation + ", [" + l.parameters.join(";") + "], " + JSON.stringify(res));
            break;
        case "fred": 
            l.result = res;
            console.log(JSON.stringify(l));
            break;
        case "vahana": 
            break;
        default: 
            console.log(l.obj + "." + l.operation + "(" + l.parameters.join(",") + ") -> " + JSON.stringify(res));
    }
}

