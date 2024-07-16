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

        // an array of stored items from the clinician's choice
        // create background image for the game window: maybe randomize the bedroom image generation later
        this.createChild("img", {src: "http://127.0.0.1:5502/images/room-interior.png", styles: {position: "relative", width: "100%", height: "100%"}});

        this.items = this.createChild("div");

        this.editable = editable;

        this.state = "setup";
        // this.state = "play";

        this.singleSelectedItem = "";
        

        // this config should be stored in the database along with this background image, now it is fixed
         // add url
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
                
                
                // this.singleSelectedItem = singleSelectedItem;
            });
        }
            
            

        // create items in the bedroom
        
    }

    fadeOutEffect(element) {
        try {
            throw new Error("This is an error");
        } catch (error) {
            console.log(error.stack);
        }
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
                for (const [item, position] of Object.entries(itemPositions)){
                    
                    let itemImg = this.items.createChild("img", {name: item,src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
                    
                    if (this.editable){
                        itemImg.addEventListener("click", () => {
                            this.correctItems.push(item);
                            console.log(this.correctItems);
                            // this.correctItems = [...this.correctItems, item];
                           
                            // this.fadeOutEffect(itemImg); // fade out 50%
                            // highlight the selected item instead
                            itemImg.style.border = "2px solid yellow";
                        });
                        
                    }
                   
                }
                if (this.editable){
                    this.createChild("button", {content: "Submit", styles: {position: "absolute", bottom: "5%", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "yellow", color: "white", border: "none", borderRadius: "5px"}}).addEventListener("click", () => {
                        console.log("set to play state", this.correctItems);
                        this.app.set("correctItems", this.correctItems);
                        this.app.set("state", "play");
                        this.state = "play";
                        console.log("play");
                        // this.correctItems.forEach(item => {
                        //     this.fadeOutEffect(item);
                        // });
                        // console.log(this.getItems())
                    });
                }
                    
                
                break;

            case "play":
                // this.correctItems = ["clothes", "clock", "teddybear"];
                console.log("play: print the correctItems");
                console.log(this.correctItems);

                // this.selectedItems = [];
                this.items.innerHTML = "";
                this.currentItem = this.correctItems[0];
                console.log("shifted item");
                console.log(this.correctItems);
                console.log(this.currentItem);
                this.promptWindow = this.createChild("div", {content: `Select the ${this.currentItem}`, styles: {position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", fontSize: "20px"}});
                for (const [item, position] of Object.entries(itemPositions)){
                    
                    let itemImg = this.items.createChild("img", {name: item, src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
                    if (!this.editable){
                        itemImg.addEventListener("click", () => {
                            // record the single selected item and move to the validation state
                            if (item === this.currentItem){
                                // console.log("print out the correct items right now");
                                // console.log(this.correctItems);
                                console.log("correct item: ");
                                console.log(this.correctItems);
                                this.singleSelectedItem = item;
                                this.app.set("singleSelectedItem", this.singleSelectedItem);
                                // fade out the item on the participant's side
                                this.fadeOutEffect(itemImg);
                                // change the prompt to the next item
                                // console.log("start doing next item");
                                if (this.correctItems.length > 0){
                                    this.correctItems.shift();
                                    this.currentItem = this.correctItems[0];
                                    this.promptWindow.textContent = `Select the ${this.currentItem}`;
                                } 
                                // else {
                                //     console.log("end");
                                //     this.app.set("state", "end");
                                // }
                            }
                        });  
                    }
                }
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
        let x = average.x * 100;
        let y = average.y * 100;

        let item = this.checkVectorOnItem(average);
        console.log(item);
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