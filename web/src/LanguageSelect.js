import React from "react";
import * as Setting from "./Setting";
import {Dropdown, Menu} from "antd";

function flagIcon(country, alt) {
  return (
    <img width={24} alt={alt} src={`${Setting.StaticBaseUrl}/flag-icons/${country}.svg`} />
  );
}

class LanguageSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      languages: props.languages ?? Setting.Countries.map(item => item.key),
    };

    Setting.Countries.forEach((country) => {
      new Image().src = `${Setting.StaticBaseUrl}/flag-icons/${country.country}.svg`;
    });
  }

  items = Setting.Countries.map((country) => Setting.getItem(country.label, country.key, flagIcon(country.country, country.alt)));

  getOrganizationLanguages(languages) {
    const select = [];

    for (const language of languages) {
      this.items.map((item, index) => {
        if (item.key === language) {
          select.push(
            <Menu.Item key={item.key} onClick={this.handleLanguageSelect}>
              {item.icon} {item.label}
            </Menu.Item>
          );
        }
      });
    }

    return select;
  }

  handleLanguageSelect = (e) => {
    Setting.changeLanguage(e.key);
  };

  render() {
    const languageItems = this.getOrganizationLanguages(this.state.languages);

    const languageMenu = (
      <Menu onClick={this.handleLanguageSelect.bind(this)}>
        {languageItems}
      </Menu>
    );

    return (
      <Dropdown overlay={languageMenu} className="rightDropDown">
        <div className="language_box">
        </div>
      </Dropdown>
    );
  }
}

export default LanguageSelect;
