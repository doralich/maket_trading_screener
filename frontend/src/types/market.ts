export interface MarketUpdate {
  ticker: string;
  price?: number;
  last?: number;
  change?: number;
  volume?: number | string;
  [key: string]: any;
}
