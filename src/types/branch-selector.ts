export type BranchRecord = {
  id: string;
  name: string;
  isActive?: boolean;
  restaurantId?: string | null;
  address?: {
    area?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  settings?: {
    openingHours?: Array<{
      dayOfWeek?: string;
      isClosed?: boolean;
      openTime?: string;
      closeTime?: string;
    }>;
  };
};

export type BranchOption = BranchRecord;

export type Branch = BranchRecord;

export type BranchApiResponse = {
  data?: BranchRecord[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};
