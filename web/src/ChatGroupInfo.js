import React from "react";
import {Avatar, ConversationList} from "@chatscope/chat-ui-kit-react";
import {Button, Input, Modal} from "antd";

const src = "https://cdn.casbin.org/img/casbin.svg";

class ChatGroupInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    modal: false,
    inputValue: "",
  };

  showModal = () => {
    this.setState({
      modal: true,
    });
  };

  handleOk = () => {
    this.setState({
      modal: false,
    });
    this.props.addChatMember(this.props.chatName, this.state.inputValue);
  };

  handleCancel = () => {
    this.setState({
      modal: false,
    });
  };

  handleInputChange = (event) => {
    this.setState({
      inputValue: event.target.value,
    });
  };

  render() {
    return (
      <div>
        <div className="announcement" style={{height: "200px", border: "2px solid rgb(235,235,235)"}}>
          <p>群公告</p>
          <p>这是群公告的内容。</p>
        </div>
        <Modal title="add member" open={this.state.modal} onOk={this.handleOk} onCancel={this.handleCancel}>
          <p><Input placeholder="user name" onChange={this.handleInputChange} /></p>
        </Modal>
        <div className="member-list" >
          <ConversationList style={{width: "200px"}}>
            <div >群成员 <Button onClick={this.showModal}>+</Button></div>
            {this.props.members.map((mem, index) => (
              <div key={index} style={{display: "flex"}}>
                <Avatar src={src} name="Lilly" size="sm" />
                <div style={{display: "flex"}}>{mem}</div>
              </div>
            ))}
          </ConversationList>
        </div>
      </div>
    );
  }
}

export default ChatGroupInfo;
