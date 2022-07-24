import React from "react";
import {Col, Empty, Row, Spin, Tree} from 'antd';
import {createFromIconfontCN} from "@ant-design/icons";
import FileViewer from 'react-file-viewer';
import * as Setting from "./Setting";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

import {Controlled as CodeMirror} from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import i18next from "i18next";
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
      loading: false,
      text: null,
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
  }

  getExtFromPath(path) {
    const filename = path.split("/").pop();
    if (filename.includes(".")) {
      return filename.split('.').pop().toLowerCase();
    } else {
      return "";
    }
  }

  renderTree(tree) {
    const onDragEnter = (info) => {
      // console.log(info); // expandedKeys 需要受控时设置
      // setExpandedKeys(info.expandedKeys)
    };

    const onDrop = (info) => {
      console.log(info);
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
      if (!info.node.isLeaf) {
        return;
      }

      if (selectedKeys.length !== 0) {
        const path = selectedKeys[0];
        const ext = this.getExtFromPath(path);
        if (ext !== "") {
          const url = `${this.props.domain}/${path}`;

          if (["txt", "html", "js", "css", "md"].includes(ext)) {
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
      });
    };

    return (
      <Tree
        height={"calc(100vh - 154px)"}
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
        // treeData={this.state.gData}
        treeData={tree.children}
        titleRender={(file) => {
          if (file.isLeaf) {
            return `${file.title} (${Setting.getFriendlyFileSize(file.fileSize)})`;
          } else {
            return file.title;
          }
        }}
        icon={(file) => {
          if (file.isLeaf) {
            const ext = this.getExtFromPath(file.data.key);
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

  renderFileViewer() {
    if (this.state.selectedKeys.length === 0) {
      return null;
    }

    const path = this.state.selectedKeys[0];
    const filename = path.split("/").pop();
    if (!filename.includes(".")) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      );
    }

    const ext = this.getExtFromPath(path);
    const url = `${this.props.domain}/${path}`;

    if (["bmp", "jpg", "jpeg", "png", "tiff", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf"].includes(ext)) {
      // https://github.com/Alcumus/react-doc-viewer
      return (
        <DocViewer
          style={{height: "calc(100vh - 154px)"}}
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
    }

    if (["txt", "html", "js", "css", "md"].includes(ext)) {
      if (this.state.loading) {
        return (
          <div className="App">
            <Spin size="large" tip={i18next.t("general:Loading...")} style={{paddingTop: "10%"}} />
          </div>
        );
      }

      return (
        <div>
          <CodeMirror
            value={this.state.text}
            // options={{mode: "javascript", theme: "material-darker"}}
            onBeforeChange={(editor, data, value) => {}}
          />
        </div>
      );
    }

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
  }

  render() {
    return (
      <div style={{backgroundColor: "rgb(232,232,232)"}}>
        <Row style={{marginTop: '20px'}} >
          <Col span={7}>
            {
              this.renderTree(this.props.tree)
            }
          </Col>
          <Col span={17}>
            {
              this.renderFileViewer()
            }
          </Col>
        </Row>
      </div>
    )
  }
}

export default FileTree;
