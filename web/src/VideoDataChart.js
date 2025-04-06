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

import React, {Component} from "react";
import ReactEcharts from "echarts-for-react";

class VideoDataChart extends Component {
  drawPic(data, currentTime, height) {
    const xAxisData = data.map(item => item.time);
    const seriesData = data.map(item => ({
      value: item.data,
      error: item.confidence,
    }));

    let dataMax = -Infinity;
    let dataMin = Infinity;
    for (let i = 0; i < seriesData.length; i++) {
      const value = seriesData[i].value;

      if (value > dataMax) {
        dataMax = value;
      }
      if (value < dataMin) {
        dataMin = value;
      }
    }

    let currentItem = null;
    for (const item of data) {
      if (item.time <= currentTime) {
        currentItem = item;
      } else {
        break;
      }
    }
    const newCurrentTime = currentItem?.time;

    const option = {
      grid: {
        top: "5%",
        left: "3%",
        right: "4%",
        bottom: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        axisPointer: {
          value: (newCurrentTime - (data[0] === undefined ? 0 : data[0].time)) / 5,
          snap: false,
          lineStyle: {
            color: "#ff4d4f",
            width: 2,
          },
          label: {
            show: true,
            formatter: function(params) {
              return newCurrentTime;
            },
            color: "#ff4d4f",
            backgroundColor: "#fff2f0",
            borderColor: "#ffccc7",
          },
          handle: {
            show: true,
            color: "",
          },
        },
      },
      yAxis: {
        type: "value",
        min: dataMin,
        max: dataMax,
      },
      series: [
        {
          name: "Data",
          type: "line",
          data: seriesData,
          lineStyle: {
            color: "#ccb6fa",
          },
          itemStyle: {
            color: "#5734d3",
          },
        },
      ],
    };

    return (
      <ReactEcharts
        option={option}
        style={{height: height}}
      />
    );
  }

  render() {
    let data = this.props.data;
    const currentTime = this.props.currentTime;
    const interval = this.props.interval;
    let height = this.props.height;

    if (interval !== undefined && interval !== null) {
      data = data.filter(item => currentTime - interval < item.time && item.time < currentTime + interval);
    }

    if (height === undefined || height === null) {
      height = "200px";
    }

    return (
      <div>
        {this.drawPic(data, currentTime, height)}
      </div>
    );
  }
}

export default VideoDataChart;
