import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"

class BedroomWindow extends SvgPlus {
    constructor(editable, app){
        super ("div");
        this.app = app;
        this.styles = {
            "position":  "absolute"
        }
        // this.innerHTML = "hello";
        this.createChild("img", {src: "http://127.0.0.1:5502/images/icon.png", styles: {width: "100%", height: "100%"}});
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