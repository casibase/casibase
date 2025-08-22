// Copyright 2023 The Casibase Authors.. All Rights Reserved.
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
import {Button, Card, Col, Row, Table, Typography, Pagination} from "antd";
import {Link} from "react-router-dom";
import * as IpfsArchiveBackend from "../backend/IpfsArchiveBackend";
import * as Setting from "../Setting";
import i18next from "i18next";
import DataTypeConverter from "../common/DataTypeConverter";
import "./IpfsSearchResultPage.less"
const {Title} = Typography;

class IPFSSearchResultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      correlationId: props.match.params.correlationId,
      archives: [],
      loading: true,
      groupedArchives: {},
      pagination: {}, // 存储每个dataType的分页信息
      allDataTypes: []
    };
  }

  componentDidMount() {
    // 获取所有数据类型
    const dataTypes = Object.keys(DataTypeConverter.getAllDataTypes()).map(Number);
    this.setState({allDataTypes: dataTypes}, () => {
      this.searchArchives();
    });
  }

  searchArchives() {
    this.setState({loading: true});
    const {correlationId, allDataTypes, pagination} = this.state;
    let completedRequests = 0;
    let newGroupedArchives = {};

    // 依次搜索每个dataType
    allDataTypes.forEach(dataType => {
      const pageInfo = pagination[dataType] || {current: 1, pageSize: 10};
      IpfsArchiveBackend.getIpfsArchivesByCorrelationIdAndDataType(
        pageInfo.current.toString(), 
        pageInfo.pageSize.toString(), 
        dataType, 
        correlationId
      )
        .then((res) => {
          completedRequests++;
          if (res.status === "ok" && res.data && res.data.length > 0) {
            newGroupedArchives[dataType] = res.data;
            // 存储总数，用于分页
            if (res.total) {
              newGroupedArchives[`${dataType}_total`] = res.total;
            }
          }

          // 所有请求都完成后处理结果
          if (completedRequests === allDataTypes.length) {
            this.setState({
              groupedArchives: newGroupedArchives,
              loading: false
            });
          }
        })
        .catch(error => {
          completedRequests++;
          Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);

          // 即使出错，也要确保所有请求都被标记为完成
          if (completedRequests === allDataTypes.length) {
            this.setState({
              loading: false
            });
          }
        });
    });
  }

  groupByDataType(archives) {
    return archives.reduce((groups, archive) => {
      const dataType = archive.dataType;
      if (!groups[dataType]) {
        groups[dataType] = [];
      }
      groups[dataType].push(archive);
      return groups;
    }, {});
  }

  handlePageChange(dataType, page, pageSize) {
    const {pagination} = this.state;
    this.setState({
      pagination: {
        ...pagination,
        [dataType]: {
          current: page,
          pageSize
        }
      }
    }, () => {
      this.searchArchives();
    });
  }

  renderTable(archives, dataType) {
    const columns = [
      {
        title: i18next.t("ipfsArchive:Record ID"),
        dataIndex: "recordId",
        key: "recordId",
        render: (text) => text || "---"
      },
      {
        title: i18next.t("ipfsArchive:IPFS Address"),
        dataIndex: "ipfsAddress",
        key: "ipfsAddress",
        render: (text) => text || "---"
      },
      {
        title: i18next.t("ipfsArchive:Upload Time"),
        dataIndex: "uploadTime",
        key: "uploadTime",
        render: (text) => text === "0000-00-00 00:00:00" ? "---" : text
      },
      {
        title: i18next.t("general:Action"),
        key: "action",
        render: (_, record) => (
          <Button type="primary"
            component={Link}
            to={`/ipfs-archive/edit/${encodeURIComponent(record.id)}`}>
            {i18next.t("general:View")}
          </Button>
        )
      }
    ];

    const {pagination, groupedArchives} = this.state;
    const pageInfo = pagination[dataType] || {current: 1, pageSize: 10};
    const total = groupedArchives[`${dataType}_total`] || 0;

    return (
      <div>
        <Table
          columns={columns}
          dataSource={archives}
          rowKey="id"
          pagination={false}
          loading={this.state.loading}
        />
        <div style={{marginTop: 16, textAlign: 'right'}}>
          <Pagination
            current={pageInfo.current}
            pageSize={pageInfo.pageSize}
            total={total}
            onChange={(page, pageSize) => this.handlePageChange(dataType, page, pageSize)}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      </div>
    );
  }

  render() {
    const {correlationId, groupedArchives} = this.state;
    const dataTypes = Object.keys(groupedArchives);

    return (
      <div className="ipfs-search-result-page">
        <Row justify="center" style={{marginTop: "20px"}}>
          <Col xs={24} md={20} lg={16}>
            <Card
              title={<Title level={2}>{i18next.t("ipfsSearch:Search Result for")} {correlationId}</Title>}
              style={{marginBottom: "20px"}}
            >
              {dataTypes.length > 0 ? (
                dataTypes.map((dataType) => (
                  <div key={dataType} style={{marginBottom: "30px"}}>
                    <Title level={3} style={{marginBottom: "16px"}}>
                      {DataTypeConverter.convertToChinese(parseInt(dataType))}
                    </Title>
                    {this.renderTable(groupedArchives[dataType], dataType)}
                  </div>
                ))
              ) : (
                <div style={{textAlign: "center", padding: "20px"}}>
                  <Title level={4}>{i18next.t("ipfsSearch:No results found")}</Title>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default IPFSSearchResultPage;