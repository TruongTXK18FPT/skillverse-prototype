import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ContractManagementPage from '../pages/business/ContractManagementPage';
import MyContractsPage from '../pages/user/MyContractsPage';
import ContractDetailPage from '../components/contract/ContractDetailPage';
import ContractForm from '../components/contract/ContractForm';
import ContractSignPage from '../components/contract/ContractSignPage';

const ContractRoutes: React.FC = () => (
  <Routes>
    {/* Business / Employer — specific paths must come before wildcard */}
    <Route path="/business/contracts/:id/edit" element={<ContractForm />} />
    <Route path="/business/contracts/create" element={<ContractForm />} />
    <Route path="/business/contracts/:id" element={<ContractDetailPage />} />
    <Route path="/business/contracts" element={<ContractManagementPage />} />

    {/* Candidate */}
    <Route path="/my-contracts" element={<MyContractsPage />} />

    {/* Candidate + Employer contract detail & signing */}
    <Route path="/contracts/:id/sign" element={<ContractSignPage />} />
    <Route path="/contracts/:id" element={<ContractDetailPage />} />
  </Routes>
);

export default ContractRoutes;
