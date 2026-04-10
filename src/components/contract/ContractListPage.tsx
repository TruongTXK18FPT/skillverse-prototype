import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Loader2, Search } from 'lucide-react';
import { ContractListResponse, ContractStatus, CONTRACT_STATUS_DISPLAY } from '../../types/contract';
import contractService from '../../services/contractService';
import { useToast } from '../../hooks/useToast';
import './ContractListPage.css';

interface ContractListPageProps {
  role: 'EMPLOYER' | 'CANDIDATE';
}

const ContractListPage: React.FC<ContractListPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [contracts, setContracts] = useState<ContractListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContracts();
  }, [role]);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const data = await contractService.getMyContracts(role);
      setContracts(data);
    } catch (error) {
      showError('Lỗi tải dữ liệu', 'Không thể tải danh sách hợp đồng.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const info = CONTRACT_STATUS_DISPLAY[status] || {
      text: status,
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
    };
    return (
      <span className={`cl-status-badge cl-status-badge--${info.color.replace('text-', '')}`}>
        {info.text}
      </span>
    );
  };

  const filtered = contracts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.contractType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.contractNumber?.toLowerCase().includes(q) ||
        c.candidateName?.toLowerCase().includes(q) ||
        c.employerName?.toLowerCase().includes(q) ||
        c.jobTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  const getDetailTarget = (contract: ContractListResponse) => ({
    pathname:
      role === 'EMPLOYER'
        ? `/business/contracts/${contract.id}`
        : `/contracts/${contract.id}`,
  });

  return (
    <div className="cl-wrapper">
      {/* Filter bar */}
      <div className="cl-filter-bar">
        <div className="cl-search">
          <Search size={16} className="cl-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm hợp đồng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cl-search-input"
          />
        </div>

        <div className="cl-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cl-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING_SIGNER">Chờ ký</option>
            <option value="PENDING_EMPLOYER">Chờ đối ký</option>
            <option value="SIGNED">Đã ký</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="cl-select"
          >
            <option value="all">Tất cả loại</option>
            <option value="PROBATION">Thử việc</option>
            <option value="FULL_TIME">Toàn thời gian</option>
            <option value="PART_TIME">Thời vụ</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="cl-loading">
          <Loader2 size={24} className="cl-spin" />
          <p>Đang tải danh sách hợp đồng...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cl-empty">
          <FileText size={40} />
          <h4>Chưa có hợp đồng nào</h4>
          <p>Danh sách hợp đồng sẽ xuất hiện ở đây khi có hợp đồng được tạo.</p>
        </div>
      ) : (
        <div className="cl-table-container">
          <table className="cl-table">
            <thead>
              <tr>
                <th>Mã số</th>
                <th>{role === 'EMPLOYER' ? 'Ứng viên' : 'Nhà tuyển dụng'}</th>
                <th>Công việc</th>
                <th>Loại</th>
                <th>Lương/tháng</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => (
                <tr key={contract.id} className="cl-row">
                  <td className="cl-contract-number">{contract.contractNumber}</td>
                  <td>
                    <div className="cl-party-name">
                      {role === 'EMPLOYER' ? contract.candidateName : contract.employerName}
                    </div>
                    <div className="cl-party-email">
                      {role === 'EMPLOYER' ? contract.candidateEmail : contract.employerEmail}
                    </div>
                  </td>
                  <td className="cl-job-title">{contract.jobTitle || '-'}</td>
                  <td>
                    <span className="cl-type-badge">
                      {contract.contractType === 'PROBATION'
                        ? 'Thử việc'
                        : contract.contractType === 'FULL_TIME'
                        ? 'Toàn thời gian'
                        : 'Thời vụ'}
                    </span>
                  </td>
                  <td className="cl-salary">{formatSalary(contract.salary)}</td>
                  <td>{getStatusBadge(contract.status as ContractStatus)}</td>
                  <td className="cl-date">{formatDate(contract.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="cl-action-btn"
                      onClick={() => {
                        const target = getDetailTarget(contract);
                        navigate(target.pathname);
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContractListPage;
