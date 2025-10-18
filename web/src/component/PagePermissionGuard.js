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

import React, { useEffect, useState } from "react";
import { message, Spin } from "antd";
import * as PagePermissionBackend from "../backend/PagePermissionBackend";
import i18next from "i18next";

/**
 * 页面权限守卫组件
 * 用于检查用户是否有权访问特定页面，如果无权限则重定向到首页并显示提示
 * 
 * @param {React.Component} WrappedComponent - 需要权限保护的组件
 * @param {string} pagePath - 页面路径，用于权限检查
 * @returns {React.Component} - 包装后的组件
 */
const withPagePermission = (WrappedComponent, pagePath) => {
    return function PagePermissionGuard(props) {
        const [permissionChecked, setPermissionChecked] = useState(false);
        const [hasPermission, setHasPermission] = useState(false);

        useEffect(() => {
            // 检查页面访问权限
            PagePermissionBackend.checkPagePermission(pagePath)
                .then((res) => {
                    if (res.status === "ok") {
                        const allowed = res.data?.allowed;

                        if (allowed) {
                            // 有权限，允许访问
                            setHasPermission(true);
                            setPermissionChecked(true);
                        } else {
                            // 无权限，显示提示并重定向到首页
                            message.error(i18next.t("general:You don't have permission to access this page"), 3);

                            // 延迟重定向，让用户看到提示信息
                            setTimeout(() => {
                                window.location.href = "/";
                            }, 1000);
                        }
                    } else {
                        // API 调用失败，显示错误信息
                        message.error(`${i18next.t("general:Permission check failed")}: ${res.msg}`, 3);

                        // 失败时也重定向到首页
                        setTimeout(() => {
                            window.location.href = "/";
                        }, 1000);
                    }
                })
                .catch((error) => {
                    // 网络错误或其他异常
                    console.error("Page permission check error:", error);
                    message.error(i18next.t("general:Failed to check page permission"), 3);

                    // 异常时重定向到首页
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 1000);
                });
        }, [pagePath]);

        // 权限检查中，显示加载动画
        if (!permissionChecked) {
            return (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}>
                    <Spin size="large" tip={i18next.t("general:Checking permissions...")} />
                </div>
            );
        }

        // 有权限，渲染实际组件
        if (hasPermission) {
            return <WrappedComponent {...props} />;
        }

        // 无权限，显示空内容（实际会重定向）
        return null;
    };
};

export default withPagePermission;


