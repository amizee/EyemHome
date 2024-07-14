import {SvgPlus, SquidlyApp} from "https://session-app.squidly.com.au/src/Apps/app-class.js"

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

        let homeDiv = this.createChild("div", {styles: {position: "relative"}});
        let volumeButton = new VolumeButton(audio); // Some sort of toolbar?
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

        bedroom.addEventListener('mouseover', () => {
            bedroom.styles = {cursor: "pointer"};
        })
        bedroom.addEventListener('mouseout', () => {
            bedroom.styles = {cursor: "auto"};
        })
        
        app.onValue("room", (value) => { // Triggers once immediately after the listener is attached, to provide the current value of the data
            if (value === "home") {
                homeDiv.styles = {display: "block"}
            }
            else if (value === "levels") {
                homeDiv.styles = {display: "none"};
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
    constructor(audio) {
        super("img");

        this.props = {src: "http://127.0.0.1:5502/images/volume-mute.png"};
        this.styles = {
            position: "absolute",
            width: "64px", 
            height: "64px",
            top: "-6%",
            right: "3%"
        }

        this.addEventListener('click', function() {
            if (audio.muted) {
                this.src = "http://127.0.0.1:5502/images/volume.png";
                audio.muted = false;
                audio.load();
                audio.loop = true;
                audio.play();
            } else {
                this.src = "http://127.0.0.1:5502/images/volume-mute.png";
                audio.muted = true;
            }
        })

        this.addEventListener('mouseover', () => {
            this.styles = {cursor: "pointer"};
        })
        this.addEventListener('mouseout', () => {
            this.styles = {cursor: "auto"};
        })
    }
}

export default class TestApp extends SquidlyApp {
    constructor(isSender, initializer){
        super(isSender, initializer);

        this.window = new MainWindow(isSender, this);
    }

    getMainWindow() {
        return this.window;
    }

    static get name() {
        return "MyApp"
    }

    static get appIcon() {
        let icon = new SvgPlus("img");
        icon.props = {src: "http://127.0.0.1:5502/images/icon.png", styles: {width: "100%", height: "100%"}};
        return icon;
    }
}