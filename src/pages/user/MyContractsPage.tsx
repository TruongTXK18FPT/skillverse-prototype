import React from 'react';
import ContractListPage from '../../components/contract/ContractListPage';
import './MyContractsPage.css';

const MyContractsPage: React.FC = () => {
  return (
    <div className="mcp-wrapper">
      <div className="mcp-header">
        <h2>Hợp đồng của tôi</h2>
      </div>
      <ContractListPage role="CANDIDATE" />
    </div>
  );
};

export default MyContractsPage;
