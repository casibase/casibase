// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
import {
  BulbOutlined,
  FireOutlined, GiftOutlined,
  HeartOutlined,
  IssuesCloseOutlined,
  QuestionOutlined, SearchOutlined,
  TrophyOutlined
} from "@ant-design/icons";

class ImageWithFallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }
  // eslint-disable-next-line react/no-deprecated
  componentWillMount() {
    this.setState({
      hasError: false,
    });
  }

  handleError = () => {
    this.setState({hasError: true});
  };

  render() {
    const defaultIcons = [
      <QuestionOutlined style={{color: "red"}} key={"1"} />,
      <IssuesCloseOutlined style={{color: "blue"}} key={"2"} />,
      <BulbOutlined style={{color: "green"}} key={"3"} />,
      <FireOutlined style={{color: "orange"}} key={"4"} />,
      <HeartOutlined style={{color: "pink"}} key={"5"} />,
      <GiftOutlined style={{color: "purple"}} key={"6"} />,
      <TrophyOutlined style={{color: "gold"}} key={"7"} />,
      <SearchOutlined style={{color: "brown"}} key={"8"} />,
    ];

    if (this.state.hasError || !this.props.src) {
      return defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
    }

    return (
      <img
        src={this.props.src}
        alt="icon"
        style={{width: "20px", height: "20px"}}
        onError={this.handleError}
        referrerPolicy="no-referrer"
      />
    );
  }
}

export default ImageWithFallback;
