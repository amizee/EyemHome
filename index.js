import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"

const itemPositions = { 
    "Standard": [
        {"top":"53%", "left": "47%", "name":"teddybear"}, 
        {"top":"80%", "left": "73%", "name":"bag"}, 
        {"top":"53%", "left": "27%", "name":"books"}, 
        {"top":"43%", "left": "70%", "name":"clothes"}, 
        {"top":"20%", "left": "57%", "name":"clock"}
    ],
    "Birthday": [
        {"top":"53%", "left": "47%", "name":"teddybear"},
        {"top":"20%", "left": "47%", "name":"confetti-ball"},
        {"top":"80%", "left": "73%", "name":"gift"}, 
        {"top":"53%", "left": "27%", "name":"books"}, 
        {"top":"43%", "left": "70%", "name":"clothes"}, 
        {"top":"20%", "left": "57%", "name":"clock"}
    ],
    "Halloween": [
        {"top":"53%", "left": "47%", "name":"blackcat"}, 
        {"top":"80%", "left": "60%", "name":"Halloween Tree"}, 
        {"top":"49%", "left": "18%", "name":"witchhat"}, 
        {"top":"65%", "left": "80%", "name":"Broom"}, 
        {"top":"20%", "left": "57%", "name":"bat"},
        {"top":"80%", "left": "27%", "name":"Pumpkin"}, 
        {"top":"65%", "left": "25%", "name":"Candies"}
    ],
    "Christmas": [
        {"top":"53%", "left": "47%", "name":"santaclaus"}, 
        {"top":"80%", "left": "73%", "name":"elf"}, 
        {"top":"53%", "left": "27%", "name":"chicken"}, 
        {"top":"43%", "left": "70%", "name":"gingerbread"}, 
        {"top":"20%", "left": "37%", "name":"christmas socks"},
        {"top":"73%", "left": "27%", "name":"snowglobe"},
        {"top":"80%", "left": "15%", "name":"star"},
    ]
};

const backgroundAspectRatio = 1077/600;

async function waitFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(resolve);
    });
}

class Item extends SvgPlus {
    constructor(item) {
        super("img");
        this.props = {
            name: item.name, 
            src: `http://127.0.0.1:5502/images/${item.name}.svg`, 
            styles: {
                position: "absolute", 
                top: item.top, 
                left: item.left, 
                width: "8%"
            }
        }
        this.progress = 0;
        this.animate();
    }

    async animate() {
        while (true) {
            await waitFrame();
            if (!this.hover) {
                this.progress -= 0.003;
            } else {
                this.progress += 0.02;
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
        this.app.set("state", "init");


        this.eyebuffer = [];

        this.styles = {
            "position": "absolute",
            "display": "flex",
            "justify-content": "center", // Center horizontally
            "align-items": "center", // Center vertically
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
            if (itemsOnScreen){
                if (this.itemsOnScreen.length > itemsOnScreen.length){
                    // find the item that should be removed
                    let itemToRemove = this.itemsOnScreen.find(i => !itemsOnScreen.find(j => j.name === i.name));
                    this.fadeOutEffect(itemToRemove.name);
                    // remove the item from the correct items as well
                    // this.app.set("correctItems", this.correctItems.filter(i => i !== itemToRemove.name));

                }
                this.itemsOnScreen = itemsOnScreen;
            } else {
                this.itemsOnScreen = itemPositions[this.level];
            }
            
        });

        app.onValue("correctItems", (correctItems) => {
            console.log("onvalue correctItems");
            console.log(correctItems);
            if (this.correctItems){
                this.correctItems = correctItems;
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
            // this.state = state;
            console.log("onvalue state");
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
                    // this.background.style.width = "100%";
                    // this.background.style.height = "auto";
                } else {
                    this.style.width = "auto";
                    this.style.height = "100%";
                    if (this.background){
                        this.background.style.width = "auto";
                        this.background.style.height = "100%";
                    }
                    // this.background.style.width = "auto";
                    // this.background.style.height = "100%";
                }
            }
            await waitFrame();
        }
    }

    async getItemsOnScreen(){
        return await this.app.get("itemsOnScreen");
    }

    fadeOutEffect(element) {
        // try {
        //     throw new Error("This is an error");
        // } catch (error) {
        //     console.log(error.stack);
        // }
        if (typeof element === 'string') {
            element = this.querySelector(`[name=${element}]`);
        }
        let op = 1;  // initial opacity
        const timer = setInterval(function () {
            if (op <= 0.1) {
                clearInterval(timer);
                element.style.display = 'none'; //hide the element after fade out
            }
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ")";
            op -= op * 0.1;
        }, 50); // Adjust the interval for speed control
    }

    async setStateAsync(params){
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
        switch (params) {
            case null:
                this.app.set("state", "init");
                break;
            case "init":
                // set the itemsOnScreen to the database
                if (this.editable){
                    this.app.set("itemsOnScreen", this.itemsOnScreen);
                }
                // // clears everything
                // this.app.set("correctItems", []);
                // this.app.set("prompt", "");
                // this.app.set("itemsOnScreen", itemPositions[this.level]);
                // set the state to setup
                this.app.set("state", "setup");
                
                break;
            case "setup":
                this.correctItems = [];
                this.items.innerHTML = "";
                if (this.editable){
                    let selButton = document.getElementsByName("selectButton");
                    if (selButton.length > 0){
                        selButton[0].style.display = "block";
                    } else {
                        this.createChild("button", {name: "selectButton", content: "Select", styles: {position: "absolute", "font-size": "20px", bottom: "15%", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
                            if (this.correctItems.length === 0){
                                alert("Please select at least one item");
                                return;
                            }
                            console.log("set to play state", this.correctItems);
                            this.app.set("correctItems", this.correctItems);
                            this.app.set("state", "play");
                        });
                        this.createChild("button", {name: "resetButton", content: "&#8634;", styles: {position: "absolute", "font-size": "20px", bottom: "15%", left: "58%", transform: "translateX(-50%)", padding: "9px 15px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
                            console.log("reset");
                            this.app.set("prompt", "");
                            // this.app.set("itemsOnScreen", null);
                            this.app.set("itemsOnScreen", itemPositions[this.level]);
                            this.app.set("state", "init");
                        });
                    }
                    
                }
                // now instead of calling the itemPositions, we can call the itemsOnScreen from the database
                console.log("setup: print the itemsOnScreen", itemsOnScreen);
                for (const item of itemsOnScreen) {

                    let itemImg = this.items.createChild(Item, {}, item);
                    
                    if (this.editable){
                        itemImg.addEventListener("click", () => {
                            // select/deselect the item
                            const itemIndex = this.correctItems.indexOf(item.name);
                            if (itemIndex > -1){
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
                this.app.set("prompt", `Select the ${this.correctItems[0].toUpperCase()}`);
                // no need to set promptWindow here as the prompt is already set in onValue listener
                // instead of calling the itemPositions, we can call the itemsOnScreen from the database
                for (const item of this.itemsOnScreen) {
                    let itemImg = this.items.createChild(Item, {}, item);
                    if (!this.editable) {
                        itemImg.addEventListener("click", () => {
                            let currentItem = this.correctItems[0];
                            if (item.name !== currentItem) {
                                this.app.set("prompt", `Try again! This is not the ${currentItem.toUpperCase()}`);
                            } else {
                                this.effect.load();
                                this.effect.play();
                                // remove the item from the screen
                                this.app.set("itemsOnScreen", [...this.itemsOnScreen].filter(i => i.name !== item.name));
                                // remove the item from the correct items

                                this.app.set("correctItems", this.correctItems.slice(1));
                                // if correct items are empty, set the state to end
                                if (!this.correctItems){
                                    this.app.set("state", "end");
                                } else {
                                    // update the prompt
                                    this.app.set("prompt", `Select the ${this.correctItems[0].toUpperCase()}`);
                                }
                            }
                        });  
                    }
                }
                break;

            case "end":
                // disable all the items
                console.log("Case end");
                this.app.set("prompt", "Congratulations!");
                this.items.querySelectorAll("img").forEach(item => {
                    item.style.pointerEvents = "none";
                });
                break;
        
            default:
                break;
        }
    }

    checkVectorOnItem(vector) {
        let x = vector.x;
        let y = vector.y;
        let items = this.items.children;
        for (let i = 0; i < items.length; i++){
            let item = items[i];
            let rect = item.getBoundingClientRect();
            if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom){
                return item;
            }
        }
        return null;
    }

    set eyePosition(vector) {
        // console.log(vector);
        // console.log(this.eyebuffer);

        let item = this.checkVectorOnItem(vector);
        console.log("item: ", item);
        [...this.items.children].forEach(i => {
            i.hover = false;
        });
        if (item){
            // console.log(item);
            // item.click();
            item.hover = true;

        }
        
        // console.log(x, y);
        // this.style.transform = `translate(${x}%, ${y}%)`;
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
        this.homeDiv = homeDiv;
        let house = homeDiv.createChild("img", {
            src: "http://127.0.0.1:5502/images/house.png", 
            styles: {
                "object-fit": "contain", 
                "width":"100%", 
                "height":"100%"
        }});
        this.house = house;
        let bedroom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/SightnSeek.svg", 
            styles: {
                position: "absolute",
                height: "20%",
                top: "35.5%",
                right: "33.7%",
                border: "solid 8px #466596"
            }
        });
        let kitchen = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/EyeSpell.svg", 
            styles: {
                position: "absolute",
                height: "20%",
                top: "67%",
                right: "33.7%",
                border: "solid 8px #466596"
            }
        });
        let musicRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/PianoTrials.svg", 
            styles: {
                position: "absolute",
                height: "20%",
                top: "35.5%",
                right: "9.7%",
                border: "solid 8px #466596"
            }
        });
        let artRoom = homeDiv.createChild("img", { 
            src: "http://127.0.0.1:5502/images/EyePaint.svg", 
            styles: {
                position: "absolute",
                height: "20%",
                top: "67%",
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

        bedroom.addEventListener('mouseover', () => {
            bedroom.styles = {cursor: "pointer"};
        })
        bedroom.addEventListener('mouseout', () => {
            bedroom.styles = {cursor: "auto"};
        })
        
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

        let hoverTimer;
        bedroom.addEventListener('mouseenter', function(e) {
            let progressBar = new ProgressBar(e);
            progressBar.props = {class: "progress-bar"};
            document.body.appendChild(progressBar);
            progressBar.animate();
            hoverTimer = setTimeout(() => {
                app.set("room", "levels");
            }, 1000);
        });

        bedroom.addEventListener('mouseleave', function() {
            let progressBars = document.querySelectorAll('.progress-bar');
            for (let i = 0; i < progressBars.length; i++) {
                progressBars[i].remove();
            };
            clearTimeout(hoverTimer);
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
                let backgroundAspectRatio2 = this.house.naturalWidth / this.house.naturalHeight;

                let aspectRatio = parent.offsetWidth / parent.offsetHeight;
                if (aspectRatio < backgroundAspectRatio2){
                    this.house.style.width = "100%";
                    this.house.style.height = "auto";
                    this.homeDiv.style.width = "100%";
                    this.homeDiv.style.height = "auto";
                    // this.background.style.width = "100%";
                    // this.background.style.height = "auto";
                } else {
                    this.homeDiv.style.width = "auto";
                    this.homeDiv.style.height = "100%";
                    this.house.style.width = "auto";
                    this.house.style.height = "100%";
                    // this.background.style.width = "auto";
                    // this.background.style.height = "100%";
                }
            }
            await waitFrame();
        }
    }    
}

class ProgressBar extends SvgPlus {
    constructor(e) {
        super("div");

        this.styles = {
            position: "absolute",
            left: e.clientX + "px",
            top: e.clientY + "px",
            width: "75px",
            height: "75px",
            "border-radius": "50%",
            background: "radial-gradient(closest-side, white 69%, transparent 70% 100%), conic-gradient(limegreen calc(var(--progress-value) * 1%), lightgreen 0)",
        }
    }

    animate() {
        let progressValue = 0;
        // Increment progress every 10 milliseconds
        let interval = setInterval(() => {
            if (progressValue >= 100) {
                clearInterval(interval);
            } else {
                progressValue++;
                this.style.setProperty('--progress-value', progressValue);
            }
        }, 10);
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
            "object-fit": "contain",
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
            }
        })

        if (this.isSender) {
            image.addEventListener('click', () => {
                this.app.set("room", "game");
                this.app.set("level", game);
                this.app.set("itemsOnScreen", null);
                this.app.set("itemsOnScreen", itemPositions[game]);
                this.app.set("state", "init");
                this.app.set("prompt", "");
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
            columns = "repeat(3, 1fr)";
        } else if (screenWidth > 1090 && screenWidth <= 1650) { 
            document.getElementById('level-screen').style.marginTop = "20%"; 
            columns = "repeat(2, 1fr)";
        } else {
            document.getElementById('level-screen').style.marginTop = "30%"; 
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