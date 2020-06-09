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
import Header from "./Header";
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
    Form,
    Input,
    Tooltip,
    Cascader,
    Select,
    Row,
    Col,
    Checkbox,
    Button,
    AutoComplete,
} from 'antd';

const { Option } = Select;
const AutoCompleteOption = AutoComplete.Option;

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

const onFinish = values => {
    console.log('Received values of form: ', values);
};

class ChangePassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            classes: props,
        };
    }

    componentDidMount() {
    }

    render() {
        let username = "alice";

        return (
            <div className="box">
                <div className="cell">
                    <div className="fr"><span className="fade">如果你不打算更改密码，请留空以下区域</span></div>
                    更改密码
                </div>
                <div className="cell">
                    <li className="fa fa-exclamation-triangle fade"></li>
                    通过 Google 注册的账号，可以先通过
                    <a href="/forgot">这里</a>
                    设置密码
                </div>
                <div className="inner">
                    <Form
                        {...formItemLayout}
                        name="change_password"
                    >
                        <Form.Item
                            {...formTailLayout}
                            label="当前密码"
                            name="password_current"
                            colon={false}
                            onFinish={onFinish}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            name="password_new"
                            label="新密码"
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            {...formTailLayout}
                            name="confirm"
                            label="再次输入新密码"
                            dependencies={['password_new']}
                            hasFeedback
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(rule, value) {
                                        if (!value || getFieldValue('password_new') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject('The two passwords that you entered do not match!');
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item {...formButtonLayout}
                                   label=" "
                                   colon={false}
                        >
                            <Button htmlType="submit">
                                更改密码
                            </Button>
                        </Form.Item>
                        </Form>
                </div>
            </div>
        );
    }

}

export default ChangePassword;