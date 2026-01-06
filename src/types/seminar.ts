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
