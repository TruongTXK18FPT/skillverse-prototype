import axiosInstance from "./axiosInstance";
import {
  CertificateDTO,
  CertificateVerificationDTO,
} from "../data/certificateDTOs";

export const getMyCertificateById = async (
  certificateId: number
): Promise<CertificateDTO> => {
  const response = await axiosInstance.get<CertificateDTO>(`/certificates/${certificateId}`);
  return response.data;
};

export const getPublicCertificateBySerial = async (
  serial: string
): Promise<CertificateVerificationDTO> => {
  const response = await axiosInstance.get<CertificateVerificationDTO>(
    `/certificates/verify/${encodeURIComponent(serial)}`
  );
  return response.data;
};
