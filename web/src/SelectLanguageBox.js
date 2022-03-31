import React from "react";
import {Link} from "react-router-dom";
import * as Setting from "./Setting";
import { Menu} from "antd";
import { createFromIconfontCN } from '@ant-design/icons';
import './App.less';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_2680620_ffij16fkwdg.js',
});

class SelectLanguageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
    };
  }

  render() {
    return (
      <React.Fragment>
        <Menu.Item key="en" className="rightDropDown" style={{float: 'right', cursor: 'pointer', marginRight: '20px'}} icon={<React.Fragment>&nbsp;&nbsp;&nbsp;&nbsp;<IconFont type="icon-en" /></React.Fragment>}
                   onClick={() => {
                     Setting.changeLanguage("en");
                   }}
        >
          &nbsp;
          English
          &nbsp;
          &nbsp;
        </Menu.Item>
        <Menu.Item key="zh" className="rightDropDown" style={{float: 'right', cursor: 'pointer'}} icon={<React.Fragment>&nbsp;&nbsp;&nbsp;&nbsp;<IconFont type="icon-zh" /></React.Fragment>}
                   onClick={() => {
                     Setting.changeLanguage("zh");
                   }}
        >
          &nbsp;
          中文
          &nbsp;
          &nbsp;
        </Menu.Item>
      </React.Fragment>
    );
  }
}

export default SelectLanguageBox;
