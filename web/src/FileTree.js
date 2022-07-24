import React from "react";
import {Col, Empty, Row, Tree} from 'antd';
import FileViewer from 'react-file-viewer';
import * as Setting from "./Setting";

const { DirectoryTree } = Tree;

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
    };
  }

  updateTable(table) {
    this.props.onUpdateTable(table);
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

      this.setState({
        selectedKeys: selectedKeys,
      });
    };

    return (
      <DirectoryTree
        height={"calc(100vh - 154px)"}
        virtual={false}
        className="draggable-tree"
        multiple={false}
        defaultExpandAll={true}
        defaultExpandedKeys={this.state.expandedKeys}
        draggable
        blockNode
        onDragEnter={onDragEnter}
        onDrop={onDrop}
        onSelect={onSelect}
        selectedKeys={this.state.selectedKeys}
        // treeData={this.state.gData}
        treeData={tree.children}
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

    const ext = filename.split('.').pop().toLowerCase();
    const url = `${this.props.domain}/${path}`;
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
          <Col span={6}>
            {
              this.renderTree(this.props.tree)
            }
          </Col>
          <Col span={2}>
          </Col>
          <Col span={16}>
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
