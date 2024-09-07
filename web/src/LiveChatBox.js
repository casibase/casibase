// Copyright 2024 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import moment from "moment";
import {Alert, Button} from "antd";
import {ChatContainer, ConversationHeader, MainContainer, Message, MessageInput, MessageList} from "@chatscope/chat-ui-kit-react";
import {renderText} from "./ChatMessageRender";
import i18next from "i18next";
import * as Setting from "./Setting";
import "./LiveChatBox.css";
import {ThemeDefault} from "./Conf";
import ChatPrompts from "./ChatPrompts";
import * as THREE from "three";
import ChatBox from "./ChatBox";

class LiveChatBox extends ChatBox {
  constructor(props) {
    super(props);
    this.mountRef = React.createRef();
    this.inputImage = React.createRef();
    this.mixer = null;
    this.actions = {};
    this.clock = new THREE.Clock();
    this.lastPropsUpdateTime = Date.now();
    this.shouldAnim = false;
    this.currentAnim = "idle";
  }

  handleAnimSend = (innerHtml) => {
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

  renderAnimMessageContent = (message, isLastMessage) => {
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

  componentDidMount() {
    this.intervalInit = setInterval(() => {
      if (THREE.OrbitControls && THREE.GLTFLoader && THREE.RGBELoader && THREE.Water && THREE.Reflector && THREE.Refractor) {
        this.initThreeScene();
        clearInterval(this.intervalInit);
      }
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
    clearInterval(this.intervalInit);
  }

  initThreeScene = () => {
    this.scrollToBottom();
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
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(width, height);

    window.addEventListener("resize", () => {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix;
      this.renderer.setSize(width, height);
    });
    this.mountRef.current.appendChild(this.renderer.domElement);

    const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

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

    const texture = new THREE.TextureLoader().load("https://cdn.casibase.org/assets/textures/skybox/Sky_horiz_1.jpg");

    const skyGeometry = new THREE.SphereGeometry(500, 60, 60);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    });
    skyGeometry.scale(1, 1, -1);
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    const waterGeometry = new THREE.CircleGeometry(300, 64);
    const water = new THREE.Water(waterGeometry, {
      normalMap0: new THREE.TextureLoader().load("https://cdn.casibase.org/assets/textures/water/water_normal_0.jpeg", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.1, 0.1);
      }),
      normalMap1: new THREE.TextureLoader().load("https://cdn.casibase.org/assets/textures/water/water_normal_1.jpeg", texture => {
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

    const islandLoader = new THREE.GLTFLoader();
    islandLoader.load("https://cdn.casibase.org/assets/models/island.glb", (gltf) => {
      const island = gltf.scene;
      island.scale.set(30, 30, 30);
      island.position.set(0, -0.5, 0);
      this.scene.add(island);
    });

    const agentLoader = new THREE.GLTFLoader();
    agentLoader.load("https://cdn.casibase.org/assets/models/agent.glb", (gltf) => {
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

    const hdrLoader = new THREE.RGBELoader();
    hdrLoader.loadAsync("https://cdn.casibase.org/assets/textures/skybox/skyHDR.hdr"). then((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
    });

    this.intervalId = setInterval(() => {
      this.changeState();
    }, 2000);
  };

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
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    const messageList = document.querySelector(".overlay-message-list");
    messageList.scrollTop = messageList.scrollHeight;
  };

  changeState = () => {
    const timeSinceLastUpdate = Date.now() - this.lastPropsUpdateTime;
    if (timeSinceLastUpdate > 1000) {
      this.shouldAnim = false;
      this.agentIdle();
    }
  };

  render() {
    const getStoreTitle = (store) => {
      let title = Setting.getUrlParam("title");
      if (title === null) {
        title = (!store?.title) ? this.props.displayName : store.title;
      }
      return title;
    };

    const title = getStoreTitle(this.props.store);

    let prompts = this.props.store?.prompts;
    if (!prompts) {
      prompts = [];
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
                      <Message.CustomContent className="text">
                        {this.renderAnimMessageContent(message, index === messages.length - 1)}
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
                  onSend={this.handleAnimSend}
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
            messages.length !== 0 ? null : <ChatPrompts sendMessage={this.props.sendMessage} prompts={prompts} />
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
