import React from "react";
import {Button, Col, Descriptions, Empty, Input, Popconfirm, Row, Spin, Tooltip, Tree, Upload} from 'antd';
import {CloudUploadOutlined, createFromIconfontCN, DeleteOutlined, DownloadOutlined, FileDoneOutlined, FolderAddOutlined} from "@ant-design/icons";
import * as Setting from "./Setting";
import * as FileBackend from "./backend/FileBackend";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import FileViewer from 'react-file-viewer';
import i18next from "i18next";
import * as PermissionBackend from "./backend/PermissionBackend";
import * as PermissionUtil from "./PermissionUtil";
import * as Conf from "./Conf";
import FileTable from "./FileTable";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
// require("codemirror/theme/material-darker.css");
// require("codemirror/mode/javascript/javascript");

const IconFont = createFromIconfontCN({
  scriptUrl: 'https://cdn.open-ct.com/icon/iconfont.js',
});

const x = 3;
const y = 2;
const z = 1;
const defaultData = [];

const generateData = (_level, _preKey, _tns) => {
  const preKey = _preKey || '0';
  const tns = _tns || defaultData;
  const children = [];

  for (let i = 0; i < x; i++) {
    const key = `${preKey}-${i}`;
    tns.push({
      title: key,
      key,
    });

    if (i < y) {
      children.push(key);
    }
  }

  if (_level < 0) {
    return tns;
  }

  const level = _level - 1;
  children.forEach((key, index) => {
    tns[index].children = [];
    return generateData(level, key, tns[index].children);
  });
};

generateData(z);

class FileTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      gData: defaultData,
      expandedKeys: ['0-0', '0-0-0', '0-0-0-0'],
      selectedKeys: [],
      selectedFile: null,
      loading: false,
      text: null,
      newFolder: null,
      permissions: null,
      permissionMap: null,
    };

    this.filePane = React.createRef();
  }

  componentWillMount() {
    this.getPermissions();
  }

  getPermissionMap(permissions) {
    let permissionMap = {};
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
      .then((permissions) => {
        permissions = permissions.filter(permission => (permission.domains[0] === this.props.store.name) && permission.users.length !== 0);
        this.setState({
          permissions: permissions,
          permissionMap: this.getPermissionMap(permissions),
        });
      });
  }

  uploadFile(file, info) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;

    // this.setState({uploading: true});
    const filename = info.fileList[0].name;
    FileBackend.addFile(storeId, file.key, true, filename, info.file)
      .then(res => {
        Setting.showMessage("success", `File uploaded successfully`);
        window.location.reload();
      })
      .catch(error => {
        Setting.showMessage("error", `File failed to upload: ${error}`);
      });
  };

  addFile(file, newFolder) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;
    FileBackend.addFile(storeId, file.key, false, newFolder, null)
      .then((res) => {
        Setting.showMessage("success", `File added successfully`);
        window.location.reload();
      })
      .catch(error => {
        Setting.showMessage("error", `File failed to add: ${error}`);
      });
  }

  deleteFile(file, isLeaf) {
    const storeId = `${this.props.store.owner}/${this.props.store.name}`;
    FileBackend.deleteFile(storeId, file.key, isLeaf)
      .then((res) => {
        if (res === true) {
          Setting.showMessage("success", `File deleted successfully`);
          window.location.reload();
        } else {
          Setting.showMessage("error", `File failed to delete: ${res}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `File failed to delete: ${error}`);
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
      <span onClick={(e) => {
        Setting.openLink(Setting.getMyProfileUrl(this.props.account).replace("/account", `/permissions/${permission.owner}/${permission.name}`));
        e.stopPropagation();
      }}
      >
        {
          permission.users.map(user => {
            const username = user.split("/")[1];
            return Setting.getTag(username, permission.actions[0], permission.state);
          })
        }
      </span>
    )
  }

  renderPermissions(permissions, isReadable) {
    if (permissions === undefined) {
      return null;
    }

    return permissions.map(permission => this.renderPermission(permission, isReadable));
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
    return this.isFileOk(file, "Read")
  }

  isFileWritable(file) {
    return this.isFileOk(file, "Write")
  }

  isFileAdmin(file) {
    if (Setting.isLocalAdminUser(this.props.account)) {
      return true;
    }

    return this.isFileOk(file, "Admin")
  }

  renderTree(store) {
    const onDragEnter = (info) => {
      // console.log(info); // expandedKeys 需要受控时设置
      // setExpandedKeys(info.expandedKeys)
    };

    const onDrop = (info) => {
      const dropKey = info.node.key;
      const dragKey = info.dragNode.key;
      const dropPos = info.node.pos.split('-');
      const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

      const loop = (data, key, callback) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].key === key) {
            return callback(data[i], i, data);
          }

          if (data[i].children) {
            loop(data[i].children, key, callback);
          }
        }
      };

      const data = [...this.state.gData]; // Find dragObject

      let dragObj;
      loop(data, dragKey, (item, index, arr) => {
        arr.splice(index, 1);
        dragObj = item;
      });

      if (!info.dropToGap) {
        // Drop on the content
        loop(data, dropKey, (item) => {
          item.children = item.children || []; // where to insert 示例添加到头部，可以是随意位置

          item.children.unshift(dragObj);
        });
      } else if (
        (info.node.props.children || []).length > 0 && // Has children
        info.node.props.expanded && // Is expanded
        dropPosition === 1 // On the bottom gap
      ) {
        loop(data, dropKey, (item) => {
          item.children = item.children || []; // where to insert 示例添加到头部，可以是随意位置

          item.children.unshift(dragObj); // in previous version, we use item.children.push(dragObj) to insert the
          // item to the tail of the children
        });
      } else {
        let ar = [];
        let i;
        loop(data, dropKey, (_item, index, arr) => {
          ar = arr;
          i = index;
        });

        if (dropPosition === -1) {
          ar.splice(i, 0, dragObj);
        } else {
          ar.splice(i + 1, 0, dragObj);
        }
      }

      this.setState({
        gData: data,
      });
    };

    const onSelect = (selectedKeys, info) => {
      if (!this.isFileReadable(info.node)) {
        Setting.showMessage("error", i18next.t("store:Sorry, you are unauthorized to access this file or folder"));
        return;
      }

      if (selectedKeys.length !== 0) {
        const path = selectedKeys[0];
        const ext = Setting.getExtFromPath(path);
        if (ext !== "") {
          const url = `${store.domain}/${path}`;

          if (!this.isExtForDocViewer((ext) && !this.isExtForFileViewer(ext))) {
            this.setState({
              loading: true,
            });

            fetch(url, {method: 'GET'})
              .then(res => res.text())
              .then(res => {
                this.setState({
                  text: res,
                  loading: false,
                });
            });
          }
        }
      }

      this.setState({
        selectedKeys: selectedKeys,
        selectedFile: info.node,
      });
    };

    const fileTree = Setting.getTreeWithParents(store.fileTree);

    return (
      <Tree
        height={"calc(100vh - 138px)"}
        virtual={false}
        className="draggable-tree"
        multiple={false}
        defaultExpandAll={true}
        // defaultExpandedKeys={tree.children.map(file => file.key)}
        draggable={false}
        blockNode
        showLine={true}
        showIcon={true}
        onDragEnter={onDragEnter}
        onDrop={onDrop}
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
                      <Tooltip title={i18next.t("store:Download")}>
                        <Button style={{marginRight: "5px"}} icon={<DownloadOutlined />} size="small" onClick={(e) => {
                          Setting.showMessage("success", "Successfully downloaded");
                          const url = `${store.domain}/${file.key}`;
                          Setting.openLink(url);
                          e.stopPropagation();
                        }} />
                      </Tooltip>
                    )
                  }
                  {
                    !isWritable ? null : (
                      <React.Fragment>
                        {/*<Tooltip title={i18next.t("store:Rename")}>*/}
                        {/*  <Button style={{marginRight: "5px"}} icon={<EditOutlined />} size="small" onClick={(e) => {*/}
                        {/*    Setting.showMessage("error", "Rename");*/}
                        {/*    e.stopPropagation();*/}
                        {/*  }} />*/}
                        {/*</Tooltip>*/}
                        {/*<Tooltip title={i18next.t("store:Move")}>*/}
                        {/*  <Button style={{marginRight: "5px"}} icon={<RadiusSettingOutlined />} size="small" onClick={(e) => {*/}
                        {/*    Setting.showMessage("error", "Move");*/}
                        {/*    e.stopPropagation();*/}
                        {/*  }} />*/}
                        {/*</Tooltip>*/}
                        <Tooltip title={i18next.t("store:Delete")}>
                        <span onClick={(e) => e.stopPropagation()}>
                          <Popconfirm
                            title={`Sure to delete file: ${file.title} ?`}
                            onConfirm={(e) => {
                              this.deleteFile(file, true);
                            }}
                            okText="OK"
                            cancelText="Cancel"
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
            )
          } else {
            return (
              <Tooltip color={"rgb(255,255,255,0.8)"} placement="right" title={
                <div>
                  {
                    !isWritable ? null : (
                      <React.Fragment>
                        <Tooltip color={"rgb(255,255,255)"} placement="top" title={
                          <div>
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
                          </div>
                        }>
                          <Button style={{marginRight: "5px"}} icon={<FolderAddOutlined />} size="small" onClick={(e) => {
                            this.addFile();
                            e.stopPropagation();
                          }} />
                        </Tooltip>
                        <Tooltip title={i18next.t("store:Upload file")}>
                          <Upload maxCount={1} accept="*" showUploadList={false} beforeUpload={file => {return false;}} onChange={info => {
                            this.uploadFile(file, info);
                          }}
                          >
                            <Button style={{marginRight: "5px"}} icon={<CloudUploadOutlined />} size="small" />
                          </Upload>
                          {/*<Button style={{marginRight: "5px"}} icon={<CloudUploadOutlined />} size="small" onClick={(e) => {*/}
                          {/*  Setting.showMessage("error", "Upload file");*/}
                          {/*  e.stopPropagation();*/}
                          {/*}} />*/}
                        </Tooltip>
                        {
                          file.key === "/" ? null : (
                            <Tooltip title={i18next.t("store:Delete")}>
                        <span onClick={(e) => e.stopPropagation()}>
                          <Popconfirm
                            title={`Sure to delete folder: ${file.title} ?`}
                            onConfirm={(e) => {
                              this.deleteFile(file, false);
                            }}
                            okText="OK"
                            cancelText="Cancel"
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
            )
          }
        }}
        icon={(file) => {
          if (file.isLeaf) {
            const ext = Setting.getExtFromPath(file.data.key);
            if (ext === "pdf") {
              return <IconFont type='icon-testpdf' />
            } else if (ext === "doc" || ext === "docx") {
              return <IconFont type='icon-testdocx' />
            } else if (ext === "ppt" || ext === "pptx") {
              return <IconFont type='icon-testpptx' />
            } else if (ext === "xls" || ext === "xlsx") {
              return <IconFont type='icon-testxlsx' />
            } else if (ext === "txt") {
              return <IconFont type='icon-testdocument' />
            } else if (ext === "png" || ext === "bmp" || ext === "jpg" || ext === "jpeg" || ext === "svg") {
              return <IconFont type='icon-testPicture' />
            } else if (ext === "html") {
              return <IconFont type='icon-testhtml' />
            } else if (ext === "js") {
              return <IconFont type='icon-testjs' />
            } else if (ext === "css") {
              return <IconFont type='icon-testcss' />
            } else {
              return <IconFont type='icon-testfile-unknown' />
            }
          } else {
            return <IconFont type='icon-testfolder' />
          }
        }}
      />
    );
  }

  isExtForDocViewer(ext) {
    return ["bmp", "jpg", "jpeg", "png", "tiff", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf"].includes(ext);
  }

  isExtForFileViewer(ext) {
    return ["png", "jpg", "jpeg", "gif", "bmp", "pdf", "csv", "xlsx", "docx", "mp4", "webm", "mp3"].includes(ext);
  }

  renderFileViewer(store) {
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
        <FileTable file={file} />
      )
    }

    if (!filename.includes(".")) {
      return (
        <div style={{height: this.getEditorHeightCss()}}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }

    const ext = Setting.getExtFromPath(path);
    const url = `${store.domain}/${path}`;

    if (this.isExtForDocViewer(ext)) {
      // https://github.com/Alcumus/react-doc-viewer
      return (
        <DocViewer
          key={path}
          style={{height: this.getEditorHeightCss()}}
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
              retainURLParams: false
            }
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

  renderProperties() {
    if (this.state.selectedKeys.length === 0) {
      return null;
    }

    const file = this.state.selectedFile;
    if (file === null) {
      return null;
    }

    return (
      <div ref={this.filePane}>
        <Descriptions
          bordered
          // title="Custom Size"
          size="small"
          // extra={<Button type="primary">Edit</Button>}
        >
          <Descriptions.Item label={i18next.t("vectorset:File name")}>{file.title}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("vectorset:File size")}>{Setting.getFriendlyFileSize(file.size)}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("general:Created time")}>{Setting.getFormattedDate(file.createdTime)}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("store:File type")}>{file.title.split('.')[1]}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("store:Path")}>{file.key}</Descriptions.Item>
          <Descriptions.Item label={i18next.t("store:Is leaf")}>{
            file.isLeaf ? i18next.t("store:True") :
              i18next.t("store:False")
          }</Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  getEditorHeightCss() {
    // 79, 123
    const filePaneHeight = this.filePane.current?.offsetHeight;
    return `calc(100vh - ${filePaneHeight + 138}px)`;
  }

  render() {
    return (
      <div style={{backgroundColor: "rgb(232,232,232)", borderTop: "1px solid rgb(232,232,232)"}}>
        <Row>
          <Col span={8}>
            {
              this.renderTree(this.props.store)
            }
          </Col>
          <Col span={16}>
            <div>
              <div style={{height: this.getEditorHeightCss()}}>
                {
                  this.renderFileViewer(this.props.store)
                }
              </div>
              {
                this.renderProperties()
              }
            </div>
          </Col>
        </Row>
      </div>
    )
  }
}

export default FileTree;
