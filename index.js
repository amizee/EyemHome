import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"


const itemPositions = {
    "teddybear": {"top":"53%", "left": "47%"}, 
    "bag": {"top":"80%", "left": "73%"}, 
    "books": {"top":"53%", "left": "27%"}, 
    "clothes": {"top":"43%", "left": "70%"}, 
    "clock": {"top":"20%", "left": "57%"}
};

class BedroomWindow extends SvgPlus {
    constructor(editable, app){
        super ("div");
        this.app = app;

        this.eyebuffer = [];

        this.styles = {
            "position": "absolute",
            "display": "flex", // Use Flexbox
            "justify-content": "center", // Center horizontally
            "align-items": "center", // Center vertically
            "width": "80%", // Ensure the parent has a defined width
            "height": "80%", // Ensure the parent has a defined height
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -50%)"
        }

        // create background image for the game window: maybe randomize the bedroom image generation later
        this.createChild("img", {src: "http://127.0.0.1:5502/images/room-interior.png", styles: {position: "relative", width: "100%", height: "100%"}});

        this.items = this.createChild("div");
        this.editable = editable;
        this.state = "setup";
        app.set("state", "setup");
        this.singleSelectedItem = "";
        app.set("singleSelectedItem", null);
        this.correctItems = [];
        this.selectedItems = [];

        if (!editable){
            console.log("participant onValue listener")
            app.onValue("correctItems", (correct_items) =>{
                console.log("correct items", correct_items);
                this.correctItems = correct_items;
                console.log(this.correctItems);
            });
            app.onValue("state", (state) => {
                this.state = state;
            });
        } else {
            app.onValue("singleSelectedItem", (singleSelectedItem) => {
                // get the correct items from the clinician
                console.log("single selected item");
                console.log(singleSelectedItem);
                // fade out the item on clinician's side
                if (singleSelectedItem) {
                    this.fadeOutEffect(singleSelectedItem);
                }
            });
            app.onValue("prompt", (prompt) => {
                console.log("onvalue prompt");
                if (this.promptWindow) {
                    this.promptWindow.textContent = prompt;
                }
            });
        }
    }

    fadeOutEffect(element) {
        // try {
        //     throw new Error("This is an error");
        // } catch (error) {
        //     console.log(error.stack);
        // }
        console.log("fade out effect triggered");
        console.log(element);
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
        console.log("fade out effect ended");
    }

    set state(params){
        switch (params) {
            case "setup":
                this.correctItems = [];
                this.items.innerHTML = "";
                if (this.editable){
                    let selButton = document.getElementsByName("selectButton");
                    if (selButton.length > 0){
                        selButton[0].style.display = "block";
                    } else {
                        this.createChild("button", {name: "selectButton", content: "Select", styles: {position: "absolute", bottom: "5%", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
                            if (this.correctItems.length === 0){
                                alert("Please select at least one item");
                                return;
                            }
                            console.log("set to play state", this.correctItems);
                            this.app.set("correctItems", this.correctItems);
                            this.app.set("state", "play");
                            this.state = "play";
                        });
                    }
                    
                }
                for (const [item, position] of Object.entries(itemPositions)){
                    
                    let itemImg = this.items.createChild("img", {name: item,src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
                    
                    if (this.editable){
                        itemImg.addEventListener("click", () => {
                            // select/deselect the item
                            const itemIndex = this.correctItems.indexOf(item);
                            if (itemIndex > -1){
                                this.correctItems.splice(itemIndex, 1);
                                console.log(this.correctItems);
                                itemImg.style.border = "";
                            } else {
                                this.correctItems.push(item);
                                console.log(this.correctItems);
                                // highlight the selected item
                                itemImg.style.border = "2px solid yellow";
                            }
                        });
                    }
                }
                break;

            case "play":
                console.log("play: print the correctItems");
                console.log(this.correctItems);
                this.items.innerHTML = "";
                this.currentItem = this.correctItems[0];
                console.log("first item in the correct item list");
                console.log(this.correctItems);
                console.log(this.currentItem);
                this.promptWindow = this.createChild("div", {content: `Select the ${this.currentItem.toUpperCase()}`, styles: {position: "absolute", top: "0%", left: "50%", transform: "translateX(-50%)", "font-size": "30px"}});
                for (const [item, position] of Object.entries(itemPositions)){
                    
                    let itemImg = this.items.createChild("img", {name: item, src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
                    if (!this.editable){
                        itemImg.addEventListener("click", () => {
                            // correct item selected
                            if (item === this.currentItem){
                                console.log("correct item: ");
                                console.log(this.correctItems);
                                this.singleSelectedItem = item;
                                this.app.set("singleSelectedItem", this.singleSelectedItem);
                                // fade out the item on the participant's side
                                this.fadeOutEffect(itemImg);
                                // change the prompt to the next item
                                if (this.correctItems.length >= 1){
                                    this.correctItems.shift(); // Remove the selected item
                                    if (this.correctItems.length > 0) {
                                        // If there are more items, update the prompt to the next item
                                        this.currentItem = this.correctItems[0];
                                        this.promptWindow.textContent = `Select the ${this.currentItem.toUpperCase()}`;
                                        this.app.set("prompt", `Select the ${this.currentItem.toUpperCase()}`);
                                    } else {
                                        // Handle the case when no more items are left to select
                                        console.log("end");
                                        this.app.set("state", "end");
                                    }
                                }
                            } else {
                                // set the prompt to the database
                                this.app.set("prompt", `Try again! This is not the ${this.currentItem.toUpperCase()}`);
                                this.promptWindow.textContent = `Try again! This is not the ${this.currentItem.toUpperCase()}`;
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
                this.promptWindow.textContent = "Congratulations!";
                document.getElementsByName("selectButton")[0].style.display = "none";
                break;
        
            default:
                break;
        }
    }

    checkVectorOnItem(vector){
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

    set eyePosition(vector){
        this.eyebuffer.push(vector);
        if (this.eyebuffer.length > 10){
            this.eyebuffer.shift();
        }
        // console.log(this.eyebuffer);
        let average = this.eyebuffer.reduce((a, b) => a.add(b)).div(this.eyebuffer.length);
        console.log(average);

        let item = this.checkVectorOnItem(average);
        console.log(item);
        if (item){
            item.click();
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
            "width": "80%",
            "height": "80%",
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -50%)"
        }

        let audio = this.createChild("audio", {src: "http://127.0.0.1:5502/sounds/home.mp3"});
        app.set("muted", true);

        app.onValue("muted", (value) => {
            let volumeButtons = document.querySelectorAll('.volume-button');
            if (value) {
                // Mute logic
                volumeButtons.forEach((button) => {
                    button.props = {src: "http://127.0.0.1:5502/images/volume-mute.png"}
                })
                audio.muted = true;
            } else {
                // Unmute logic
                volumeButtons.forEach((button) => {
                    button.props = {src: "http://127.0.0.1:5502/images/volume.png"}
                })
                audio.muted = false;
                audio.load();
                audio.loop = true;
                audio.play();
            }
        });

        this.mainDiv = this;
        let homeDiv = this.createChild("div", {styles: {position: "relative"}});
        let volumeButton = new VolumeButton(audio, app); // Some sort of toolbar?
        volumeButton.styles = {
            position: "absolute",
            top: "-6%",
            right: "3%"
        }
        volumeButton.props = {class: "volume-button"};
        homeDiv.appendChild(volumeButton);

        let house = this.createChild("img", {src: "http://127.0.0.1:5502/images/house.png"}); // To stack properly, have to use media queries, fixed size for house or cover the windows completely  
        let bedroom = this.createChild("img", { 
            src: "http://127.0.0.1:5502/images/bedroom.png", 
            styles: {
                position: "absolute",
                height: "20%",
                top: "67%",
                right: "33.7%",
                border: "solid 8px #466596"
            }
        });

        homeDiv.appendChild(house);
        homeDiv.appendChild(bedroom);
        app.set("room", "home"); // Reload goes to home page
        homeDiv.styles = {display: "block"};

        bedroom.addEventListener('mouseover', () => {
            bedroom.styles = {cursor: "pointer"};
        })
        bedroom.addEventListener('mouseout', () => {
            bedroom.styles = {cursor: "auto"};
        })
        
        app.onValue("room", (value) => { // Triggers once immediately after the listener is attached, to provide the current value of the data
            if (value === "home") {
                homeDiv.styles = {display: "block"};
                this.levelScreen = document.getElementById('level-screen');
                if (this.levelScreen) {
                    this.levelScreen.styles = {display: "none"};
                }
            }
            else if (value === "levels") {
                homeDiv.styles = {display: "none"};

                this.levelScreen = document.getElementById('level-screen');
                if (!this.levelScreen) {
                    this.levelScreen = new LevelScreen(audio, app);
                    this.mainDiv.appendChild(this.levelScreen);
                } else {
                    this.levelScreen.styles = {display: "block"};
                }
            } else if (value === "game") {
                this.levelScreen = document.getElementById('level-screen');
                if (this.levelScreen) {
                    this.levelScreen.styles = {display: "none"};
                }
                let bedroom = new BedroomWindow(isSender, app);
                this.mainDiv.appendChild(bedroom);
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
    constructor(audio, app) {
        super("img");
        this.app = app;

        if (this.getMuted()) {
            this.props = {src: "http://127.0.0.1:5502/images/volume-mute.png"};
        } else {
            this.props = {src: "http://127.0.0.1:5502/images/volume.png"};
        }
    
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

        this.props = {src: "http://127.0.0.1:5502/images/home.png"};
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

class LevelScreen extends SvgPlus {
    constructor(audio, app) {
        super("div");
        
        this.props = {id: "level-screen"};
        this.app = app;

        let buttonRow = this.createChild("div");
        let volButton = new VolumeButton(audio, app);
        volButton.props = {class: "volume-button"};
        buttonRow.appendChild(new HomeButton(app));
        buttonRow.appendChild(volButton);

        this.gamesDiv = this.createChild("div", {
            styles: {
                display: "grid",
                "grid-template-columns": "repeat(3, 500px)",
                gap: "50px",
                "justify-content": "center"
            }
        });

        this.createImage("http://127.0.0.1:5502/images/standard.png", "Standard");
        this.createImage("http://127.0.0.1:5502/images/birthday.png", "Birthday");
        this.createImage("http://127.0.0.1:5502/images/halloween.png", "Halloween");
        this.createImage("http://127.0.0.1:5502/images/christmas.png", "Christmas");
    }

    createImage(path, game) {
        let imageDiv = this.gamesDiv.createChild("div");
        let image = imageDiv.createChild("img", {
            src: path,
            styles: {
                width: "500px",
                height: "auto",
                border: "solid 8px #466596"
            }
        })

        image.addEventListener('click', () => {
            this.app.set("room", "game");
        });

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
}

export default class TestApp extends SquidlyApp {
    constructor(isSender, initializer){
        super(isSender, initializer);

        this.window = new MainWindow(isSender, this);
    }

    setEyeData(vector){
        this.window.eyePosition = vector;
    }

    getMainWindow() {
        return this.window;
    }

    static get name() {
        return "MyApp";
    }

    static get appIcon() {
        let icon = new SvgPlus("img");
        icon.props = {src: "http://127.0.0.1:5502/images/icon.png", styles: {width: "100%", height: "100%"}};
        return icon;
    }
}