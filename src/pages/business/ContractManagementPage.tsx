import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ContractListPage from '../../components/contract/ContractListPage';
import './ContractManagementPage.css';

const ContractManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="cmp-wrapper">
      <div className="cmp-header">
        <div className="cmp-title-row">
          <h2>Quản lý Hợp đồng</h2>
          <button
            type="button"
            className="cmp-create-btn"
            onClick={() => navigate('/business/contracts/create')}
          >
            <Plus size={16} />
            Tạo hợp đồng mới
          </button>
        </div>
      </div>
      <ContractListPage role="EMPLOYER" />
    </div>
  );
};

export default ContractManagementPage;
