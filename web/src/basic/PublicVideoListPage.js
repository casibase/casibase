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
import {Radio} from "antd";
import * as VideoBackend from "../backend/VideoBackend";
import GridCards from "./GridCards";
import i18next from "i18next";

const PublicVideoListPage = (props) => {
  const [videos, setVideos] = React.useState(null);
  const [grade, setGrade] = React.useState("All");

  React.useEffect(() => {
    if (props.account === null) {
      return;
    }
    VideoBackend.getGlobalVideos()
      .then((res) => {
        let videos = res.data || [];
        videos = videos.filter((video) => video.isPublic === true);
        setVideos(videos);
      });
  }, [props.account]);

  const getItems = () => {
    if (videos === null) {
      return null;
    }

    let filteredVideos = videos;
    if (grade !== "All") {
      filteredVideos = videos.filter((video) => video.grade2 === grade);
    }

    return filteredVideos.map(video => {
      let comment = "";
      if (video.remarks2 && video.remarks2.length > 0) {
        comment = video.remarks2[0].text;
      }

      return {
        link: `/public-videos/${video.owner}/${video.name}`,
        name: video.displayName,
        description: video.description,
        logo: video.coverUrl,
        createdTime: comment,
      };
    });
  };

  const renderRadio = () => {
    return (
      <Radio.Group block style={{marginBottom: "10px", width: "100%"}} buttonStyle="solid" value={grade} onChange={e => {
        setGrade(e.target.value);
      }}>
        <Radio.Button value={"All"}>{i18next.t("video:All")}</Radio.Button>
        <Radio.Button value={"Grade 1"}>{i18next.t("video:Grade 1")}</Radio.Button>
        <Radio.Button value={"Grade 2"}>{i18next.t("video:Grade 2")}</Radio.Button>
        <Radio.Button value={"Grade 3"}>{i18next.t("video:Grade 3")}</Radio.Button>
      </Radio.Group>
    );
  };

  return (
    <div style={{display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
      {
        renderRadio()
      }
      <GridCards items={getItems()} />
    </div>
  );
};

export default PublicVideoListPage;
