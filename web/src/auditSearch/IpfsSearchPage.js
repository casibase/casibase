import React, { Component } from 'react';
import { Input, Button, Layout, Typography, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { withRouter } from 'react-router-dom';
import './IpfsSearchPage.less';

export class IPFSSearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correlationId: '',
      focused: false,
    };
  }

  handleInputChange = (e) => {
    this.setState({
      correlationId: e.target.value,
    });
  };

  handleSearch = () => {
    const { correlationId } = this.state;
    if (correlationId.trim()) {
      // 跳转到结果页面
      this.props.history.push(`/ipfs-search/result/${correlationId}`);
    } else {
      // 提示用户输入
      message.error('请输入有效的索引(correlationId)');
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleBlur = () => {
    this.setState({ focused: false });
  };

  render() {
    const { correlationId, focused } = this.state;
    const { Title } = Typography;
    const { Content } = Layout;

    return (
      <div className="ipfs-search-layout">

        <Content className="ipfs-search-content">
          <div className="ipfs-search-header">
            <Title level={2} className="ipfs-search-title">信息查询</Title>
          </div>
          <div className="ipfs-search-body">
            <Space direction="vertical" size="large" className="ipfs-search-space">
              <div className={`ipfs-search-input-wrapper ${focused ? 'focused' : ''}`}>
                <div className="ipfs-search-input-container">
                  <SearchOutlined className="ipfs-search-icon" />
                  <Input
                    placeholder="请输入索引(correlationId)"
                    value={correlationId}
                    variant="borderless"
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleKeyPress}
                    size="large"
                    className="ipfs-search-input"
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    autoFocus
                  />
                  <Button
                    type="primary"
                    onClick={this.handleSearch}
                    disabled={!correlationId.trim()}
                    className="ipfs-search-button"
                  >
                    搜索
                  </Button>
                </div>
              </div>
            </Space>
          </div>
        </Content>
      </div>
    );
  }
}

export default withRouter(IPFSSearchPage);