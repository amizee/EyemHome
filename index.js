import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"

const itemPositions = { 
    "Standard": [
        {"top":"53%", "left": "47%", "name":"teddybear"}, 
        {"top":"80%", "left": "73%", "name":"bag"}, 
        {"top":"53%", "left": "27%", "name":"books"}, 
        {"top":"43%", "left": "70%", "name":"clothes"}, 
        {"top":"20%", "left": "57%", "name":"clock"},
        {"top":"40%", "left": "2%", "name":"bird"},
    ],
    "Birthday": [
        {"top":"53%", "left": "47%", "name":"dachshund"},
        {"top":"80%", "left": "73%", "name":"gift"}, 
        {"top":"56%", "left": "22%", "name":"birthday_cake"}, 
        {"top":"65%", "left": "2%", "name":"birthday_card"}, 
        {"top":"37%", "left": "79.5%", "name":"birthday_hat"},
        {"top":"37%", "left": "4%", "name":"dancers"}
    ],
    "Halloween": [
        {"top":"53%", "left": "47%", "name":"cat"}, 
        {"top":"80%", "left": "65%", "name":"lollipop"}, 
        {"top":"49%", "left": "18%", "name":"witchhat"}, 
        {"top":"65%", "left": "80%", "name":"Broom"}, 
        {"top":"20%", "left": "57%", "name":"bat"},
        {"top":"40%", "left": "5%", "name":"owl"}, 
        {"top":"65%", "left": "25%", "name":"Pumpkin"}
    ],
    "Christmas": [
        {"top":"53%", "left": "47%", "name":"santaclaus"}, 
        {"top":"39%", "left": "3%", "name":"elf"}, 
        {"top":"52%", "left": "25%", "name":"chicken"}, 
        {"top":"80%", "left": "80%", "name":"gingerbread"}, 
        {"top":"21.5%", "left": "37%", "name":"christmas_socks"},
        {"top":"73%", "left": "26%", "name":"snowglobe"},
        {"top":"27%", "left": "73%", "name":"star"},
    ]
};

const backgroundAspectRatio = 1077/600;

async function waitFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(resolve);
    });
}

class Item extends SvgPlus {
    constructor(params) {
        super("img");
        this.props = {
            name: params[0].name, 
            src: `http://127.0.0.1:5502/images/${params[0].name}.svg`, 
            styles: {
                position: "absolute", 
                top: params[0].top, 
                left: params[0].left, 
                width: "8%"
            }
        }
        this.editable = params[1];
        this.progress = 0;
        this.animate();
    }

    async animate() {
        
        if (!this.editable) {
            while (true) {
                await waitFrame();
                if (!this.hover) {
                    this.progress -= 0.005;
                } else {
                    this.progress += 0.02;
                }
            }
        }
        
    }

    set hover(value) {
        this._hover = value;
    }

    get hover() {
        return this._hover;
    }

    set progress(value) {
        if (value < 0){
            value = 0;
        } else if (value > 1){
            value = 1;
        }
        if (value === 1 && this._progress < 1){
            const event = new Event("click");
            this.dispatchEvent(event);
        }
        this._progress = value;
        this.style.opacity = 1 - value;
        // update wheel
    }

    get progress() { 
        return this._progress;
    }
}

class BedroomWindow extends SvgPlus {
    constructor(editable, app, effect) {
        super ("div");
        window.addEventListener("mousemove", (e) => {
            // console.log("eye position: ", e.clientX, e.clientY);
            this.eyePosition = {x: e.clientX, y: e.clientY};
        });

        this.app = app;
        this.effect = effect;
        // this.app.set("state", "init");

        this.styles = {
            "position": "absolute",
            "display": "flex",
            "justify-content": "center", 
            "align-items": "center", 
            "width": "100%", 
            "height": "100%",
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -50%)"
        }

        // query the database for the background image
        app.onValue("level", (level) => {
            if (level){
                console.log("level: ", level);
                this.level = level;
                if (!this.background){
                    this.background = this.createChild("img", {src: `http://127.0.0.1:5502/images/${level}.svg`, styles: {position: "relative", width: "100%", height: "100%", "object-fit": "contain", "z-index":"-1"}});
                } else {
                    this.background.src = `http://127.0.0.1:5502/images/${level}.svg`;
                }
                
                
            } else {
                this.level = "Standard";
                if (!this.background){
                    this.background = this.createChild("img", {src: `http://127.0.0.1:5502/images/standard.svg`, styles: {position: "relative", width: "100%", height: "100%", "object-fit": "contain", "z-index":"-1"}});
                } else {
                    this.background.src = `http://127.0.0.1:5502/images/standard.svg`;
                }
            }
        });

        // create background image for the game window: maybe randomize the bedroom image generation later
        // this.background = this.createChild("img", {src: "http://127.0.0.1:5502/images/standard.svg", styles: {position: "relative", width: "100%", height: "100%", "object-fit": "contain"}});

        this.promptWindow = this.createChild("div", {styles: {position: "absolute", top: "0%", left: "50%", transform: "translateX(-50%)", "font-size": "30px"}});

        this.items = this.createChild("div");
        this.editable = editable;
        this.correctItems = [];
        this.selectedItems = [];
        this.itemsOnScreen = [];

        app.onValue("itemsOnScreen", (itemsOnScreen) => {
            // compare the value from the database and within the app
            // if the app has more items, fade out the extra items
            // in the play state
            if (this.state && this.state === "play" && !this.effect.muted){
                this.effect.load();
                this.effect.play();
            }
            if (itemsOnScreen){
                if (this.itemsOnScreen.length > itemsOnScreen.length){
                    // find the item that should be removed
                    let itemToRemove = this.itemsOnScreen.find(i => !itemsOnScreen.find(j => j.name === i.name));
                    this.fadeOutEffect(itemToRemove.name);
                    console.log("this.state for sound effect", this.state);
                    // itemToRemove.styles.display = "none";
                    // remove the item from the correct items as well
                    // this.app.set("correctItems", this.correctItems.filter(i => i !== itemToRemove.name));

                }
                this.itemsOnScreen = itemsOnScreen;
            } 
            else {
                console.log("itemsOnScreen is null");
                console.log("please log this: ", this.state && this.state !== "end");
                if (this.state && this.state !== "end") {
                    this.itemsOnScreen = itemPositions[this.level];
                    this.app.set("itemsOnScreen", this.itemsOnScreen);
                }
            }
            
        });

        app.onValue("correctItems", (correctItems) => {
            console.log("onvalue correctItems");
            console.log(correctItems);
            console.log(this.correctItems);
            if (this.correctItems){
                this.correctItems = correctItems;
                if (this.correctItems && this.correctItems.length !== 0){
                    this.app.set("prompt", `Select the ${this.correctItems[0].replace(/_/g, " ").toUpperCase()}`);
                }
                
            }
            
            
        });

        app.onValue("prompt", (prompt) => {
            console.log("onvalue prompt");
            console.log("onvalue prompt", prompt);
            if (this.promptWindow) { 
                if (typeof prompt !== "string") prompt = "";
                this.promptWindow.textContent = prompt;
            }
        });

        app.onValue("state", async (state) => {
            this.state = state;
            console.log("onvalue state", state);
            await this.setStateAsync(state);
        });

        this.updateAspectRatio();
    }

    async updateAspectRatio() {
        while (true) {
            let parent = this.offsetParent;
            if (parent){
                let aspectRatio = parent.offsetWidth / parent.offsetHeight;
                if (aspectRatio < backgroundAspectRatio){
                    this.style.width = "100%";
                    this.style.height = "auto";
                    if (this.background){
                        this.background.style.width = "100%";
                        this.background.style.height = "auto";
                    }
                } else {
                    this.style.width = "auto";
                    this.style.height = "100%";
                    if (this.background){
                        this.background.style.width = "auto";
                        this.background.style.height = "100%";
                    }
                }
            }
            await waitFrame();
        }
    }

    async getItemsOnScreen(){
        return await this.app.get("itemsOnScreen");
    }

    fadeOutEffect(element) {
        // TODO disable fadeouteffect on clinician side
        if (typeof element === 'string') {
            element = this.querySelector(`[name=${element}]`);
        }
        element.style.display = 'none';
    }

    loadButtons(){
        if (this.editable){
            let selButton = document.getElementsByName("selectButton");
            if (selButton.length > 0){
                selButton[0].style.display = "block";
            } else {
                this.createChild("button", {name: "selectButton", content: "Select", styles: {position: "absolute", "font-size": "0.8em", bottom: "15%", left: "47%", padding: "10px 20px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
                    if (this.correctItems.length === 0){
                        alert("Please select at least one item");
                        return;
                    }
                    console.log("set to play state", this.correctItems);
                    this.app.set("correctItems", this.correctItems);
                    this.app.set("state", "play");
                });
                let selectButton = document.getElementsByName("selectButton")[0];
                selectButton.addEventListener("mouseover", () => {
                    selectButton.styles = {"cursor": "pointer"};
                })
                selectButton.addEventListener("mouseleave", () => {
                    selectButton.styles = {"cursor": "auto"};
                })

                this.createChild("button", { name: "resetButton", content: "&#8634;", styles: {position: "absolute", "font-size": "0.8em", bottom: "15%", left: "53%", "margin-left": "25px", padding: "9.2px 15px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
                    console.log("reset");
                    this.app.set("prompt", "");
                    // this.app.set("itemsOnScreen", null);
                    this.app.set("itemsOnScreen", itemPositions[this.level]);
                    this.app.set("state", "reset");
                });
                let resetButton = document.getElementsByName("resetButton")[0];
                resetButton.addEventListener("mouseover", () => {
                    resetButton.styles = {"cursor": "pointer"};
                })
                resetButton.addEventListener("mouseleave", () => {
                    resetButton.styles = {"cursor": "auto"};
                })
               
            }
        }
    }

    async setStateAsync(params){
        
        switch (params) {
            case null:
                this.app.set("state", "init");
                break;
            case "reset":
                console.log("resetting the state");
                this.app.set("itemsOnScreen", itemPositions[this.level]);
                this.app.set("prompt", "");
                this.app.set("state", "init");
                if (this.editable){
                    let selButton = document.getElementsByName("selectButton")[0];
                    console.log("show the select button",selButton);
                    if (selButton){
                        selButton.style.pointerEvents = "auto";
                    }
                }
                
                break;
            case "init":
                // load the items on the screen
                let itemsOnScreen = await this.getItemsOnScreen();
                console.log("setStateAsync: print the itemsOnScreen", itemsOnScreen);
                if (!itemsOnScreen){
                    console.log("itemsOnScreen is null");
                    console.log("level", this.level);
                    itemsOnScreen = itemPositions[this.level];
                    console.log("itemsOnScreen after getting null value", itemsOnScreen);
                }
                this.itemsOnScreen = itemsOnScreen;
                this.app.set("itemsOnScreen", itemsOnScreen);
                this.app.set("state", "setup");
                
                break;
            case "setup":
                this.correctItems = [];
                this.items.innerHTML = "";
                this.loadButtons();
                // now instead of calling the itemPositions, we can call the itemsOnScreen from the database
                console.log("setup: print the itemsOnScreen", this.itemsOnScreen);
                console.log("this.correct items: before setting the items ", this.correctItems);
                // Ensure this.correctItems is an array
                for (const item of this.itemsOnScreen) {

                    let itemImg = this.items.createChild(Item, {}, [item, this.editable]);
                    
                    if (this.editable){
                        itemImg.addEventListener("click", () => {
                            // select/deselect the item
                            console.log("this.correct item in setup state: ", this.correctItems);
                            if (!this.correctItems){
                                this.correctItems = [];
                            }
                            const itemIndex = this.correctItems.indexOf(item.name);
                            if (itemIndex > -1) {
                                this.correctItems.splice(itemIndex, 1);
                                console.log(this.correctItems);
                                itemImg.style.border = "";
                            } else {
                                this.correctItems.push(item.name);
                                console.log(this.correctItems);
                                // highlight the selected item
                                itemImg.style.border = "2px solid yellow";
                            }
                        });
                    }
                }
                break;

            case "play":
                this.items.innerHTML = "";
                // this.app.set("prompt", `Select the ${this.correctItems[0].toUpperCase()}`);
                // no need to set promptWindow here as the prompt is already set in onValue listener
                // instead of calling the itemPositions, we can call the itemsOnScreen from the database
                if (this.editable){
                    this.loadButtons();
                }
                for (const item of this.itemsOnScreen) {
                    let itemImg = this.items.createChild(Item, {}, [item, this.editable]);
                    if (!this.editable) {
                        itemImg.addEventListener("click", () => {
                            let currentItem = this.correctItems[0];
                            if (item.name !== currentItem) {
                                this.app.set("prompt", `Try again! This is not the ${currentItem.replace(/_/g, " ").toUpperCase()}`);
                            } else {
                                // On the last item, set state to end immediately so that items are not reloaded since itemsOnSscreen is null
                                if (this.correctItems.length === 1) {
                                    this.state = "end";
                                }
                                // remove the item from the screen
                                this.app.set("itemsOnScreen", [...this.itemsOnScreen].filter(i => i.name !== item.name));
                                // remove the item from the correct items
                                this.app.set("correctItems", this.correctItems.slice(1));
                                // if correct items are empty, set the state to end
                                if (!this.correctItems){
                                    this.app.set("state", "end");
                                } else {
                                    // update the prompt
                                    this.app.set("prompt", `Select the ${this.correctItems[0].replace(/_/g, " ").toUpperCase()}`);
                                }
                            }
                        });  
                    }
                }
                break;

            case "end":
                // disable all the items
                this.items.innerHTML = "";
                console.log("Case end");
                this.app.set("prompt", "Congratulations!");
                this.loadButtons();
                if (this.editable){
                    document.getElementsByName("selectButton")[0].style.pointerEvents = "none";
                }
                let images = await this.getItemsOnScreen();
                if (images) {
                    for (const item of images) {
                        let itemImg = this.items.createChild(Item, {}, [item, this.editable]);
                        itemImg.style.pointerEvents = "none";
                    }
    
                }
                
                // this.items.querySelectorAll("img").forEach(item => {
                //     item.style.pointerEvents = "none";
                // });
                break;
        
            default:
                break;
        }
    }

    checkVectorOnItem(vector) {
        const offsetRatio = 1;
        let x = vector.x;
        let y = vector.y;
        let items = this.items.children;
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            let rect = item.getBoundingClientRect();
            // TODO enlarge clickbox
            if (x > rect.left*0.9 && x < rect.right*1.1 && y > rect.top*0.9 && y < rect.bottom*1.1){
                return item;
            }
        }
        return null;
    }

    set eyePosition(vector) {
        let item = this.checkVectorOnItem(vector);
        // console.log("item: ", item);
        // console.log("item: ", item);
        [...this.items.children].forEach(i => {
            i.hover = false;
        });
        if (item){
            // console.log(item);
            item.hover = true;
        }
    }
}
class MainWindow extends SvgPlus {
    constructor(isSender, app) {
        super("div");

        this.styles = {
            "position": "absolute",
            "display": "flex",
            "justify-content": "center", 
            "align-items": "center", 
            "width": "100%",
            "height": "100%",
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -50%)"
        }

        window.addEventListener('resize', () => {
            this.updateHomeStyles();
        });

        let audio = this.createChild("audio", {src: "http://127.0.0.1:5502/sounds/home.mp3"});
        let effect = this.createChild("audio", {src: "http://127.0.0.1:5502/sounds/effect.mp3"});
        app.set("muted", true);

        // Create home and volume button on clinician side in the same position every time
        if (isSender) {
            this.buttonRow = this.createChild("div", {
                styles: {
                    "position": "absolute",
                    "top": "0",
                    "left": "0",
                    "margin": "10px 10px 0 150px",
                    "z-index": "2"
                }
            });

            this.homeButton = new HomeButton(app);
            this.volumeButton = new VolumeButton(app);
            this.buttonRow.appendChild(this.homeButton);
            this.buttonRow.appendChild(this.volumeButton);
        }        

        this.mainDiv = this;
        // Home screen
        let homeDiv = this.createChild("div", {styles: {position: "relative"}});
        homeDiv.props = {
            id: "house"
        }
        this.homeDiv = homeDiv;
        let house = homeDiv.createChild("img", {
            src: "http://127.0.0.1:5502/images/house.svg", 
            styles: {
                "width":"100%", 
                "height":"100%"
        }});
        this.house = house;
        this.findItemRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/SightnSeek.svg", 
            styles: {
                position: "absolute",
                height: "20.5%",
                top: "36.5%",
                right: "33.7%",
                border: "solid 8px #466596"
            }
        });
        if (isSender) {
            this.findItemRoom.addEventListener('mouseover', () => {
                this.findItemRoom.styles = {cursor: "pointer"};
            })
            this.findItemRoom.addEventListener('mouseout', () => {
                this.findItemRoom.styles = {cursor: "auto"};
            })
            this.findItemRoom.addEventListener('click', () => {
                app.set("room", "levels");
            })
        }

        this.kitchenRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/EyeSpell.svg", 
            styles: {
                position: "absolute",
                height: "20.5%",
                top: "67.2%",
                right: "33.7%",
                border: "solid 8px #466596"
            }
        });
        this.musicRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/PianoTrials.svg", 
            styles: {
                position: "absolute",
                height: "20.5%",
                top: "36.5%",
                right: "9.7%",
                border: "solid 8px #466596"
            }
        });
        this.artRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/EyePaint.svg", 
            styles: {
                position: "absolute",
                height: "20.5%",
                top: "67.2%",
                right: "9.7%",
                border: "solid 8px #466596"
            }
        });
        let mivin = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/mivin.svg", 
            styles: {
                position: "absolute",
                height: "22%",
                top: "12.2%",
                right: "21.6%"
            }
        });

        // Update volume on both sides
        app.onValue("muted", (value) => {
            console.log("muted", value);
            if (value) {
                // Mute logic
                if (this.volumeButton) {
                    this.volumeButton.props = {src: "http://127.0.0.1:5502/images/volume-mute.svg"};
                }
                audio.muted = true;
                effect.muted = true;
            } else {
                // Unmute logic
                if (this.volumeButton) {
                    this.volumeButton.props = {src: "http://127.0.0.1:5502/images/volume.svg"};
                }
                audio.muted = false;
                effect.muted = false;
                audio.load();
                audio.loop = true;
                audio.play();
            }
        });

        app.onValue("room", (value) => { // Triggers once immediately after the listener is attached, to provide the current value of the data
            if (value === "home") {
                app.set("state", "setup");

                if (audio.src !== "http://127.0.0.1:5502/sounds/home.mp3") { // From SightnSeek to home screen
                    audio.src = "http://127.0.0.1:5502/sounds/home.mp3";
                    audio.volume = 1;
                    audio.play();
                }

                if (isSender) {
                    if (this.backButton) {
                        this.backButton.styles = {display: "none"};
                    }
                }

                this.levelScreen = document.getElementById('level-screen');
                if (this.levelScreen) {
                    this.levelScreen.styles = {display: "none"};
                }
                if (this.bedroom) {
                    this.bedroom.styles = {display: "none"};
                }

                homeDiv.styles = {display: "block"};
            }
            else if (value === "levels") {
                if (audio.src !== "http://127.0.0.1:5502/sounds/home.mp3") { // From SightnSeek to home screen
                    audio.src = "http://127.0.0.1:5502/sounds/home.mp3";
                    audio.volume = 1;
                    audio.play();
                }

                homeDiv.styles = {display: "none"};
                if (this.bedroom) {
                    this.bedroom.styles = {display: "none"};
                }

                if (isSender) {
                    if (this.backButton) {
                        this.backButton.styles = {display: "none"};
                    }
                }

                this.levelScreen = document.getElementById('level-screen');
                if (!this.levelScreen) {
                    this.levelScreen = new LevelScreen(app, isSender);
                    this.mainDiv.appendChild(this.levelScreen);
                } else {
                    this.levelScreen.styles = {display: "block"};
                }
            } else if (value === "game") {
                audio.src = "http://127.0.0.1:5502/sounds/bedroom-background.mp3";
                audio.volume = 0.5;
                audio.load();
                audio.play();
                
                homeDiv.styles = {display: "none"};
                if (isSender) {
                    if (!this.backButton) {
                        this.backButton = new BackButton(app);
                        this.buttonRow.insertBefore(this.backButton, this.buttonRow.firstChild);
                    } else {
                        this.backButton.styles = {display: "inline-block"};
                    }
                }
             
                if (this.levelScreen) {
                    this.levelScreen.styles = {display: "none"};
                }
    
                if (!this.bedroom) {
                    this.bedroom = new BedroomWindow(isSender, app, effect);
                    this.mainDiv.appendChild(this.bedroom);
                } else {
                    this.bedroom.styles = {display: "block"};
                }
            }
        });
        this.updateAspectRatio();
    }

    set eyePosition(vector){
        if (this.bedroom){
            this.bedroom.eyePosition = vector;
        }
    }

    async updateAspectRatio() {
        while (true) {
            let parent = this.offsetParent;
            if (parent){
                let houseBackgroundAspectRatio = this.house.naturalWidth / this.house.naturalHeight;

                let aspectRatio = parent.offsetWidth / parent.offsetHeight;
                if (aspectRatio < houseBackgroundAspectRatio){
                    this.house.style.width = "100%";
                    this.house.style.height = "auto";
                    this.homeDiv.style.width = "100%";
                    this.homeDiv.style.height = "auto";
                } else {
                    this.homeDiv.style.width = "auto";
                    this.homeDiv.style.height = "100%";
                    this.house.style.width = "auto";
                    this.house.style.height = "100%";
                }
            }
            await waitFrame();
        }
    }    

    updateHomeStyles() {
        const screenWidth = window.innerWidth;
        let images = document.querySelectorAll('#house img'); 
        let games = Array.from(images).slice(1, 5); 

        if (screenWidth < 1200) {
            for (const index in games) {
                games[index].styles = {
                    border: "solid 4px #466596"
                }
            }
        } else {
            for (const index in games) {
                games[index].styles = {
                    border: "solid 8px #466596"
                }
            }
        }
    }
}

class VolumeButton extends SvgPlus {
    constructor(app) {
        super("img");
        this.app = app;

        this.styles = {
            position: "relative",
            width: "64px", 
            height: "64px",
            "margin-bottom": "10px"
        }

        this.addEventListener('click', async() => {          
            if (await this.getMuted()) {
                app.set("muted", false);
            } else {
                app.set("muted", true);
            }
        })

        this.addEventListener('mouseover', () => {
            this.styles = {cursor: "pointer"};
        })
        this.addEventListener('mouseout', () => {
            this.styles = {cursor: "auto"};
        })
    }

    async getMuted() {
        let isMuted = await this.app.get("muted");
        return isMuted;
    }
}

class HomeButton extends SvgPlus {
    constructor(app) {
        super("img");

        this.props = {src: "http://127.0.0.1:5502/images/home.svg"};
        this.styles = {
            position: "relative",
            width: "64px", 
            height: "64px",
            "margin-bottom": "10px",
            "margin-right": "10px"
        }

        this.addEventListener('mouseover', () => {
            this.styles = {cursor: "pointer"};
        })
        this.addEventListener('mouseout', () => {
            this.styles = {cursor: "auto"};
        })
        this.addEventListener('click', () => {
            app.set("room", "home");
        })
    }
}

class BackButton extends SvgPlus {
    constructor(app) {
        super("img");

        this.props = {src: "http://127.0.0.1:5502/images/back.svg"};
        this.styles = {
            position: "relative",
            width: "64px", 
            height: "64px",
            "margin-bottom": "10px",
            "margin-right": "10px"
        }

        this.addEventListener('mouseover', () => {
            this.styles = {cursor: "pointer"};
        })
        this.addEventListener('mouseout', () => {
            this.styles = {cursor: "auto"};
        })
        this.addEventListener('click', () => {
            this.styles = {display: "none"};
            console.log("app set to levels")
            app.set("room", "levels");
        })
    }
}

class LevelScreen extends SvgPlus {
    constructor (app, isSender) {
        super("div");
        
        this.app = app;
        this.isSender = isSender;
        this.props = {id: "level-screen"};
        this.styles = {
            "width": "100%",
            "height": "100%",
            "margin-top": "15%",
            "overflow": "scroll"
        };

        this.gamesDiv = this.createChild("div", {
            styles: {
                display: "grid",
                "grid-template-columns": "repeat(3, 1fr)",
                gap: "50px",
                "justify-content": "center",
                "margin-left": "10em",
                "margin-right": "10em"
            }
        });

        this.createImage("http://127.0.0.1:5502/images/standard.svg", "Standard");
        this.createImage("http://127.0.0.1:5502/images/birthday.svg", "Birthday");
        this.createImage("http://127.0.0.1:5502/images/halloween.svg", "Halloween");
        this.createImage("http://127.0.0.1:5502/images/christmas.svg", "Christmas");

        window.addEventListener('resize', () => {
            this.updateGridStyles();
        });
    }

    createImage(path, game) {
        let imageDiv = this.gamesDiv.createChild("div");
        let image = imageDiv.createChild("img", {
            src: path,
            styles: {
                width: "100%",
                height: "auto",
                border: "solid 8px #466596"
            },
        })

        if (this.isSender) {
            image.addEventListener('click', () => {
                this.app.set("room", "game");
                this.app.set("level", game);
                // this.app.set("itemsOnScreen", itemPositions[game]);
                this.app.set("state", "reset");
                // this.app.set("prompt", "");
            });

            image.addEventListener('mouseover', () => {
                image.styles = {cursor: "pointer"};
            })
            image.addEventListener('mouseout', () => {
                image.styles = {cursor: "auto"};
            })
        }

        let name = imageDiv.createChild("p", {
            styles: {
                "font-family": "Arial, sans-serif",
                "font-size": "32px",
                "font-weight": "bold",
                "text-align": "center",
                "margin-top": "20px",
                "margin-bottom": "0"
            }    
        });
        name.textContent = game;
    }

    // Make grid scale with screen size
    updateGridStyles() {
        let columns;
        const screenWidth = window.innerWidth;

        if (screenWidth > 1650) { 
            document.getElementById('level-screen').style.marginTop = "15%"; 
            columns = "repeat(3, 1fr)";
        } else if (screenWidth > 1090 && screenWidth <= 1650) { 
            document.getElementById('level-screen').style.marginTop = "20%"; 
            columns = "repeat(2, 1fr)";
        } else {
            document.getElementById('level-screen').style.marginTop = "25%"; 
            columns = "repeat(1, 1fr)";
        }
        this.gamesDiv.style.gridTemplateColumns = columns;
    }
}

export default class TestApp extends SquidlyApp {
    constructor(isSender, initializer) {
        super(isSender, initializer);

        this.window = new MainWindow(isSender, this);
    }

    set eyeData(vector) {
        // console.log("vector", vector);
        this.window.eyePosition = vector;
    }

    getMainWindow() {
        return this.window;
    }

    static get name() {
        return "MyApp";
    }

    static get description() {
        return "Eye'm'Home";
    }

    static get appIcon() {
        let icon = new SvgPlus("img");
        icon.props = {src: "http://127.0.0.1:5502/images/icon.svg", styles: {width: "100%", height: "100%"}};
        return icon;
    }
}