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
import {withRouter} from "react-router-dom";
import {Button, Card, Col, DatePicker, Descriptions, Empty, Input, Modal, Popconfirm, Radio, Result, Row, Select, Spin, Tooltip, Tree, Upload} from "antd";
import {CloudUploadOutlined, DeleteOutlined, DownloadOutlined, FileDoneOutlined, FolderAddOutlined, InfoCircleTwoTone, createFromIconfontCN} from "@ant-design/icons";
import moment from "moment";
import * as Setting from "./Setting";
import * as FileBackend from "./backend/FileBackend";
import DocViewer, {DocViewerRenderers} from "@cyntler/react-doc-viewer";
import FileViewer from "react-file-viewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import i18next from "i18next";
import * as PermissionBackend from "./backend/PermissionBackend";
import * as PermissionUtil from "./PermissionUtil";
import * as Conf from "./Conf";
import FileTable from "./FileTable";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
// require("codemirror/theme/material-darker.css");
// require("codemirror/mode/javascript/javascript");

const {Search} = Input;
const {Option} = Select;

const IconFont = createFromIconfontCN({
  scriptUrl: "https://cdn.open-ct.com/icon/iconfont.js",
});

class FileTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      expandedKeys: ["0-0", "0-0-0", "0-0-0-0"],
      checkedKeys: [],
      checkedFiles: [],
      selectedKeys: [],
      selectedFile: null,
      loading: false,
      text: null,
      newFolder: null,
      permissions: null,
      permissionMap: null,
      searchValue: "",
      isUploadFileModalVisible: false,
      uploadFileType: null,
      file: null,
      info: null,
    };

    this.filePane = React.createRef();
    this.uploadedFileIdMap = {};
  }

  UNSAFE_componentWillMount() {
    this.getPermissions();
  }

  getPermissionMap(permissions) {
    const permissionMap = {};
    permissions.forEach((permission, index) => {
      if (permissionMap[permission.resources[0]] === undefined) {
        permissionMap[permission.resources[0]] = [];
      }
      permissionMap[permission.resources[0]].push(permission);
    });
    return permissionMap;
  }

  getPermissions() {
    PermissionBackend.getPermissions(Conf.AuthConfig.organizationName)
      .then((res) => {
        if (res.status === "ok") {
          const permissions = res.data.filter(permission => (permission.domains[0] === this.props.store.name) && permission.users.length !== 0);
          this.setState({
            permissions: permissions,
            permissionMap: this.getPermissionMap(permissions),
          });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        }
      });
  }

  updateStore(store) {
    this.props.onUpdateStore(store);
  }

  checkUploadFile(info) {
    if (Conf.EnableExtraPages) {
      for (let i = 0; i < info.fileList.length; i++) {
        const filename = info.fileList[i].name;
        if (this.getCacheApp(filename) === "" && filename.endsWith(".txt")) {
          return true;
        }
      }
    }
    return false;
  }

  renderUploadFileModal() {
    return (
      <Modal title={
        <div>
          <InfoCircleTwoTone twoToneColor="rgb(45,120,213)" />
          {" " + i18next.t("store:Please choose the type of your data")}
        </div>
      }
      open={this.state.isUploadFileModalVisible}
      onCancel={() => {
        this.setState({
          isUploadFileModalVisible: false,
        });
      }}
      width={"360px"}
      footer={null} >
        <Radio.Group buttonStyle="solid" onChange={e => {
          this.setState({
            uploadFileType: e.target.value,
            isUploadFileModalVisible: false,
          });

          const uploadFileType = e.target.value;
          // console.log(this.state.file);
          // console.log(this.state.info);

          const newInfo = Setting.deepCopy(this.state.info);
          if (uploadFileType !== "Other") {
            for (let i = 0; i < newInfo.fileList.length; i++) {
              const filename = newInfo.fileList[i].name;
              if (this.getCacheApp(filename) === "" && filename.endsWith(".txt")) {
                newInfo.fileList[i].name = `${uploadFileType}_${newInfo.fileList[i].name}`;
              }
            }
          }
          this.uploadFile(this.state.file, newInfo);
        }} value={this.state.uploadFileType}>
          <Radio.Button value={"ECG"}>ECG</Radio.Button>
          <Radio.Button value={"Impedance"}>Impedance</Radio.Button>
          {/* <Radio.Button value={"EEG"}>EEG</Radio.Button>*/}
          <Radio.Button value={"Other"}>{i18next.t("store:Other")}</Radio.Button>
        </Radio.Group>
      </Modal>
    );
  }

  uploadFile(file, info) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;

    const promises = [];
    info.fileList.forEach((uploadedFile, index) => {
      if (this.uploadedFileIdMap[uploadedFile.originFileObj.uid] === 1) {
        return;
      } else {
        this.uploadedFileIdMap[uploadedFile.originFileObj.uid] = 1;
      }

      promises.push(FileBackend.addFile(storeId, file.key, true, uploadedFile.name, uploadedFile.originFileObj));
    });

    Promise.all(promises)
      .then((values) => {
        const res = values[0];
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully uploaded"));
          this.props.onRefresh();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  addFile(file, newFolder) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;
    FileBackend.addFile(storeId, file.key, false, newFolder, null)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.props.onRefresh();
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${error}`);
      });
  }

  deleteFile(file, isLeaf) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;
    FileBackend.deleteFile(storeId, file.key, isLeaf)
      .then((res) => {
        if (res.status === "ok") {
          if (res.data === true) {
            Setting.showMessage("success", i18next.t("general:Successfully deleted"));
            this.props.onRefresh();
          } else {
            Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${error}`);
      });
  }

  renderPermission(permission, isReadable) {
    if (!isReadable) {
      const userId = `${this.props.account.owner}/${this.props.account.name}`;
      if (!permission.users.includes(userId)) {
        return null;
      }
    }

    return (
      <span key={permission.name}
        onClick={(e) => {
          Setting.openLink(Setting.getMyProfileUrl(this.props.account).replace("/account", `/permissions/${permission.owner}/${permission.name}`));
          e.stopPropagation();
        }}
      >
        {
          permission.users.map(user => {
            const username = user.split("/")[1];
            return (
              <span key={username}>
                {
                  Setting.getTag(username, permission.actions[0], permission.state)
                }
              </span>
            );
          })
        }
      </span>
    );
  }

  renderPermissions(permissions, isReadable) {
    if (permissions === undefined) {
      return null;
    }

    return permissions.map(permission => this.renderPermission(permission, isReadable)).filter(permission => permission !== null);
  }

  isActionIncluded(action1, action2) {
    if (action1 === "Read") {
      return true;
    } else if (action1 === "Write" && action2 !== "Read") {
      return true;
    } else if (action1 === "Admin" && action2 === "Admin") {
      return true;
    } else {
      return false;
    }
  }

  isFileOk(file, action) {
    if (this.props.account.isAdmin) {
      return true;
    }

    if (this.state.permissionMap === null) {
      return false;
    }

    const permissions = this.state.permissionMap[file.key];
    if (permissions !== undefined) {
      for (let i = 0; i < permissions.length; i++) {
        const permission = permissions[i];

        const userId = `${this.props.account.owner}/${this.props.account.name}`;
        if (permission.state === "Approved" && permission.isEnabled === true && permission.resources[0] === file.key && permission.users.includes(userId) && this.isActionIncluded(action, permission.actions[0])) {
          return true;
        }
      }
    }

    if (file.parent !== undefined) {
      return this.isFileOk(file.parent, action);
    }
    return false;
  }

  isFileReadable(file) {
    return this.isFileOk(file, "Read");
  }

  isFileWritable(file) {
    return this.isFileOk(file, "Write");
  }

  isFileAdmin(file) {
    if (Setting.isLocalAdminUser(this.props.account)) {
      return true;
    }

    return this.isFileOk(file, "Admin");
  }

  renderSearch() {
    return (
      <Search placeholder={i18next.t("store:Please input your search term")} onChange={(e) => {
        this.setState({
          searchValue: e.target.value,
          selectedKeys: [],
          selectedFile: null,
        });
      }} />
    );
  }

  getCacheApp(filename) {
    if (!filename.startsWith("ECG_") && !filename.startsWith("EEG_") && !filename.startsWith("Impedance_")) {
      return "";
    }

    return filename;
  }

  renderTree(store) {
    const onSelect = (selectedKeys, info) => {
      if (!this.isFileReadable(info.node)) {
        Setting.showMessage("error", i18next.t("store:Sorry, you are unauthorized to access this file or folder"));
        return;
      }

      if (selectedKeys.length !== 0) {
        const fetchFile = () => {
          const path = selectedKeys[0];
          const ext = Setting.getExtFromPath(path);
          if (ext !== "") {
            const url = info.node.url;

            if (!this.isExtForDocViewer((ext) && !this.isExtForFileViewer(ext))) {
              this.setState({
                loading: true,
              });

              fetch(url, {method: "GET"})
                .then(res => res.text())
                .then(res => {
                  this.setState({
                    text: res,
                    loading: false,
                  });
                });
            }
          }
        };

        const key = info.node.key;
        const filename = info.node.title;
        if (this.getCacheApp(filename) !== "") {
          FileBackend.activateFile(key, filename)
            .then((res) => {
              if (res.status === "ok") {
                if (res.data === true) {
                  // Setting.showMessage("success", `File activated successfully`);
                  fetchFile();
                } else {
                  Setting.showMessage("error", i18next.t("general:Failed to connect to server"));
                }
              } else {
                Setting.showMessage("error", `${i18next.t("general:Failed to activate")}: ${res.msg}`);
              }
            })
            .catch(error => {
              Setting.showMessage("error", `${i18next.t("general:Failed to activate")}: ${error}`);
            });
        } else {
          fetchFile();
        }
      }

      this.setState({
        checkedKeys: [],
        checkedFiles: [],
        selectedKeys: selectedKeys,
        selectedFile: info.node,
      });
    };

    const onCheck = (checkedKeys, info) => {
      this.setState({
        checkedKeys: checkedKeys,
        checkedFiles: info.checkedNodes,
        selectedKeys: [],
        selectedFile: null,
      });
    };

    let fileTree = Setting.getTreeWithParents(store.fileTree);
    if (this.state.searchValue !== "") {
      fileTree = Setting.getTreeWithSearch(fileTree, this.state.searchValue);
    }

    return (
      <Tree
        height={"calc(100vh - 220px)"}
        virtual={true}
        className="draggable-tree"
        multiple={false}
        checkable
        defaultExpandAll={true}
        // defaultExpandedKeys={tree.children.map(file => file.key)}
        draggable={false}
        blockNode
        showLine={true}
        showIcon={true}
        onCheck={onCheck}
        checkedKeys={this.state.checkedKeys}
        onSelect={onSelect}
        selectedKeys={this.state.selectedKeys}
        treeData={[fileTree]}
        titleRender={(file) => {
          const isReadable = this.isFileReadable(file);
          const isWritable = this.isFileWritable(file);
          const isAdmin = this.isFileAdmin(file);

          let tagStyle = {};
          if (!isReadable && !isWritable && !isAdmin) {
            tagStyle = {color: "rgba(100,100,100,0.6)", backgroundColor: "rgba(225,225,225,0.4)"};
          }

          if (file.isLeaf) {
            return (
              <Tooltip color={"rgb(255,255,255,0.8)"} placement="right" title={
                <div>
                  {
                    !isReadable ? null : (
                      <Tooltip title={i18next.t("general:Download")}>
                        <Button style={{marginRight: "5px"}} icon={<DownloadOutlined />} size="small" onClick={(e) => {
                          Setting.showMessage("success", i18next.t("general:Successfully downloaded"));
                          Setting.openLink(file.url);
                          e.stopPropagation();
                        }} />
                      </Tooltip>
                    )
                  }
                  {
                    !isWritable ? null : (
                      <React.Fragment>
                        {/* <Tooltip title={i18next.t("store:Rename")}>*/}
                        {/*  <Button style={{marginRight: "5px"}} icon={<EditOutlined />} size="small" onClick={(e) => {*/}
                        {/*    Setting.showMessage("error", "Rename");*/}
                        {/*    e.stopPropagation();*/}
                        {/*  }} />*/}
                        {/* </Tooltip>*/}
                        {/* <Tooltip title={i18next.t("store:Move")}>*/}
                        {/*  <Button style={{marginRight: "5px"}} icon={<RadiusSettingOutlined />} size="small" onClick={(e) => {*/}
                        {/*    Setting.showMessage("error", "Move");*/}
                        {/*    e.stopPropagation();*/}
                        {/*  }} />*/}
                        {/* </Tooltip>*/}
                        <Tooltip title={i18next.t("general:Delete")}>
                          <span onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                              title={`${i18next.t("general:Sure to delete")}: ${file.title} ?`}
                              onConfirm={(e) => {
                                this.deleteFile(file, true);
                              }}
                              okText={i18next.t("general:OK")}
                              cancelText={i18next.t("general:Cancel")}
                            >
                              <Button style={{marginRight: "5px"}} icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                          </span>
                        </Tooltip>
                      </React.Fragment>
                    )
                  }
                  <Tooltip title={isAdmin ? i18next.t("store:Add Permission") :
                    i18next.t("store:Apply for Permission")}>
                    <Button icon={<FileDoneOutlined />} size="small" onClick={(e) => {
                      PermissionUtil.addPermission(this.props.account, this.props.store, file);
                      e.stopPropagation();
                    }} />
                  </Tooltip>
                </div>
              }>
                <span style={tagStyle}>
                  {`${file.title} (${Setting.getFriendlyFileSize(file.size)})`}
                </span>
                &nbsp;
                &nbsp;
                {
                  (this.state.permissionMap === null) ? null : this.renderPermissions(this.state.permissionMap[file.key], isReadable)
                }
              </Tooltip>
            );
          } else {
            return (
              <Tooltip color={"rgb(255,255,255,0.8)"} placement="right" title={
                <div>
                  {
                    !isWritable ? null : (
                      <React.Fragment>
                        <Tooltip color={"rgb(255,255,255)"} placement="top" title={
                          <span onClick={(e) => e.stopPropagation()}>
                            <div style={{color: "black"}}>
                              {i18next.t("store:New folder")}:
                            </div>
                            <Input.Group style={{marginTop: "5px"}} compact>
                              <Input style={{width: "100px"}} value={this.state.newFolder} onChange={e => {
                                this.setState({
                                  newFolder: e.target.value,
                                });
                              }} />
                              <Button type="primary" onClick={(e) => {
                                this.addFile(file, this.state.newFolder);
                                e.stopPropagation();
                              }}
                              >
                                OK
                              </Button>
                            </Input.Group>
                          </span>
                        }>
                          <span onClick={(e) => e.stopPropagation()}>
                            <Button style={{marginRight: "5px"}} icon={<FolderAddOutlined />} size="small" onClick={(e) => {
                              e.stopPropagation();
                            }} />
                          </span>
                        </Tooltip>
                        <Tooltip title={i18next.t("store:Upload file")}>
                          <span onClick={(e) => e.stopPropagation()}>
                            <Upload multiple={true} accept="*" showUploadList={false} beforeUpload={file => {return false;}} onChange={(info) => {
                              if (this.checkUploadFile(info)) {
                                this.setState({
                                  isUploadFileModalVisible: true,
                                  file: file,
                                  info: info,
                                });
                              } else {
                                this.uploadFile(file, info);
                              }
                            }}
                            >
                              <Button style={{marginRight: "5px"}} icon={<CloudUploadOutlined />} size="small" />
                            </Upload>
                          </span>
                        </Tooltip>
                        {
                          file.key === "/" ? null : (
                            <Tooltip title={i18next.t("general:Delete")}>
                              <span onClick={(e) => e.stopPropagation()}>
                                <Popconfirm
                                  title={`${i18next.t("general:Sure to delete")}: ${file.title} ?`}
                                  onConfirm={(e) => {
                                    this.deleteFile(file, false);
                                  }}
                                  okText={i18next.t("general:OK")}
                                  cancelText={i18next.t("general:Cancel")}
                                >
                                  <Button style={{marginRight: "5px"}} icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                              </span>
                            </Tooltip>
                          )
                        }
                      </React.Fragment>
                    )
                  }
                  <Tooltip title={isAdmin ? i18next.t("store:Add Permission") :
                    i18next.t("store:Apply for Permission")}>
                    <Button icon={<FileDoneOutlined />} size="small" onClick={(e) => {
                      PermissionUtil.addPermission(this.props.account, this.props.store, file);
                      e.stopPropagation();
                    }} />
                  </Tooltip>
                </div>
              }>
                <span style={tagStyle}>
                  {file.title}
                </span>
                &nbsp;
                &nbsp;
                {
                  (this.state.permissionMap === null) ? null : this.renderPermissions(this.state.permissionMap[file.key], isReadable)
                }
              </Tooltip>
            );
          }
        }}
        icon={(file) => {
          if (file.isLeaf) {
            const ext = Setting.getExtFromPath(file.data.key);
            if (ext === "pdf") {
              return <IconFont type="icon-testpdf" />;
            } else if (ext === "doc" || ext === "docx") {
              return <IconFont type="icon-testdocx" />;
            } else if (ext === "ppt" || ext === "pptx") {
              return <IconFont type="icon-testpptx" />;
            } else if (ext === "xls" || ext === "xlsx") {
              return <IconFont type="icon-testxlsx" />;
            } else if (ext === "txt") {
              return <IconFont type="icon-testdocument" />;
            } else if (ext === "png" || ext === "bmp" || ext === "jpg" || ext === "jpeg" || ext === "svg") {
              return <IconFont type="icon-testPicture" />;
            } else if (ext === "html") {
              return <IconFont type="icon-testhtml" />;
            } else if (ext === "js") {
              return <IconFont type="icon-testjs" />;
            } else if (ext === "css") {
              return <IconFont type="icon-testcss" />;
            } else {
              return <IconFont type="icon-testfile-unknown" />;
            }
          } else {
            return <IconFont type="icon-testfolder" />;
          }
        }}
      />
    );
  }

  isExtForDocViewer(ext) {
    return ["bmp", "jpg", "jpeg", "png", "tiff", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf", "csv"].includes(ext);
  }

  isExtForFileViewer(ext) {
    return ["png", "jpg", "jpeg", "gif", "bmp", "pdf", "xlsx", "docx", "mp4", "webm", "mp3"].includes(ext);
  }

  isExtForMarkdownViewer(ext) {
    return ["md"].includes(ext);
  }

  renderFileViewer(store) {
    if (this.state.checkedFiles.length !== 0) {
      const outerFile = {children: this.state.checkedFiles};
      return (
        <FileTable account={this.props.account} store={this.props.store} onRefresh={() => this.props.onRefresh()} file={outerFile} isCheckMode={true} />
      );
    }

    if (this.state.selectedKeys.length === 0) {
      return null;
    }

    const file = this.state.selectedFile;
    if (file === null) {
      return null;
    }

    const path = this.state.selectedKeys[0];
    const filename = path.split("/").pop();

    if (!file.isLeaf) {
      return (
        <FileTable account={this.props.account} store={this.props.store} onRefresh={() => this.props.onRefresh()} file={file} isCheckMode={false} />
      );
    }

    if (!filename.includes(".")) {
      return (
        <div style={{height: this.getEditorHeightCss()}}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }

    const ext = Setting.getExtFromPath(path);
    const url = this.state.selectedFile.url;

    const app = this.getCacheApp(filename);
    if (app !== "") {
      return (
        <iframe key={path} title={app} src={`${Conf.AppUrl}${app}`} width={"100%"} height={"100%"} />
        // <DataChart filename={filename} url={url} height={this.getEditorHeightCss()} />
      );
    } else if (this.isExtForDocViewer(ext)) {
      // https://github.com/Alcumus/react-doc-viewer
      return (
        <DocViewer
          key={path}
          style={{height: this.getEditorHeightCss(), border: "1px solid rgb(242,242,242)", borderRadius: "6px"}}
          pluginRenderers={DocViewerRenderers}
          documents={[{uri: url}]}
          theme={{
            primary: "rgb(92,48,125)",
            secondary: "#ffffff",
            tertiary: "rgba(92,48,125,0.55)",
            text_primary: "#ffffff",
            text_secondary: "rgb(92,48,125)",
            text_tertiary: "#00000099",
            disableThemeScrollbar: false,
          }}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
              retainURLParams: false,
            },
          }}
        />
      );
    } else if (this.isExtForFileViewer(ext)) {
      // https://github.com/plangrid/react-file-viewer
      return (
        <a target="_blank" rel="noreferrer" href={url}>
          <FileViewer
            key={path}
            fileType={ext}
            filePath={url}
            errorComponent={<div>error</div>}
            onError={(error) => {
              Setting.showMessage("error", error);
            }}
          />
        </a>
      );
    } else if (this.isExtForMarkdownViewer(ext)) {
      // https://github.com/remarkjs/react-markdown
      return (
        <div className="markdownContainer" style={{height: this.getEditorHeightCss(), overflow: "auto", border: "1px solid rgb(242,242,242)", borderRadius: "6px"}}>
          <ReactMarkdown
            key={path}
            remarkPlugins={[remarkGfm, remarkFrontmatter]}
          >
            {this.state.text}
          </ReactMarkdown>
        </div>
      );
    } else {
      // https://github.com/scniro/react-codemirror2
      if (this.state.loading) {
        return (
          <div className="App">
            <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
          </div>
        );
      }

      return (
        <div style={{height: this.getEditorHeightCss()}}>
          <CodeMirror
            key={path}
            value={this.state.text}
            // options={{mode: "javascript", theme: "material-darker"}}
            onBeforeChange={(editor, data, value) => {}}
          />
        </div>
      );
    }
  }

  getPropertyValue(file, propertyName) {
    if (!this.props.store.propertiesMap) {
      return "";
    }

    const properties = this.props.store.propertiesMap[file.key];
    if (properties === undefined) {
      return "";
    } else {
      return properties[propertyName];
    }
  }

  setPropertyValue(file, propertyName, value) {
    const store = this.props.store;
    if (store.propertiesMap[file.key] === undefined) {
      store.propertiesMap[file.key] = {};
    }
    store.propertiesMap[file.key][propertyName] = value;
    this.updateStore(store);
  }

  getMomentTime(t) {
    if (t === "") {
      return "";
    } else {
      return new moment(t);
    }
  }

  renderProperties() {
    if (this.state.selectedKeys.length === 0) {
      return null;
    }

    const file = this.state.selectedFile;
    if (file === null) {
      return null;
    }

    const subjectOptions = [
      {id: "Math", name: i18next.t("store:Math")},
      {id: "Chinese", name: i18next.t("store:Chinese")},
      {id: "English", name: i18next.t("store:English")},
      {id: "Science", name: i18next.t("store:Science")},
      {id: "Physics", name: i18next.t("store:Physics")},
      {id: "Chemistry", name: i18next.t("store:Chemistry")},
      {id: "Biology", name: i18next.t("store:Biology")},
      {id: "History", name: i18next.t("store:History")},
    ];

    const getSubjectDisplayName = (id) => {
      const options = subjectOptions.filter(option => option.id === id);
      if (options.length === 0) {
        return "";
      } else {
        return options[0].name;
      }
    };

    return (
      <div ref={this.filePane}>
        <Descriptions
          style={{backgroundColor: "white"}}
          labelStyle={{backgroundColor: "rgb(245,245,245)"}}
          bordered
          // title="Custom Size"
          size="small"
          // extra={<Button type="primary">Edit</Button>}
        >
          <Descriptions.Item label={i18next.t("store:File name")}>
            {file.title}
          </Descriptions.Item>
          {
            !Conf.EnableExtraPages ? null : (
              <Descriptions.Item label={i18next.t("store:File type")}>
                {Setting.getExtFromFile(file)}
              </Descriptions.Item>
            )
          }
          <Descriptions.Item label={i18next.t("store:File size")}>
            {Setting.getFriendlyFileSize(file.size)}
          </Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Created time")}>
            {Setting.getFormattedDate(file.createdTime)}
          </Descriptions.Item>
          {
            !Conf.EnableExtraPages ? null : (
              <React.Fragment>
                <Descriptions.Item label={i18next.t("store:Collected time")}>
                  {Setting.getFormattedDate(Setting.getCollectedTime(file.title))}
                  <DatePicker key={file.key} showTime defaultValue={this.getMomentTime(this.getPropertyValue(file, "collectedTime"))} onChange={(value, dateString) => {
                    this.setPropertyValue(file, "collectedTime", value.format());
                  }} onOk={(value) => {}} />
                </Descriptions.Item>
                <Descriptions.Item label={i18next.t("store:Subject")}>
                  <Select virtual={false} style={{width: "120px"}} value={getSubjectDisplayName(this.getPropertyValue(file, "subject"))} onChange={(value => {
                    this.setPropertyValue(file, "subject", value);
                  })}>
                    {
                      subjectOptions.map((item, index) => <Option key={index} value={item.id}>{item.name}</Option>)
                    }
                  </Select>
                </Descriptions.Item>
              </React.Fragment>
            )
          }
        </Descriptions>
      </div>
    );
  }

  getEditorHeightCss() {
    // 79, 123
    let filePaneHeight = this.filePane.current?.offsetHeight;
    if (!filePaneHeight) {
      filePaneHeight = 0;
    }

    return `calc(100vh - ${filePaneHeight + 186 - (Conf.EnableExtraPages ? 0 : 50)}px)`;
  }

  render() {
    if (this.props.store.fileTree === null) {
      return (
        <div className="App">
          <Result
            status="error"
            title={`${this.props.store.error}`}
            extra={
              <Button type="primary" onClick={() => this.props.history.push(`/stores/${this.props.store.owner}/${this.props.store.name}`)}>
                Go to Store
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div>
        <Row>
          <Col span={8}>
            <Card className="content-warp-card-filetreeleft" style={{marginRight: "10px"}}>
              <div style={{margin: "-25px"}}>
                {
                  this.renderSearch(this.props.store)
                }
                {
                  this.renderTree(this.props.store)
                }
              </div>
            </Card>
          </Col>
          <Col span={16}>
            <Card className="content-warp-card-filetreeright">
              <div style={{margin: "-25px"}}>
                <div style={{height: this.getEditorHeightCss(), border: "1px solid rgb(242,242,242)", borderRadius: "6px"}}>
                  {
                    this.renderFileViewer(this.props.store)
                  }
                </div>
                {
                  this.renderProperties()
                }
              </div>
            </Card>
          </Col>
        </Row>
        {
          this.renderUploadFileModal()
        }
      </div>
    );
  }
}

export default withRouter(FileTree);
