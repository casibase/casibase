import React from "react";
import {ChatContainer, ConversationHeader, MainContainer, Message, MessageInput, MessageList} from "@chatscope/chat-ui-kit-react";
import i18next from "i18next";
import * as Setting from "./Setting";
import * as Conf from "./Conf";
import "./LiveChatBox.css";
import {ThemeDefault} from "./Conf";
import ChatPrompts from "./ChatPrompts";
import ChatBox from "./ChatBox";

class LiveChatBox extends ChatBox {
  constructor(props) {
    super(props);
    this.mountRef = React.createRef();
    this.inputImage = React.createRef();
  }

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
                    <Message id="message-box" key={index} model={{
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
