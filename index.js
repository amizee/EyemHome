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
            // if (audio.muted) {
            //     this.src = "http://127.0.0.1:5502/images/volume.png";
            //     audio.muted = false;
            //     audio.load();
            //     audio.loop = true;
            //     audio.play();
            // } else {
            //     this.src = "http://127.0.0.1:5502/images/volume-mute.png";
            //     audio.muted = true;
            // }
            
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
    constructor(audio, app, volumeButton) {
        super("div");
        
        this.props = {id: "level-screen"};

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
        imageDiv.createChild("img", {
            src: path,
            styles: {
                width: "500px",
                height: "auto",
                border: "solid 8px #466596"
            }
        })

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