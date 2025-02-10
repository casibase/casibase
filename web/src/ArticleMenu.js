// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
import {Menu} from "antd";

class ArticleMenu extends React.Component {
  // Function to truncate text exceeding a certain length
  truncateText(text, maxLength = 35) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  // Function to recursively collect all menu item keys that should be open
  collectOpenKeys(items, openKeys = []) {
    items.forEach(item => {
      // Add the current item's key to the openKeys array
      openKeys.push(item.key);

      // If the current item has a submenu, recursively collect its submenu item keys
      if (item.children && item.children.length > 0) {
        this.collectOpenKeys(item.children, openKeys);
      }
    });

    return openKeys;
  }

  buildMenuItems(blocks) {
    const items = [];
    let lastHeader1 = null;
    let lastHeader2 = null;
    let lastHeader3 = null;

    blocks.forEach((block, index) => {
      const title = block.prefix + this.truncateText(block.text || block.textEn);
      const key = `${block.type}-${index}`;

      const menuItem = {key, label: title};

      if (["Title", "Abstract", "Text"].includes(block.type)) {
        menuItem.onClick = () => this.gotoRow(blocks, index);
      }

      switch (block.type) {
      case "Title":
      case "Abstract":
      case "Header 1":
        items.push(menuItem);
        lastHeader1 = menuItem;
        lastHeader2 = null;
        lastHeader3 = null;
        break;
      case "Header 2":
        if (lastHeader1) {
          lastHeader1.children = lastHeader1.children || [];
          lastHeader1.children.push(menuItem);
          lastHeader2 = menuItem;
          lastHeader3 = null;
        }
        break;
      case "Header 3":
        if (lastHeader2) {
          lastHeader2.children = lastHeader2.children || [];
          lastHeader2.children.push(menuItem);
          lastHeader3 = menuItem;
        }
        break;
      case "Text":
        const parent = lastHeader3 || lastHeader2 || lastHeader1;
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuItem);
        } else {
          items.push(menuItem);
        }
        break;
      default:
        break;
      }
    });

    return items;
  }

  // Function to navigate to a specific block
  gotoRow(blocks, index) {
    this.props.onGoToRow(blocks, index);
  }

  render() {
    const items = this.buildMenuItems(this.props.table || []);
    // Use collectOpenKeys function to get all keys of menu items that should be open
    const defaultOpenKeys = this.collectOpenKeys(items);

    return (
      <Menu
        mode="inline"
        items={items}
        style={{height: "100%", borderRight: 0}}
        defaultOpenKeys={defaultOpenKeys} // Use the collected keys as the default open menu items
      />
    );
  }
}

export default ArticleMenu;
