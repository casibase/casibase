import React, { Component } from "react";
import ReactEcharts from 'echarts-for-react';

class VideoDataChart extends Component {
  drawPic(data, nowTime) {
    const xAxisData = data.map(item => Number(item.time));
    const seriesData = data.map(item => ({
      value: Number(item.data),
      error: Number(item.confidence)
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

    const option = {
      grid: {
        top: '5%',
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData
      },
      yAxis: {
        type: 'value',
        min: dataMin,
        max: dataMax
      },
      series: [
        {
          name: 'Data',
          type: 'line',
          data: seriesData
        }
      ],
      markLine: {
        symbol: 'none',
        lineStyle: {
          color: 'red'
        },
        data: [
          {
            xAxis: nowTime,
            yAxis: dataMin,
            symbol: 'none',
            lineStyle: {
              color: 'red'
            }
          },
          {
            xAxis: nowTime,
            yAxis: dataMax,
            symbol: 'none',
            lineStyle: {
              color: 'red'
            }
          }
        ]
      }
    };

    return (
      <ReactEcharts
        option={option}
        style={{ height: '200px' }}
      />
    );
  }

  render() {
    const nowTime = 285;

    return (
      <div>
        {this.drawPic(this.props.data, nowTime)}
      </div>
    );
  }
}

export default VideoDataChart;
