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
import {Select} from "antd";
import i18next from "i18next";
import * as StoreBackend from "./backend/StoreBackend";
import * as Setting from "./Setting";

function StoreSelect(props) {
  const {onChange, initValue, style, onSelect, withAll, className} = props;
  const [stores, setStores] = React.useState([]);
  const [value, setValue] = React.useState(initValue);

  React.useEffect(() => {
    if (props.stores === undefined) {
      getStores();
    }
    window.addEventListener("storesChanged", getStores);
    return function() {
      window.removeEventListener("storesChanged", getStores);
    };
  }, [value]);

  const getStores = () => {
    StoreBackend.getStoreNames("admin")
      .then((res) => {
        if (res.status === "ok") {
          setStores(res.data);
          const selectedValueExist = res.data.filter(store => store.name === value).length > 0;
          if (initValue === undefined || !selectedValueExist) {
            handleOnChange(getStoreItems().length > 0 ? getStoreItems()[0].value : "");
          }
        }
      });
  };

  const handleOnChange = (value) => {
    setValue(value);
    onChange?.(value);
  };

  const getStoreItems = () => {
    const items = [];

    stores.forEach((store) => items.push(Setting.getOption(store.displayName, store.name)));

    if (withAll) {
      items.unshift({
        label: i18next.t("store:All"),
        value: "All",
      });
    }

    return items;
  };

  return (
    <Select
      options={getStoreItems()}
      virtual={false}
      popupMatchSelectWidth={false}
      placeholder={i18next.t("store:Please select a store")}
      value={value}
      onChange={handleOnChange}
      filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
      style={style}
      onSelect={onSelect}
      className={className}
    >
    </Select>
  );
}

export default StoreSelect;
