import React from "react";
import moment from "moment";
import {Alert, Button} from "antd";
import {ChatContainer, ConversationHeader, MainContainer, Message, MessageInput, MessageList} from "@chatscope/chat-ui-kit-react";
import {renderText} from "./ChatMessageRender";
import i18next from "i18next";
import * as Setting from "./Setting";
import copy from "copy-to-clipboard";
import * as Conf from "./Conf";
import "./LiveChatBox.css";
import {ThemeDefault} from "./Conf";
import ChatPrompts from "./ChatPrompts";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Water} from "three/examples/jsm/objects/Water2";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader";

class LiveChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    };
    this.copyFileName = null;
    this.mountRef = React.createRef();
    this.inputImage = React.createRef();
    this.mixer = null;
    this.actions = {};
    this.clock = new THREE.Clock();
    this.lastPropsUpdateTime = Date.now();
    this.shouldAnim = false;
    this.currentAnim = "idle";
  }

  handleSend = (innerHtml) => {
    if (this.state.value === "" || this.props.disableInput) {
      return;
    }
    const newValue = this.state.value.replace(/<img src="([^"]*)" alt="([^"]*)" width="(\d+)" height="(\d+)" data-original-width="(\d+)" data-original-height="(\d+)">/g, (match, src, alt, width, height, scaledWidth, scaledHeight) => {
      return `<img src="${src}" alt="${alt}" width="${scaledWidth}" height="${scaledHeight}">`;
    });
    const date = moment();
    const dateString = date.format("YYYYMMDD_HHmmss");

    let fileName = "";
    if (this.inputImage.files[0]) {
      fileName = this.inputImage.files[0].name;
    } else if (this.copyFileName) {
      const fileExtension = this.copyFileName.match(/\..+$/)[0];
      fileName = dateString + fileExtension;
      this.copyFileName = null;
    }
    this.props.sendMessage(newValue, fileName);
    this.setState({value: ""});
    this.shouldAnim = true;
  };

  handleRegenerate = () => {
    const lastUserMessage = this.props.messages.reverse().find(message => message.author !== "AI");
    this.props.sendMessage(lastUserMessage.text, "", true);
  };

  handleImageClick = () => {
    this.inputImage.click();
  };

  handleInputChange = async(file) => {
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;
          const inputMaxWidth = 70;
          const chatMaxWidth = 600;
          let Ratio = 1;
          if (originalWidth > inputMaxWidth) {
            Ratio = inputMaxWidth / originalWidth;
          }
          const scaledWidth = Math.round(originalWidth * Ratio);
          const scaledHeight = Math.round(originalHeight * Ratio);
          if (originalWidth > chatMaxWidth) {
            Ratio = chatMaxWidth / originalWidth;
          }
          const chatScaledWidth = Math.round(originalWidth * Ratio);
          const chatScaledHeight = Math.round(originalHeight * Ratio);
          this.setState({
            value: this.state.value + `<img src="${img.src}" alt="${img.alt}" width="${scaledWidth}" height="${scaledHeight}" data-original-width="${chatScaledWidth}" data-original-height="${chatScaledHeight}">`,
          });
        };
        img.src = e.target.result;
      };
    } else {
      reader.onload = (e) => {
        this.setState({
          value: this.state.value + `<a href="${e.target.result}" target="_blank">${file.name}</a>`,
        });
      };
    }
    reader.readAsDataURL(file);
  };

  renderMessageContent = (message, isLastMessage) => {
    if (message.errorText !== "") {
      const refinedErrorText = Setting.getRefinedErrorText(message.errorText);
      return (
        <Alert
          message={refinedErrorText}
          description={message.errorText}
          type="error"
          showIcon
          action={
            <Button type={"primary"} onClick={this.handleRegenerate}>
              {i18next.t("general:Regenerate Answer")}
            </Button>
          }
        />
      );
    }
    if (message.text === "" && message.author === "AI") {
      return this.props.dots;
    }

    if (isLastMessage) {
      this.agentTalk();
      return renderText(message.text + this.props.dots);
    }
    if (this.shouldAnim === false) {
      this.agentIdle();
    }
    return message.html;
  };

  copyMessageFromHTML(message) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = message;
    const text = tempElement.innerText;
    copy(text);
    Setting.showMessage("success", "Message copied successfully");
  }

  likeMessage() {
    Setting.showMessage("success", "Message liked successfully");
  }

  dislikeMessage() {
    Setting.showMessage("success", "Message disliked successfully");
  }

  componentDidMount() {
    this.scene = new THREE.Scene();
    this.scene.castShadow = true;
    this.scene.receiveShadow = true;
    this.scene.fog = new THREE.Fog("#cce0ff", 5, 500);
    const canvas = document.getElementById("canvas");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    let agent, skeleton;
    let idleAction, greetingAction, talkAction_1, talkAction_2, talkAction_3, talkAction_4, thinkAction;

    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      2000
    );

    this.camera.position.set(-7, 7, 49);
    this.camera.lookAt(0, 0, 0);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.outputEncoding = THREE.SRGBColorSpace;
    this.renderer.setSize(width, height);

    window.addEventListener("resize", () => {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix;
      this.renderer.setSize(width, height);
    });
    this.mountRef.current.appendChild(this.renderer.domElement);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    this.animate = () => {
      controls.update();
      const delta = this.clock.getDelta();
      if (this.mixer) {this.mixer.update(delta);}
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(this.animate);
    };

    this.animate();

    const texture = new THREE.TextureLoader().load(process.env.PUBLIC_URL + "/assets/textures/skysphere/Sky_horiz_1.jpg");

    const skyGeometry = new THREE.SphereGeometry(500, 60, 60);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    });
    skyGeometry.scale(1, 1, -1);
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    const waterGeometry = new THREE.CircleGeometry(300, 64);
    const water = new Water(waterGeometry, {
      normalMap0: new THREE.TextureLoader().load(process.env.PUBLIC_URL + "/assets/textures/water/water_normal_0.jpeg", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.1, 0.1);
      }),
      normalMap1: new THREE.TextureLoader().load(process.env.PUBLIC_URL + "/assets/textures/water/water_normal_1.jpeg", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.1, 0.1);
      }),
      textureWidth: 1024,
      textureHeight: 1024,
      color: "#eeeeff",
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      distortionScale: 3.7,
      flowDirection: new THREE.Vector2(1, 1),
      scale: 2,
      fog: this.scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    this.scene.add(water);

    const islandLoader = new GLTFLoader();
    const islandDracoLoader = new DRACOLoader();
    islandDracoLoader.setDecoderPath(process.env.PUBLIC_URL + "./assets/draco");
    islandLoader.setDRACOLoader(islandDracoLoader);

    islandLoader.load(process.env.PUBLIC_URL + "./assets/models/island.glb", (gltf) => {
      const island = gltf.scene;
      island.scale.set(30, 30, 30);
      island.position.set(0, -0.5, 0);
      this.scene.add(island);
    });

    const agentLoader = new GLTFLoader();
    const agentDracoLoader = new DRACOLoader();
    agentDracoLoader.setDecoderPath(process.env.PUBLIC_URL + "./assets/draco");
    agentLoader.setDRACOLoader(agentDracoLoader);

    agentLoader.load(process.env.PUBLIC_URL + "./assets/models/agent.glb", (gltf) => {
      agent = gltf.scene;
      this.scene.add(agent);
      agent.traverse(function(object) {
        if (object.isMesh) {object.castShadow = true;}
      });
      agent.position.set(-6, 1.5, 45);
      agent.scale.set(4, 4, 4);
      skeleton = new THREE.SkeletonHelper(agent);
      skeleton.visible = false;
      this.scene.add(skeleton);

      const animations = gltf.animations;
      this.mixer = new THREE.AnimationMixer(agent);

      greetingAction = this.mixer.clipAction(animations[0]);
      idleAction = this.mixer.clipAction(animations[2]);
      talkAction_1 = this.mixer.clipAction(animations[3]);
      talkAction_2 = this.mixer.clipAction(animations[4]);
      talkAction_3 = this.mixer.clipAction(animations[5]);
      talkAction_4 = this.mixer.clipAction(animations[6]);
      thinkAction = this.mixer.clipAction(animations[7]);

      this.actions = {
        greeting: greetingAction,
        idle: idleAction,
        talk1: talkAction_1,
        talk2: talkAction_2,
        talk3: talkAction_3,
        talk4: talkAction_4,
        think: thinkAction,
      };
      this.actions.idle.play();
    });

    const hdrLoader = new RGBELoader();
    hdrLoader.loadAsync(process.env.PUBLIC_URL + "./assets/textures/skysphere/skyHDR.hdr"). then((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
    });

    this.intervalId = setInterval(() => {
      this.changeState();
    }, 1000);
  }

  componentWillUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.mountRef.current && this.renderer) {
      this.mountRef.current.removeChild(this.renderer.domElement);
    }
  }

  agentTalk = () => {
    let randomIndex = 0;
    let previousIndex = 0;
    if (this.shouldAnim) {
      const talkAnimations = ["talk1", "talk2", "talk3", "talk4"];

      if (this.actions && this.currentAnim !== "talk") {
        this.currentAnim = "talk";
        const playRandomAnimation = () => {
          previousIndex = randomIndex;
          randomIndex = Math.floor(Math.random() * talkAnimations.length);
          if (previousIndex === randomIndex) {
            if (randomIndex === talkAnimations.length - 1) {
              randomIndex = 0;
            } else {
              randomIndex = randomIndex + 1;
            }
          }
          const selectedAnimation = talkAnimations[randomIndex];

          Object.keys(this.actions).forEach((key) => {
            if (key === selectedAnimation) {
              this.actions[key].reset().fadeIn(0.5).play();
              this.actions[key].clampWhenFinished = true;
              this.actions[key].loop = THREE.LoopOnce;
            } else {
              this.actions[key].fadeOut(0.5);
            }
          });

          this.actions[selectedAnimation].getMixer().addEventListener("finished", () => {
            playRandomAnimation();
          });
        };
        playRandomAnimation();
      }
    }
  };

  agentIdle = () => {
    if (this.actions && this.actions.idle && this.currentAnim !== "idle") {
      this.currentAnim = "idle";
      Object.keys(this.actions).forEach((key) => {
        if (key === "idle") {
          this.actions[key].reset().fadeIn(0.5).play();
        } else {
          this.actions[key].fadeOut(0.5);
        }
      });
    }
  };

  componentDidUpdate(prevProps) {
    if (prevProps.messages !== null && this.props.messages !== null) {
      this.lastPropsUpdateTime = Date.now();
    }
  }

  changeState = () => {
    const timeSinceLastUpdate = Date.now() - this.lastPropsUpdateTime;
    if (timeSinceLastUpdate > 500) {
      this.shouldAnim = false;
      this.agentIdle();
    }
  };

  render() {
    let title = Setting.getUrlParam("title");
    if (title === null) {
      title = Conf.AiName;
    }

    let messages = this.props.messages;
    if (messages === null) {
      messages = [];
    }

    return (
      <React.Fragment>
        <MainContainer style={{display: "flex", width: "100%", height: "100%", border: "1px solid " + ThemeDefault.colorBackground, borderRadius: "6px"}} >
          <ChatContainer style={{display: "flex", width: "100%", height: "100%"}}>
            {
              (title === "") ? null : (
                <ConversationHeader style={{backgroundColor: ThemeDefault.colorBackground, height: "42px"}}>
                  <ConversationHeader.Content userName={title} />
                </ConversationHeader>
              )
            }
            <MessageList id="canvas" style={{marginTop: "10px"}}>
              <div className="render-window" ref={this.mountRef}>
                <div style={{overflow: "auto"}} className="overlay-message-list">
                  {messages.filter(message => message.isHidden === false).map((message, index) => (
                    <Message id="messageBox" key={index} model={{
                      type: "custom",
                      sender: message.name,
                      direction: message.author === "AI" ? "incoming" : "outgoing",
                    }} avatarPosition={message.author === "AI" ? "tl" : "tr"}>
                      {/* <Avatar src={message.author === "AI" ? Conf.AiAvatar : (this.props.hideInput === true ? "https://cdn.casdoor.com/casdoor/resource/built-in/admin/casibase-user.png" : this.props.account.avatar)} name="GPT" /> */}
                      <Message.CustomContent className="text">
                        {this.renderMessageContent(message, index === messages.length - 1)}
                      </Message.CustomContent>
                    </Message>
                  ))}
                </div>
              </div>

            </MessageList>
            {
              this.props.hideInput === true ? null : (
                <MessageInput disabled={false}
                  sendDisabled={this.state.value === "" || this.props.disableInput}
                  placeholder={i18next.t("chat:Type message here")}
                  onSend={this.handleSend}
                  value={this.state.value}
                  onChange={(val) => {
                    this.setState({value: val});
                  }}
                  onAttachClick={() => {
                    this.handleImageClick();
                  }}
                  onPaste={(event) => {
                    const items = event.clipboardData.items;
                    const item = items[0];
                    if (item.kind === "file") {
                      event.preventDefault();
                      const file = item.getAsFile();
                      this.copyFileName = file.name;
                      this.handleInputChange(file);
                    }
                  }}
                />
              )
            }
          </ChatContainer>
          {
            messages.length !== 0 ? null : <ChatPrompts sendMessage={this.props.sendMessage} />
          }
        </MainContainer>
        <input
          ref={e => this.inputImage = e}
          type="file"
          accept="image/*, .txt, .md, .yaml, .csv, .docx, .pdf, .xlsx"
          multiple={false}
          onChange={() => this.handleInputChange(this.inputImage.files[0])}
          style={{display: "none"}}
        />
      </React.Fragment>
    );
  }

}

export default LiveChatBox;
