export type VoiceOption = {
  id: string;
  label: string;
  note?: string;
  popular?: boolean;
};

// FPT.AI Vietnamese voices commonly used
export const FPT_VOICES: VoiceOption[] = [
  { id: 'banmai', label: 'Ban Mai (Nữ miền Bắc)', popular: true, note: 'Most Popular' },
  { id: 'leminh', label: 'Lê Minh (Nam miền Bắc)' },
  { id: 'thuminh', label: 'Thu Minh (Nữ miền Bắc)' },
  { id: 'myan', label: 'Mỹ An (Nữ miền Trung)' },
  { id: 'giahuy', label: 'Gia Huy (Nam miền Trung)' },
  { id: 'ngoclam', label: 'Ngọc Lam (Nữ miền Trung)' },
  { id: 'minhquang', label: 'Minh Quang (Nam miền Nam)' },
  { id: 'linhsan', label: 'Linh San (Nữ miền Nam)' },
  { id: 'lannhi', label: 'Lan Nhi (Nữ miền Nam)' },
];

