import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"

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
        // this.storedItems = ["teddybear"]; // for testing purpose
        // create background image for the game window: maybe randomize the bedroom image generation later
        this.createChild("img", {src: "http://127.0.0.1:5502/images/room-interior.png", styles: {position: "relative", width: "100%", height: "100%"}});
        // this config should be stored in the database along with this background image, now it is fixed
        const itemPositions = {"teddybear": {"top":"53%", "left": "47%"}, "bag": {"top":"80%", "left": "73%"}, "books": {"top":"53%", "left": "27%"}, "clothes": {"top":"43%", "left": "70%"}, "clock": {"top":"20%", "left": "57%"}};
        // create items in the bedroom
        for (const [item, position] of Object.entries(itemPositions)){
            let itemImg = this.createChild("img", {src: `http://127.0.0.1:5502/images/${item}.png`, styles: {position: "absolute", top: position.top, left: position.left, width: "8%"}});
            itemImg.addEventListener("click", () => {
                // let originalLength = this.storedItems.length;
                // add fade out effect
                // change the logic later: should fade out after the item matches the correct answer
                // if (editable){
                //     // add items to the database

                //     // if (!(this.storedItems.includes(item))){
                //     //     this.storedItems.push(item);
                //     //     console.log(this.storedItems);
                //     // }
                // } else {
                //     // fade out only when selecting the correct item
                    
                //     // remove the item from the storedItems array
                //     const index = this.storedItems.indexOf(item);
                //     if (index > -1){
                //         this.storedItems.splice(index, 1);
                //         // this.fadeOutEffect(itemImg);
                //     } else {
                //         console.log("Incorrect item selected");
                //     }
                // }
                // if (this.storedItems.length < originalLength){
                //     this.fadeOutEffect(itemImg);
                // }
                this.fadeOutEffect(itemImg);
                
            });
        }
    }

    fadeOutEffect(element) {
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
}

export default class testApp extends SquidlyApp {
    constructor(isSender, initializer){
        super(isSender, initializer);

        this.window = new BedroomWindow(isSender, this);
    }

    getMainWindow(){
        return this.window;
    }

    get name(){
        return "MyApp"
    }

    get appIcon(){
        let icon = new SvgPlus("div");
        // appicon.createChild("img", {src: "http://127.0.0.1:5502/icon.png", styles: {width: "100%", height: "100%"}});
        // appicon.src = "https://127.0.0.1:5502/icon.png";
        icon.styles = {width: "100%", height: "100%", background: "red"}
        return icon;
    }
}