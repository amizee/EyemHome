import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"


const itemPositions = {"teddybear": {"top":"53%", "left": "47%"}, "bag": {"top":"80%", "left": "73%"}, "books": {"top":"53%", "left": "27%"}, "clothes": {"top":"43%", "left": "70%"}, "clock": {"top":"20%", "left": "57%"}};

class BedroomWindow extends SvgPlus {
    constructor(editable, app){
        super ("div");
        this.app = app;
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
        

        // this config should be stored in the database along with this background image, now it is fixed
         // add url
        this.correctItems = [];

        // 
        // app.onValue("selectedItems", (selectedItems) => {
            

        // app.onValue("correctItems", (correctItems) => {
        //     if (editable){
        //         correctItems.forEach(item => {
        //             if (!this.correctItems.includes(item)){
        //                 this.correctItems.push(item);
        //                 // fade out the item
        //                 this.fadeOutEffect(item);
        //             }
        //         });
        //     } else {
        //         this.correctItems = correctItems;
        //     }
        // });

        // create items in the bedroom
        
    }

    fadeOutEffect(element) {
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
                            this.app.set("correctItems", this.correctItems);
                            // this.fadeOutEffect(itemImg); // fade out 50%
                            // highlight the selected item instead
                        });
                        
                    }
                   
                }
                if (this.editable){
                    this.createChild("button", {textContent: "Submit", styles: {position: "absolute", bottom: "5%", left: "50%", transform: "translateX(-50%)", padding: "10px 20px", background: "blue", color: "white", border: "none", borderRadius: "5px"}}).addEventListener("click", () => {
                        this.app.set("state", "play");
                    });
                }
                    
                
                break;

            case "play":
                this.selectedItems = [];
                this.items.innerHTML = "";
                this.currentItem = this.correctItems.shift();
                
                this.promptWindow = this.createChild("div", {content: `Select the ${this.currentItem}`, styles: {position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", fontSize: "20px"}});
                for (const [item, position] of Object.entries(itemPositions)){
                    
                    let itemImg = this.items.createChild("img", {name: item,src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
                    
                    if (!this.editable){
                        itemImg.addEventListener("click", () => {
                            if (this.currentItem === item){
                                this.currentItem = this.correctItems.shift();
                                this.promptWindow.textContent = `Select the ${this.currentItem}`;


                            } else {
                                // show error message
                                this.promptWindow.textContent = `Incorrect. Select the ${this.currentItem}`;
                            }
                            this.selectedItems.push(item);
                            app.set("selectedItems", this.selectedItems);
                            this.fadeOutEffect(itemImg); // fade out 50%
                        });
                        
                    }
                   
                }
                break;

        
            default:
                break;
        }
    }
}

export default class testApp extends SquidlyApp {
    constructor(isSender, initializer){
        super(isSender, initializer);

        this.window = new BedroomWindow(isSender, this);
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