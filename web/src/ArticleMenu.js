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

  // Function to build menu items from blocks
  buildMenuItems(blocks) {
    const items = []; // Array to hold the final menu items
    const stack = []; // Stack to maintain the current menu item hierarchy

    blocks.forEach((block, index) => {
      const title = this.truncateText(block.text || block.textEn);
      const key = `${block.type}-${index}`;

      // Basic structure of a menu item
      let menuItem = {
        key,
        label: title,
      };

      // Only set the onClick event for Title, Abstract, and Text block types
      if (["Title", "Abstract", "Text"].includes(block.type)) {
        menuItem = {
          ...menuItem,
          onClick: () => this.gotoRow(blocks, index),
        };
      }

      switch (block.type) {
      case "Title":
      case "Abstract":
      case "Header 1":
        items.push(menuItem);
        stack.length = 0; // Clear the stack
        stack.push(menuItem); // Push the current item onto the stack as a potential parent
        break;
      case "Header 2":
        if (stack.length > 0 && stack[stack.length - 1].key.startsWith("Header 1")) {
          if (!stack[stack.length - 1].children) {
            stack[stack.length - 1].children = [];
          }
          stack[stack.length - 1].children.push(menuItem);
          stack.push(menuItem); // Push the current item onto the stack
        }
        break;
      case "Header 3":
        if (stack.length > 0 && stack[stack.length - 1].key.startsWith("Header 2")) {
          if (!stack[stack.length - 1].children) {
            stack[stack.length - 1].children = [];
          }
          stack[stack.length - 1].children.push(menuItem);
          stack.push(menuItem); // Push the current item onto the stack
        }
        break;
      case "Text":
        if (stack.length > 0) {
          const parentItem = stack[stack.length - 1];
          if (!parentItem.children) {
            parentItem.children = [];
          }
          parentItem.children.push(menuItem);
        } else {
          // If the stack is empty, treat it as a top-level item
          items.push(menuItem);
        }
        break;
      default:
        break;
      }

      // Ensure that Text type does not make subsequent Text as its submenu item, so it does not enter the stack
      if (block.type !== "Text") {
        stack.push(menuItem);
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
