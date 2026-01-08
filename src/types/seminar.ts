export interface Seminar {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    meetingLink?: string;
    startTime: string;
    endTime: string;
    price: number;
    status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'OPEN' | 'CLOSED';
    creatorId: string;
    creatorName: string;
    creatorAvatar: string;
    isOwned: boolean;
    createdAt: string;
    updatedAt: string;
    // Capacity management fields
    maxCapacity?: number;
    ticketsSold: number;
    remainingCapacity?: number;
    isSoldOut: boolean;
}

export interface SeminarCreateRequest {
    title: string;
    description: string;
    imageUrl?: string;
    meetingLink: string;
    startTime: string;
    endTime: string;
    price?: number;
    maxCapacity?: number;
}

export interface SeminarUpdateRequest {
    title?: string;
    description?: string;
    imageUrl?: string;
    meetingLink?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    maxCapacity?: number;
}

export interface SeminarTicket {
    id: number;
    seminarId: number;
    seminarTitle: string;
    seminarImageUrl?: string;
    seminarStatus: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'OPEN' | 'CLOSED';
    seminarStartTime: string;
    seminarEndTime: string;
    meetingLink?: string;
    userId: string;
    pricePaid: number;
    purchasedAt: string;
}

export interface SeminarResponse {
    content: Seminar[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export interface SeminarTicketResponse {
    content: SeminarTicket[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

/**
 * Top speaker by ticket sales for analytics sidebar
 */
export interface TopSpeaker {
    creatorId: string;
    companyName: string;
    totalTicketsSold: number;
}

/**
 * Seminar analytics data for briefing sidebar
 * Vietnamese labels: KÊNH / HOẠT ĐỘNG / HOÀN THÀNH
 */
export interface SeminarAnalytics {
    totalSeminars: number;      // KÊNH (all accepted/open/closed)
    activeSeminars: number;     // HOẠT ĐỘNG (accepted + open)
    completedSeminars: number;  // HOÀN THÀNH (closed)
    topSpeakers: TopSpeaker[];  // Top 4 speakers by ticket sales
}
