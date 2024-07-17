import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"


const itemPositions = {"teddybear": {"top":"53%", "left": "47%"}, "bag": {"top":"80%", "left": "73%"}, "books": {"top":"53%", "left": "27%"}, "clothes": {"top":"43%", "left": "70%"}, "clock": {"top":"20%", "left": "57%"}};

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
                    this.createChild("button", {content: "Select", styles: {position: "absolute", bottom: "5%", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "#FFCC00", color: "white", border: "2px solid #CC9900", "border-radius": "5px"}}).addEventListener("click", () => {
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

export default class testApp extends SquidlyApp {
    constructor(isSender, initializer){
        super(isSender, initializer);

        this.window = new BedroomWindow(isSender, this);
    }

    setEyeData(vector){
        this.window.eyePosition = vector;
    }

    getMainWindow(){
        return this.window;
    }

    static get name(){
        return "MyApp"
    }

    static get appIcon(){
        let icon = new SvgPlus("div");
        // appicon.createChild("img", {src: "http://127.0.0.1:5502/icon.png", styles: {width: "100%", height: "100%"}});
        // appicon.src = "https://127.0.0.1:5502/icon.png";
        icon.styles = {width: "100%", height: "100%", background: "red"}
        return icon;
    }
}