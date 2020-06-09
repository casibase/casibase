// Copyright 2020 The casbin Authors. All Rights Reserved.
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

import Avatar from "../Avatar";
import * as Setting from "../Setting";
import React from "react";
import {withRouter} from "react-router-dom";
import 'antd/es/select/style/css'
import {
    Select,
    Row,
    Col,
    Form,
    Input,
    Button,
    Checkbox
} from 'antd';
import { FONTS_LIST, TIMEZONE_LIST } from './const'

const { Option } = Select;
const { TextArea } = Input;

function onChange(value) {
    console.log(`selected ${value}`);
}

function onBlur() {
    console.log('blur');
}

function onFocus() {
    console.log('focus');
}

function onSearch(val) {
    console.log('search:', val);
}

function handleChange(value) {
    console.log(value);
}

const formItemLayout = {
    labelCol: {
        flex: "140px",
        gutter:[8,6],
    },
    wrapperCol: {
        span: 10,
        gutter:[8,6],
    },
};
const formTailLayout = {
    labelCol: {
        flex: "140px",
        gutter:[8,6],
    },
    wrapperCol: {
        span: 10,
    },
};

const formButtonLayout = {
    labelCol: {
        flex: "140px",
    },
    wrapperCol: {
        span: 10,
    },
};

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            classes: props,
            info: {
                username: "alice",
                id: "123",
                tell: "",
                website: "",
                email: "xxx@gmail.com",
                is_email: true,
                company: "",
                company_title: "",
                location: "",
                tagline: "",
                dribbble: "",
                member_duolingo: "",
                member_aboutme: "",
                member_lastfm: "",
                member_goodreads: "",
                github: "",
                psn: "",
                stream_id: "",
                twitch: "",
                battletag: "",
                instagram: "",
                telegram: "",
                twitter: "",
                btc: "",
                social_coding: "",
                bio: "",
                who_can_view_my_t: 1,
                list_rich: 0,
                show_balance: 1,
                node_avatar_as_favicon: 0,
                show_hi_dpi: 0,
                show_my_nodes: 1,
                my_home: "",
                use_my_css: 0,
                my_css: "",
                always_ssl: 0,
                font: "Helvetica Neue",
                timezone: "Asia/Shanghai"
            }
        };
    }

    componentDidMount() {
    }

    render() {

        return (
            <div className="box">
                <div className="header">
                    <a href="/">
                        {
                            Setting.getForumName()
                        }
                    </a>
                    <span className="chevron">
                        &nbsp;›&nbsp;
                    </span> 设置
                </div>

                <div className="inner">
                    <Row align={"middle"} gutter={[8,10]}>
                        <Col align="right" flex="140px">
                            <img height={24} width={24} src={Setting.getUserAvatar(this.state.info.username, false)} alt={this.state.info.username}/>
                        </Col>
                        <Col>
                            Casbin Forum 第{this.state.info.id}号会员
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[8,10]}>
                        <Col align="right" flex="140px">
                            用户名
                        </Col>
                        <Col>
                            {this.state.info.username}
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[10,10]}>
                        <Col align="right" flex="140px">
                            手机号
                        </Col>
                        <Col>
                            {this.state.info.tell===""?<span className="negative">尚未验证</span>:<span className="green">已验证</span>}
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[8,10]}>
                        <Col align="right" flex="140px">
                        </Col>
                        <Col>
                            <a href="">更改手机号</a>
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[10,10]}>
                        <Col align="right" flex="140px">
                            电子邮箱&nbsp;&nbsp;
                        </Col>
                        <Col>
                            {this.state.info.email}
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[,10]}>
                        <Col align="right" flex="140px">
                            &nbsp;&nbsp;
                        </Col>
                        <Col>
                            <a href="">更改注册邮箱</a>
                        </Col>
                    </Row>
                    <Row align={"middle"} gutter={[,10]}>
                    <Col align="right" flex="140px">
                        电子邮件地址验证&nbsp;&nbsp;
                    </Col>
                    <Col>
                        {this.state.info.is_email?<span className="green">已验证</span>:<span className="negative">尚未验证</span>}
                    </Col>
                    </Row>
                    <Form
                        {...formItemLayout}
                        name="details"
                    >
                        <Form.Item
                            {...formTailLayout}
                            label="个人网站"
                            name="website"
                            colon={false}
                            initialValue={this.state.info.website}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="所在公司"
                            name="company"
                            colon={false}
                            initialValue={this.state.info.company}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="工作职位"
                            name="company_title"
                            colon={false}
                            initialValue={this.state.info.company_title}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="所在地"
                            name="location"
                            colon={false}
                            initialValue={this.state.info.location}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="签名"
                            name="tagline"
                            colon={false}
                            initialValue={this.state.info.tagline}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Dribbble"
                            name="dribbble"
                            colon={false}
                            initialValue={this.state.info.dribbble}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Duolingo"
                            name="member_duolingo"
                            colon={false}
                            initialValue={this.state.info.member_duolingo}
                        >
                            <Input />
                        </Form.Item><Form.Item
                            {...formTailLayout}
                            label="About.me"
                            name="member_aboutme"
                            colon={false}
                            initialValue={this.state.info.member_aboutme}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Last.fm"
                            name="member_lastfm"
                            colon={false}
                            initialValue={this.state.info.member_lastfm}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Goodreads"
                            name="member_goodreads"
                            colon={false}
                            initialValue={this.state.info.member_goodreads}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="GitHub"
                            name="github"
                            colon={false}
                            initialValue={this.state.info.github}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="PSN ID"
                            name="psn"
                            colon={false}
                            initialValue={this.state.info.psn}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Stream ID"
                            name="stream_id"
                            colon={false}
                            initialValue={this.state.info.stream_id}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Twitch"
                            name="twitch"
                            colon={false}
                            initialValue={this.state.info.twitch}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="BattleTag"
                            name="battletag"
                            colon={false}
                            initialValue={this.state.info.battletag}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Instagram"
                            name="instagram"
                            colon={false}
                            initialValue={this.state.info.instagram}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Telegram"
                            name="telegram"
                            colon={false}
                            initialValue={this.state.info.telegram}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Twitter"
                            name="twitter"
                            colon={false}
                            initialValue={this.state.info.twitter}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="BTC Address"
                            name="btc"
                            colon={false}
                            initialValue={this.state.info.btc}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            label="Coding.net"
                            name="social_coding"
                            colon={false}
                            initialValue={this.state.info.social_coding}
                        >
                            <Input />
                        </Form.Item>

                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                个人介绍
                            </Col>
                            <Col span={10}>
                                <TextArea id={"bio"} defaultValue={this.state.info.bio} rows={8} />
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                状态更新查看权限
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.who_can_view_my_t.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="0">所有人</Select.Option>
                                    <Select.Option value="1">已登录用户</Select.Option>
                                    <Select.Option value="2">只有我自己</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                社区财富排行榜
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.list_rich.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="0">不参与</Select.Option>
                                    <Select.Option value="1">参与</Select.Option>
                                </Select>
                                &nbsp;&nbsp;
                                <a href="/top/rich" target="_blank">查看当前排行榜 ›</a>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                            </Col>
                            <Col span={10}>
                                <span className="gray">
                                    参与此排行榜将会公开你的个人资产状况。默认是不参与的。
                                </span>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                显示余额
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.show_balance.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">显示</Select.Option>
                                    <Select.Option value="0">不显示</Select.Option>
                                </Select>
                                &nbsp;&nbsp;
                                <a href="" target="_blank">查看我的当前余额 ›</a>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                使用节点头像作为页面
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.node_avatar_as_favicon.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">Yes</Select.Option>
                                    <Select.Option value="0">No</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                使用高精度头像
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.show_hi_dpi.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">使用</Select.Option>
                                    <Select.Option value="0">不使用</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                在首页显示收藏节点
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.show_my_nodes.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">显示</Select.Option>
                                    <Select.Option value="0">不显示</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Form.Item
                            {...formTailLayout}
                            label="自定义首页跳转"
                            name="my_home"
                            colon={false}
                            initialValue={this.state.info.my_home}
                        >
                            <Input />
                        </Form.Item>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                使用自定义
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.use_my_css.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">使用</Select.Option>
                                    <Select.Option value="0">不使用</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                自定义CSS
                            </Col>
                            <Col span={10}>
                                <TextArea id={"my_css"} defaultValue={this.state.info.my_css} rows={8} />
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                浏览器连接方式
                            </Col>
                            <Col span={10}>
                                <Select
                                    labelInValue
                                    defaultValue={{ value: this.state.info.always_ssl.toString() }}
                                    style={{ width: 120 }}
                                    onChange={handleChange}
                                >
                                    <Select.Option value="1">永远使用TSL</Select.Option>
                                    <Select.Option value="0">默认</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                            </Col>
                            <Col span={10}>
                                <span className="gray">
                                    如果开启永远使用 TLS，则在返回首页时，Casbin Forum 会向浏览器发送 max-age 为一周的 HSTS 头来提示浏览器使用 TLS 方式连接。推荐使用最新版本的 Chrome 或者 Firefox 访问。
                                </span>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                偏好正文英文字体
                            </Col>
                            <Col span={10}>
                                <Select
                                    name="font"
                                    id="fonts"
                                    showSearch
                                    placeholder="Select a font"
                                    optionFilterProp="fonts"
                                    value={this.state.info.font}
                                    onChange={onChange}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    onSearch={onSearch}
                                    style={{ width: 320 }}
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {
                                        FONTS_LIST.map((font) => {
                                            return <Select.Option key={font.value} value={font.value}>{font.label}</Select.Option>
                                        })
                                    }
                                </Select>
                            </Col>
                        </Row>
                        <Row align={"middle"} gutter={[8,10]}>
                            <Col align="right" flex="140px">
                                时区
                            </Col>
                            <Col span={10}>
                                <Select
                                    name="timezones"
                                    id="timezones"
                                    showSearch
                                    placeholder="Select a timezone"
                                    optionFilterProp="timezones"
                                    value={this.state.info.timezone}
                                    onChange={onChange}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    onSearch={onSearch}
                                    style={{ width: 320 }}
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {
                                        TIMEZONE_LIST.map((font) => {
                                            return <Select.Option key={font.value} value={font.value}>{font.label}</Select.Option>
                                        })
                                    }
                                </Select>
                            </Col>
                        </Row>
                        <Form.Item {...formButtonLayout}
                                   label=" "
                                   colon={false}
                        >
                            <Button htmlType="submit">
                                保存设置
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        );
    }

}

export default Settings;